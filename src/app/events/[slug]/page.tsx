'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { getEventGuideBySlug } from '@/lib/static/events';

type QuickLinkItem = {
  label: string;
  href: string;
  imageSrc: string;
  imageClassName?: string;
  authHint?: string;
};

type EventSection = {
  anchorId: string;
  title: string;
  content: ReactNode;
};

function SectionText({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm leading-7 text-[var(--foreground-soft)] md:text-base ${className}`}>
      {children}
    </p>
  );
}

function SectionList({
  items,
}: {
  items: ReactNode[];
}) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--foreground-soft)] md:text-base">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function SectionSubtitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 text-lg font-bold tracking-tight text-[var(--foreground)] md:text-xl">
      {children}
    </h3>
  );
}

function CopyLinkButton({
  href,
  copyLabel,
  copiedLabel,
}: {
  href: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(href, window.location.origin);

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative inline-flex">
      {copied ? (
        <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-slate-700/95 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-lg">
          {copiedLabel}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => void handleCopy()}
        title={copied ? copiedLabel : copyLabel}
        aria-label={copied ? copiedLabel : copyLabel}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
          copied
            ? 'border-emerald-400/35 bg-emerald-400/10 text-[var(--success-text)]'
            : 'border-cyan-400/18 bg-cyan-400/10 text-[var(--info-text)] hover:border-cyan-400/28'
        }`}
      >
        {copied ? (
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
            <rect x="5" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="3" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>
    </div>
  );
}

function ZoomableOverviewImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const pinchStateRef = useRef<{ distance: number; scale: number } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setScale(1);
        setOffset({ x: 0, y: 0 });
        setIsDragging(false);
        dragStateRef.current = { x: 0, y: 0, active: false };
        pinchStateRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const clampOffset = (nextOffset: { x: number; y: number }, nextScale: number) => {
    const viewport = viewportRef.current;

    if (!viewport || nextScale <= 1) {
      return { x: 0, y: 0 };
    }

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const maxX = Math.max(0, ((width * nextScale) - width) / 2);
    const maxY = Math.max(0, ((height * nextScale) - height) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  };

  const applyScale = (updater: (prev: number) => number) => {
    setScale((prev) => {
      const next = updater(prev);
      setOffset((currentOffset) => clampOffset(currentOffset, next));
      return next;
    });
  };

  const zoomIn = () => applyScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => applyScale((prev) => Math.max(prev - 0.25, 0.75));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStateRef.current = { x: 0, y: 0, active: false };
    pinchStateRef.current = null;
  };
  const close = () => {
    setOpen(false);
    resetView();
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (scale <= 1) {
      return;
    }

    dragStateRef.current = {
      x: clientX - offset.x,
      y: clientY - offset.y,
      active: true,
    };
    setIsDragging(true);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragStateRef.current.active || scale <= 1) {
      return;
    }

    setOffset(
      clampOffset(
        {
          x: clientX - dragStateRef.current.x,
          y: clientY - dragStateRef.current.y,
        },
        scale,
      ),
    );
  };

  const endDrag = () => {
    dragStateRef.current.active = false;
    setIsDragging(false);
  };

  const getTouchDistance = (
    touches: { item: (index: number) => { clientX: number; clientY: number } | null },
  ) => {
    const firstTouch = touches.item(0);
    const secondTouch = touches.item(1);

    if (!firstTouch || !secondTouch) {
      return 0;
    }

    const dx = firstTouch.clientX - secondTouch.clientX;
    const dy = firstTouch.clientY - secondTouch.clientY;
    return Math.hypot(dx, dy);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full transition hover:opacity-95"
        aria-label={alt}
      >
        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
          <div className="relative aspect-[557/964] w-full">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-contain"
            />
          </div>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw] overflow-auto rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={zoomOut}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                aria-label="Zoom out"
              >
                -
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetView}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                Сбросить
              </button>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                Закрыть
              </button>
            </div>

            <div
              ref={viewportRef}
              className="relative overflow-hidden"
              style={{ width: 'min(92vw, 960px)', aspectRatio: '557 / 964' }}
            >
              <div
                className="relative origin-center select-none"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  touchAction: 'none',
                  transition: isDragging ? 'none' : 'transform 120ms ease-out',
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  startDrag(event.clientX, event.clientY);
                }}
                onMouseMove={(event) => moveDrag(event.clientX, event.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onWheel={(event) => {
                  event.preventDefault();
                  applyScale((prev) => Math.max(0.75, Math.min(3, prev + (event.deltaY < 0 ? 0.15 : -0.15))));
                }}
                onTouchStart={(event) => {
                  if (event.touches.length === 2) {
                    pinchStateRef.current = {
                      distance: getTouchDistance(event.touches),
                      scale,
                    };
                    dragStateRef.current.active = false;
                    setIsDragging(false);
                    return;
                  }

                  if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    startDrag(touch.clientX, touch.clientY);
                  }
                }}
                onTouchMove={(event) => {
                  if (event.touches.length === 2 && pinchStateRef.current) {
                    const nextDistance = getTouchDistance(event.touches);
                    const ratio = nextDistance / pinchStateRef.current.distance;
                    const nextScale = Math.max(0.75, Math.min(3, pinchStateRef.current.scale * ratio));
                    setScale(nextScale);
                    setOffset((currentOffset) => clampOffset(currentOffset, nextScale));
                    return;
                  }

                  if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    moveDrag(touch.clientX, touch.clientY);
                  }
                }}
                onTouchEnd={() => {
                  endDrag();
                  pinchStateRef.current = null;
                }}
              >
                <div className="relative aspect-[557/964] w-full">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="92vw"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function buildBraveSections(locale: 'ru' | 'en'): EventSection[] {
  if (locale === 'ru') {
    return [
      {
        anchorId: 'overview',
        title: 'Таблица события',
        content: (
          <div className="space-y-4">
            <SectionText>
              Краткая таблица с основными правилами, этапами, порталами и наградами события.
            </SectionText>
            <ZoomableOverviewImage
              src="/events/brave-beautiful/overview.webp"
              alt="The Brave & The Beautiful overview"
            />
          </div>
        ),
      },
      {
        anchorId: 'hero-bonus',
        title: 'Герои события',
        content: (
          <div className="space-y-4">
            <SectionText>
              Как и в других похожих событиях, герои текущего ивента получают бонусы в Alliance Quest <em>The Brave & The Beautiful</em>.
            </SectionText>
            <SectionSubtitle>Конкретно</SectionSubtitle>
            <SectionList
              items={[
                <>Герои семей <strong>Musketeer</strong> и <strong>Beauty and the Beast</strong> игнорируют Элементальные Барьеры.</>,
                <>Также они получают <strong>+20% к атаке</strong>, <strong>+20% к защите</strong> и <strong>+20% к здоровью</strong>.</>,
              ]}
            />
            <SectionSubtitle>Важно</SectionSubtitle>
            <SectionList
              items={[
                <>Бонус работает <strong>только</strong> внутри Alliance Quest <em>The Brave & The Beautiful</em>.</>,
                <>Бонус не требует уникальных героев: его получают все герои этих семей, если они участвуют в событии.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'special-gameplay',
        title: 'Особая механика',
        content: (
          <div className="space-y-4">
            <SectionText>
              Главная механика события называется <strong>All For One!</strong>
            </SectionText>
            <SectionSubtitle>Мушкетёрские щиты</SectionSubtitle>
            <SectionList
              items={[
                <>Если собрать комбинацию из 4 камней, вместо Dragon Shield появляется <strong>Musketeer Shield</strong>.</>,
                <>При совпадении он взрывается как обычный Dragon Shield.</>,
                <>Дополнительно он уничтожает 4 соседних тайла: вверх, вниз, влево и вправо.</>,
                <>Также он снимает бафы со всех врагов.</>,
              ]}
            />
            <SectionSubtitle>Элитный мушкетёрский щит</SectionSubtitle>
            <SectionList
              items={[
                <>Если собрать комбинацию из 5 камней, вместо Power Shard появляется <strong>Elite Musketeer Shield</strong>.</>,
                <>При совпадении он уничтожает весь ряд и всю колонку.</>,
                <>Также он снимает бафы со всех врагов.</>,
              ]}
            />
            <SectionSubtitle>Усиление специальных щитов</SectionSubtitle>
            <SectionList
              items={[
                <>Если специальные щиты не активировать сразу, их сила увеличивается на <strong>20%</strong> каждый ход.</>,
                <>Максимум усиления: <strong>200%</strong>.</>,
              ]}
            />
            <SectionSubtitle>Важный момент</SectionSubtitle>
            <SectionList
              items={[
                <>Бафы врагов снимаются <strong>до</strong> того, как урон от тайлов долетит до врагов.</>,
                <>Например, если на враге был контрудар, то после снятия бафа ваши герои не получат урон от контратаки.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'extra-challenge',
        title: 'Дополнительное испытание',
        content: (
          <div className="space-y-4">
            <SectionText>
              Дополнительный модификатор события называется <strong>Fortification</strong>.
            </SectionText>
            <SectionList
              items={[
                <>Каждые <strong>5 ходов</strong> все враги получают <strong>+30% к защите</strong> на 3 хода.</>,
                <>Каждые <strong>5 ходов</strong> все враги получают <strong>контратаку на 100% полученного урона</strong> на 3 хода.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'difficulty-unlock',
        title: 'Разблокировка сложности',
        content: (
          <div className="space-y-4">
            <SectionSubtitle>Epic</SectionSubtitle>
            <SectionList items={[<>Открывается, когда альянс набирает <strong>2 500 000</strong> очков.</>]} />
            <SectionSubtitle>Legendary</SectionSubtitle>
            <SectionList items={[<>Открывается, когда альянс набирает <strong>10 000 000</strong> очков.</>]} />
          </div>
        ),
      },
      {
        anchorId: 'summoning-odds',
        title: 'Шансы призыва',
        content: (
          <div className="space-y-4">
            <SectionText>
              В событии доступен отдельный портал призыва <em>The Brave & The Beautiful</em>.
            </SectionText>
            <SectionText>
              В портале доступны герои семей <strong>Musketeer</strong> и <strong>Beauty and the Beast</strong>.
            </SectionText>
            <SectionSubtitle>Классические герои</SectionSubtitle>
            <SectionList
              items={[
                <>Редкий: <strong>64.3%</strong></>,
                <>Эпический: <strong>20.8%</strong></>,
                <>Легендарный: <strong>1.2%</strong></>,
              ]}
            />
            <SectionSubtitle>Ивентовые герои</SectionSubtitle>
            <SectionList
              items={[
                <>Редкий: <strong>6.7%</strong></>,
                <>Эпический: <strong>5.7%</strong></>,
                <>Легендарный: <strong>0.3%</strong></>,
                <>Избранный легендарный: <strong>1.0%</strong></>,
              ]}
            />
            <SectionText>(Костюм включён, если доступен)</SectionText>
            <SectionSubtitle>Bonus Draw</SectionSubtitle>
            <SectionList items={[<>Легендарный Герой Месяца: <strong>1.3%</strong></>]} />
          </div>
        ),
      },
      {
        anchorId: 'event-coins',
        title: 'Монеты события и стоимость призыва',
        content: (
          <div className="space-y-4">
            <SectionText>
              Событие использует стандартные <strong>Alliance Quest Coins</strong>, как и другие Alliance Quest.
            </SectionText>
            <SectionSubtitle>Важно</SectionSubtitle>
            <SectionList
              items={[
                <>В событии нет <strong>Suspicious Chests</strong>.</>,
                <>Монеты можно получить только за первое прохождение этапов.</>,
              ]}
            />
            <SectionSubtitle>Стоимость</SectionSubtitle>
            <SectionList
              items={[
                <>1 призыв: <strong>10 монет</strong> или <strong>350 гемов</strong>.</>,
                <>10 призывов: <strong>3000 гемов</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'event-information',
        title: 'Информация о событии',
        content: (
          <div className="space-y-4">
            <SectionText>
              Событие использует классическую систему Challenge Event: <strong>Rare</strong>, <strong>Epic</strong>, <strong>Legendary</strong>.
            </SectionText>
            <SectionText>
              Но, как и LoV / Starfall Circus / Slayers, используется старый формат с <strong>10 этапами</strong> на каждую сложность.
            </SectionText>
          </div>
        ),
      },
      {
        anchorId: 'alliance-quest-rules',
        title: 'Правила Alliance Quest',
        content: (
          <div className="space-y-4">
            <SectionText>
              Цель события: набрать как можно больше очков альянса.
            </SectionText>
            <SectionText>
              Побеждают альянсы с наибольшим <strong>Alliance Quest Score</strong>.
            </SectionText>
            <SectionSubtitle>Как считается счёт</SectionSubtitle>
            <SectionList
              items={[
                <>Убитые враги.</>,
                <>Скорость прохождения.</>,
                <>Оставшееся здоровье героев.</>,
                <>Большие комбо.</>,
                <>Хорошие совпадения тайлов.</>,
              ]}
            />
            <SectionSubtitle>Continues</SectionSubtitle>
            <SectionText>
              Использование продолжений снижает итоговый счёт этапа.
            </SectionText>
            <SectionSubtitle>Кто может участвовать</SectionSubtitle>
            <SectionList
              items={[
                <>Только игроки, которые вступили в альянс <strong>до начала события</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'monster-lure',
        title: 'Приманка для монстров',
        content: (
          <div className="space-y-4">
            <SectionText>
              Во время события доступна специальная приманка для монстров Alliance Quest.
            </SectionText>
            <SectionList
              items={[
                <>Если активировать приманку, в квесте могут появляться редкие <strong>Inscrutable Mimes</strong>.</>,
                <>За каждого побеждённого мима гарантированно даётся <strong>1 Alliance Quest Coin</strong>.</>,
                <>За событие можно найти ограниченное количество мимов.</>,
                <>Прогресс отображается отдельной шкалой в окне Alliance Quest.</>,
              ]}
            />
            <SectionSubtitle>Дополнительно</SectionSubtitle>
            <SectionList
              items={[
                <>Inscrutable Mimes <strong>не влияют</strong> на игровой процесс.</>,
                <>Inscrutable Mimes <strong>не влияют</strong> на систему подсчёта очков.</>,
                <>Приманка работает только в текущем Alliance Quest: <strong>The Brave & The Beautiful</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'video-walkthrough',
        title: 'Видео с прохождением',
        content: (
          <div className="space-y-4">
            <SectionText>
              Видео:
              {' '}
              <a
                href="https://www.youtube.com/watch?v=EQF_uB35p1A"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                YouTube
              </a>
            </SectionText>
          </div>
        ),
      },
    ];
  }

  return [
    {
      anchorId: 'overview',
      title: 'Overview table',
      content: (
        <div className="space-y-4">
        <SectionText>
          Quick reference image with the main rules, stages, summon data, and event rewards.
        </SectionText>
        <ZoomableOverviewImage
          src="/events/brave-beautiful/overview.webp"
          alt="The Brave & The Beautiful overview"
        />
      </div>
      ),
    },
    {
      anchorId: 'hero-bonus',
      title: 'Event heroes',
      content: (
        <div className="space-y-4">
          <SectionText>
            As in other similar events, heroes from the current event receive bonuses in the <em>The Brave & The Beautiful</em> Alliance Quest.
          </SectionText>
          <SectionSubtitle>Specifically</SectionSubtitle>
          <SectionList
            items={[
              <>Heroes from the <strong>Musketeer</strong> and <strong>Beauty and the Beast</strong> families bypass Elemental Barriers.</>,
              <>They also receive <strong>+20% Attack</strong>, <strong>+20% Defense</strong>, and <strong>+20% Health</strong>.</>,
            ]}
          />
          <SectionSubtitle>Important</SectionSubtitle>
          <SectionList
            items={[
              <>This bonus applies <strong>only</strong> inside the <em>The Brave & The Beautiful</em> Alliance Quest.</>,
              <>The bonus is not limited to unique heroes. All featured heroes from these families receive it if they take part in the event.</>,
            ]}
          />
        </div>
      ),
    },
    {
      anchorId: 'special-gameplay',
      title: 'Special gameplay',
      content: (
        <div className="space-y-4">
          <SectionText>
            The main event mechanic is called <strong>All For One!</strong>
          </SectionText>
          <SectionSubtitle>Musketeer Shields</SectionSubtitle>
          <SectionList
            items={[
              <>When matching 4 shields, a <strong>Musketeer Shield</strong> appears instead of a Dragon Shield.</>,
              <>When matched, it explodes like a normal Dragon Shield.</>,
              <>It also clears 4 nearby tiles: up, down, left, and right.</>,
              <>It dispels buffs from all enemies.</>,
            ]}
          />
          <SectionSubtitle>Elite Musketeer Shield</SectionSubtitle>
          <SectionList
            items={[
              <>When matching 5 shields, an <strong>Elite Musketeer Shield</strong> appears instead of a Power Shard.</>,
              <>When matched, it destroys the whole row and column.</>,
              <>It also dispels buffs from all enemies.</>,
            ]}
          />
          <SectionSubtitle>Shield Power Increase</SectionSubtitle>
          <SectionList
            items={[
              <>If special shields are not activated immediately, their power increases by <strong>20%</strong> every turn.</>,
              <>The maximum power boost is <strong>200%</strong>.</>,
            ]}
          />
          <SectionSubtitle>Important note</SectionSubtitle>
          <SectionList
            items={[
              <>Enemy buffs are removed <strong>before</strong> tile damage is dealt.</>,
              <>For example, if enemies had counterattack active, your heroes will not take counterattack damage after the buff is removed.</>,
            ]}
          />
        </div>
      ),
    },
    {
      anchorId: 'extra-challenge',
      title: 'Extra challenge',
      content: (
        <div className="space-y-4">
          <SectionText>
            The extra event modifier is called <strong>Fortification</strong>.
          </SectionText>
          <SectionList
            items={[
              <>Every <strong>5 turns</strong>, all enemies gain <strong>+30% Defense</strong> for 3 turns.</>,
              <>Every <strong>5 turns</strong>, all enemies gain <strong>Counterattack for 100% of received damage</strong> for 3 turns.</>,
            ]}
          />
        </div>
      ),
    },
    {
      anchorId: 'difficulty-unlock',
      title: 'Difficulty unlock',
      content: (
        <div className="space-y-4">
          <SectionSubtitle>Epic</SectionSubtitle>
          <SectionList items={[<>Unlocked when the alliance reaches <strong>2,500,000</strong> total points.</>]} />
          <SectionSubtitle>Legendary</SectionSubtitle>
          <SectionList items={[<>Unlocked when the alliance reaches <strong>10,000,000</strong> total points.</>]} />
        </div>
      ),
    },
    {
      anchorId: 'summoning-odds',
      title: 'Summoning odds',
      content: (
        <div className="space-y-4">
          <SectionText>
            The event includes its own summon portal: <em>The Brave & The Beautiful</em>.
          </SectionText>
          <SectionText>
            Available hero families: <strong>Musketeer</strong> and <strong>Beauty and the Beast</strong>.
          </SectionText>
          <SectionSubtitle>Classic heroes</SectionSubtitle>
          <SectionList
            items={[
              <>Rare: <strong>64.3%</strong></>,
              <>Epic: <strong>20.8%</strong></>,
              <>Legendary: <strong>1.2%</strong></>,
            ]}
          />
          <SectionSubtitle>Event heroes</SectionSubtitle>
          <SectionList
            items={[
              <>Rare: <strong>6.7%</strong></>,
              <>Epic: <strong>5.7%</strong></>,
              <>Legendary: <strong>0.3%</strong></>,
              <>Featured Legendary: <strong>1.0%</strong></>,
            ]}
          />
          <SectionText>(Costume included if available)</SectionText>
          <SectionSubtitle>Bonus Draw</SectionSubtitle>
          <SectionList items={[<>Legendary Hero of the Month: <strong>1.3%</strong></>]} />
        </div>
      ),
    },
    {
      anchorId: 'event-coins',
      title: 'Event coins and summon cost',
      content: (
        <div className="space-y-4">
          <SectionText>
            The event uses standard <strong>Alliance Quest Coins</strong>, just like other Alliance Quests.
          </SectionText>
          <SectionSubtitle>Important</SectionSubtitle>
          <SectionList
            items={[
              <>There are no <strong>Suspicious Chests</strong> in the event.</>,
              <>Coins can only be earned from first-time stage completion.</>,
            ]}
          />
          <SectionSubtitle>Cost</SectionSubtitle>
          <SectionList
            items={[
              <>1 Summon: <strong>10 Coins</strong> or <strong>350 Gems</strong>.</>,
              <>10 Summons: <strong>3000 Gems</strong>.</>,
            ]}
          />
        </div>
      ),
    },
    {
      anchorId: 'event-information',
      title: 'Event information',
      content: (
        <div className="space-y-4">
          <SectionText>
            The event follows the classic Challenge Event structure: <strong>Rare</strong>, <strong>Epic</strong>, and <strong>Legendary</strong>.
          </SectionText>
          <SectionText>
            However, similar to LoV / Starfall Circus / Slayers, it uses the old format with only <strong>10 stages</strong> per difficulty.
          </SectionText>
        </div>
      ),
    },
    {
      anchorId: 'alliance-quest-rules',
      title: 'Alliance Quest rules',
      content: (
        <div className="space-y-4">
          <SectionText>
            The goal of Alliance Quest is to achieve the highest possible alliance score.
          </SectionText>
          <SectionText>
            Alliances with the highest <strong>Alliance Quest Score</strong> receive exclusive rewards.
          </SectionText>
          <SectionSubtitle>Score calculation</SectionSubtitle>
          <SectionList
            items={[
              <>Defeated enemies.</>,
              <>Completion speed.</>,
              <>Remaining hero health.</>,
              <>Large combos.</>,
              <>Strong tile matches.</>,
            ]}
          />
          <SectionSubtitle>Continues</SectionSubtitle>
          <SectionText>
            Using continues negatively affects the final stage score.
          </SectionText>
          <SectionSubtitle>Participation rules</SectionSubtitle>
          <SectionList
            items={[
              <>Only players who joined the alliance <strong>before the event started</strong> can participate.</>,
            ]}
          />
        </div>
      ),
    },
    {
      anchorId: 'monster-lure',
      title: 'Monster lure',
      content: (
        <div className="space-y-4">
          <SectionText>
            A special Alliance Quest Monster Lure is available during the event.
          </SectionText>
          <SectionList
            items={[
              <>If activated, rare <strong>Inscrutable Mimes</strong> can appear in the quest.</>,
              <>Every defeated Mime always drops <strong>1 Alliance Quest Coin</strong>.</>,
              <>The number of available Mimes during the event is limited.</>,
              <>Progress is shown as a dedicated bar inside the Alliance Quest interface.</>,
            ]}
          />
          <SectionSubtitle>Additional notes</SectionSubtitle>
          <SectionList
            items={[
              <>Inscrutable Mimes do <strong>not</strong> affect gameplay.</>,
              <>Inscrutable Mimes do <strong>not</strong> affect scoring.</>,
              <>The Monster Lure is active only during the current Alliance Quest: <strong>The Brave & The Beautiful</strong>.</>,
            ]}
          />
        </div>
      ),
    },
    {
      anchorId: 'video-walkthrough',
      title: 'Video walkthrough',
      content: (
        <div className="space-y-4">
          <SectionText>
            Video:
            {' '}
            <a
              href="https://www.youtube.com/watch?v=EQF_uB35p1A"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              https://www.youtube.com/watch?v=EQF_uB35p1A
            </a>
          </SectionText>
        </div>
      ),
    },
  ];
}

function EventSectionCard({
  section,
  eventPath,
  copyLabel,
  copiedLabel,
}: {
  section: EventSection;
  eventPath: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <section
      id={section.anchorId}
      className="scroll-mt-24 rounded-[2rem] border border-cyan-400/16 bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">
          {section.title}
        </h2>
        <CopyLinkButton
          href={`${eventPath}#${section.anchorId}`}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
        />
      </div>
      {section.content}
    </section>
  );
}

export default function EventDetailsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { authenticated } = useAuth();
  const { locale, messages } = useI18n();
  const params = useParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const eventItem = slug ? getEventGuideBySlug(slug) : null;

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
      { label: locale === 'ru' ? 'Сундуки' : 'Chests', href: '/chests', imageSrc: '/home-quick-links/guides.png' },
      { label: messages.home.navAlliances, href: '/alliance', imageSrc: '/home-quick-links/alliances.png' },
      {
        label: messages.home.navJointPurchases,
        href: '/joint-purchases',
        imageSrc: '/home-quick-links/joint-purchases.webp',
        authHint: authenticated ? undefined : messages.home.navJointPurchasesAuthHint,
      },
    ],
    [
      authenticated,
      locale,
      messages.home.navAlliances,
      messages.home.navHeroes,
      messages.home.navJointPurchases,
      messages.home.navJointPurchasesAuthHint,
    ],
  );

  if (!eventItem) {
    notFound();
  }

  const title = locale === 'ru' ? eventItem.titleRu : eventItem.titleEn;
  const eventPath = `/events/${eventItem.slug}`;
  const copyLabel = locale === 'ru' ? 'Скопировать' : 'Copy';
  const copiedLabel = locale === 'ru' ? 'Ссылка скопирована' : 'Link copied';
  const listLabel = locale === 'ru' ? 'Все события' : 'All events';
  const jumpLabel = locale === 'ru' ? 'Быстрый переход по разделам' : 'Jump to section';
  const jumpHint = locale === 'ru' ? 'Открыть список' : 'Open list';
  const sourceLabel = locale === 'ru' ? 'Вся информация взята с дискорда:' : 'All information is taken from Discord:';

  const isBravePage = eventItem.slug === 'the-brave-and-the-beautiful';
  const braveSections = isBravePage ? buildBraveSections(locale) : [];

  const placeholderText =
    locale === 'ru'
      ? 'Контент для этой страницы мы добавим следующим шагом.'
      : 'Content for this page will be added in the next step.';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-cyan-400">{messages.home.menuTitle}</h2>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageOne}
                </Link>
              </li>
              <li>
                <Link
                  href="/heroes"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageTwo}
                </Link>
              </li>
              <li>
                <Link
                  href="/joint-purchases"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  <span className="block">{messages.home.navJointPurchases}</span>
                  {!authenticated ? (
                    <span className="mt-1 block text-xs text-[var(--foreground-soft)]">
                      {messages.home.navJointPurchasesAuthHint}
                    </span>
                  ) : null}
                </Link>
              </li>
            </ul>
          </div>

          <div
            className="flex-1 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12">
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex w-20 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)] sm:w-32 sm:p-4"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-transform group-hover:scale-105 sm:mb-3 sm:h-16 sm:w-16">
                <Image
                  src={item.imageSrc}
                  alt={item.label}
                  width={64}
                  height={64}
                  className={item.imageClassName ?? 'h-9 w-9 object-contain sm:h-12 sm:w-12'}
                />
              </div>

              <span className="text-center text-[11px] font-semibold text-[var(--foreground-muted)] transition group-hover:text-blue-300 sm:text-xs">
                {item.label}
              </span>
              {item.authHint ? (
                <span className="mt-1 text-center text-[10px] font-medium text-[var(--foreground-soft)] sm:text-[11px]">
                  {item.authHint}
                </span>
              ) : null}
            </Link>
          ))}
        </div>

        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] transition hover:border-cyan-400/20 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            {listLabel}
          </Link>
        </div>

        <section className={`overflow-hidden rounded-[2rem] border p-[2px] ${eventItem.accentClassName}`}>
          <div className="rounded-[calc(2rem-2px)] bg-[var(--surface)] p-6 md:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-start gap-3 text-left">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_56%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="relative h-14 w-14 overflow-hidden sm:h-16 sm:w-16">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_58%)]" />
                    <Image
                      src={eventItem.previewImageSrc}
                      alt={title}
                      fill
                      sizes="64px"
                      className="relative z-10 scale-[0.9] object-contain p-2"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 items-center justify-start gap-2">
                  <h1 className="min-w-0 text-left text-[clamp(1.15rem,4.8vw,3rem)] font-black tracking-tight text-[var(--foreground)]">
                    {title}
                  </h1>
                  <CopyLinkButton href={eventPath} copyLabel={copyLabel} copiedLabel={copiedLabel} />
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
                  {locale === 'ru' ? 'Событие' : 'Event'}
                </div>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground-soft)] md:text-lg">
                  {isBravePage
                    ? locale === 'ru'
                      ? 'Полный разбор Alliance Quest'
                      : 'Full Alliance Quest breakdown with quick anchors, copy links, and the main overview table at the top of the page.'
                    : placeholderText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isBravePage ? (
          <>
            <details className="mt-8 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]">
                <div className="flex items-center justify-between gap-4">
                  <span>{jumpLabel}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-soft)]">
                    {jumpHint}
                  </span>
                </div>
              </summary>
              <div className="border-t border-[var(--border)] px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {braveSections.map((section) => (
                    <a
                      key={section.anchorId}
                      href={`#${section.anchorId}`}
                      className="rounded-full border border-cyan-400/16 bg-cyan-400/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition hover:border-cyan-400/28 hover:bg-cyan-400/12"
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </div>
            </details>

            <div className="mt-8 space-y-6">
              {braveSections.map((section) => (
                <EventSectionCard
                  key={section.anchorId}
                  section={section}
                  eventPath={eventPath}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                />
              ))}
            </div>

            <footer className="mt-8 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm leading-7 text-[var(--foreground-soft)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              <span>{sourceLabel} </span>
              <a
                href="https://discord.com/channels/1351108014765117450/1417756917987803207/threads/1437920534795915426"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                Discord
              </a>
            </footer>
          </>
        ) : (
          <section className="mt-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
            <SectionText>{placeholderText}</SectionText>
          </section>
        )}
      </main>
    </div>
  );
}
