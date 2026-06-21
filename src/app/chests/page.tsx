'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import AppSidebarMenu, { type SidebarMenuItem } from '@/components/AppSidebarMenu';
import { Navbar } from '@/components/Navbar';
import PageQuickLinksToolbar from '@/components/PageQuickLinksToolbar';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { useI18n } from '@/lib/i18n/i18n-context';
import { chestColumns, chestRows } from '@/lib/static/guides/chest-table';
import {
  avatarGuideDataBySection,
  type AvatarGuideData,
  type AvatarMode,
  type AvatarOption,
  type StageEntry,
} from '@/lib/static/guides/chests-avatar-data';

type RowKey =
  | 'season1'
  | 'season2'
  | 'season3'
  | 'season4'
  | 'season5'
  | 'stories1'
  | 'stories2';

type ColorKey = 'dark' | 'holy' | 'ice' | 'nature' | 'fire';

type GuideCard = {
  imageSrc: string;
  title: string;
  lines: string[];
};

type LocalizedAvatarBlock = AvatarGuideData & {
  title: string;
  subtitle: string;
  bossesLabel: string;
  mobsLabel: string;
  stagesLabel: string;
  emptyState: string;
  modeLabels: Record<AvatarMode, string>;
};

type LocalizedSection = {
  rowKey: Exclude<RowKey, 'season1'>;
  anchorId: string;
  emblemSrc: string;
  title: string;
  subtitle: string;
  guideCards: GuideCard[];
  chestValues: Record<ColorKey, string>;
  energyValues: Record<ColorKey, string>;
  avatarBlock?: LocalizedAvatarBlock;
};

type SectionBase = Omit<LocalizedSection, 'subtitle' | 'guideCards' | 'avatarBlock'> & {
  recruits: string[];
  experience: string[];
};

const hardLine = (value: string, hardLabel: string) => `${value} (${hardLabel})`;

export default function ChestsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { locale, messages } = useI18n();

  const t = useMemo(() => {
    const common =
      locale === 'ru'
        ? {
            title: 'Сундуки & Авы',
            subtitle:
              'Таблица по сундукам и блоки по аватаркам для сезонов и историй. Выбирай нужную категорию и сразу смотри подходящие этапы карты.',
            tableTitle: 'Таблица сундуков',
            tableSubtitle:
              'Нажми на Сезон 2, 3, 4, 5 или Истории, чтобы быстро перейти к нужному разделу ниже.',
            season: 'Сезон',
            backHome: 'Главная',
            backHeroes: 'Герои',
            backAlliances: 'Альянсы',
            recruits: 'Рекруты',
            experience: 'Опыт',
            backpacks: 'Рюкзаки',
            avatars: 'Аватарки',
            colorChests: 'Цветные сундуки',
            energy: 'Энергия',
            hard: 'Сложно',
            unknownEnergy: '?',
            copyLink: 'Скопировать',
            copiedLink: 'Ссылка скопирована',
            sectionSubtitle:
              'Краткий ориентир по лучшим этапам для рекрутов, опыта, рюкзаков, цветных сундуков и энергии.',
            avatarSubtitle:
              'Выбери режим: только боссы, только мобы или обе категории сразу. Затем отметь нужные награды и смотри подходящие этапы карты.',
            bossesLabel: 'Боссы',
            mobsLabel: 'Мобы',
            stagesLabel: 'Этапы карты',
            emptyState: 'Для этой комбинации этапы пока не указаны.',
            modeLabels: {
              both: 'Оба сразу',
              bosses: 'Только боссы',
              mobs: 'Только мобы',
            } as Record<AvatarMode, string>,
            rows: {
              season1: 'Сезон 1',
              season2: 'Сезон 2',
              season3: 'Сезон 3',
              season4: 'Сезон 4',
              season5: 'Сезон 5',
              stories1: 'Истории 1',
              stories2: 'Истории 2',
            } as Record<RowKey, string>,
          }
        : {
            title: 'Chests & Avatars',
            subtitle:
              'Chest reference plus avatar guides for seasons and stories. Pick a category and jump straight to the best map stages.',
            tableTitle: 'Chest table',
            tableSubtitle:
              'Tap Season 2, 3, 4, 5, or Stories to jump directly to the section you need below.',
            season: 'Season',
            backHome: 'Home',
            backHeroes: 'Heroes',
            backAlliances: 'Alliances',
            recruits: 'Recruits',
            experience: 'Experience',
            backpacks: 'Backpacks',
            avatars: 'Avatars',
            colorChests: 'Color chests',
            energy: 'Energy',
            hard: 'Hard',
            unknownEnergy: '?',
            copyLink: 'Copy',
            copiedLink: 'Link copied',
            sectionSubtitle:
              'Quick reference for the best stages for recruits, experience, backpacks, color chests, and energy.',
            avatarSubtitle:
              'Choose a mode: bosses only, mobs only, or both together. Then select the reward tiers and check the matching map stages.',
            bossesLabel: 'Bosses',
            mobsLabel: 'Mobs',
            stagesLabel: 'Map stages',
            emptyState: 'No stages are listed for this selection yet.',
            modeLabels: {
              both: 'Both',
              bosses: 'Bosses only',
              mobs: 'Mobs only',
            } as Record<AvatarMode, string>,
            rows: {
              season1: 'Season 1',
              season2: 'Season 2',
              season3: 'Season 3',
              season4: 'Season 4',
              season5: 'Season 5',
              stories1: 'Stories 1',
              stories2: 'Stories 2',
            } as Record<RowKey, string>,
          };

    const baseSections: SectionBase[] =
      locale === 'ru'
        ? [
            {
              rowKey: 'season2',
              anchorId: 'season-2',
              emblemSrc: '/guides/seasons/season-2-emblem.png',
              title: 'Сезон 2 (Атлантида)',
              recruits: ['6-9', hardLine('15-8', common.hard)],
              experience: ['9-10', hardLine('6-10', common.hard)],
              chestValues: { dark: '21-10', holy: '13-1', ice: '8-2', nature: '7-1', fire: '3-8' },
              energyValues: { dark: '~54', holy: '~33', ice: '~33', nature: '~30', fire: '~36' },
            },
            {
              rowKey: 'season3',
              anchorId: 'season-3',
              emblemSrc: '/guides/seasons/season-3.png',
              title: 'Сезон 3 (Вальхалла)',
              recruits: ['8-10'],
              experience: ['10-8', hardLine('8-10', common.hard)],
              chestValues: { dark: '17-9', holy: '8-6', ice: '9-8', nature: '4-8', fire: '6-2' },
              energyValues: { dark: '~60', holy: '~33', ice: '~36', nature: '~36', fire: '~36' },
            },
            {
              rowKey: 'season4',
              anchorId: 'season-4',
              emblemSrc: '/guides/seasons/season-4.png',
              title: 'Сезон 4 (Путешественники Бездны)',
              recruits: ['10-7'],
              experience: ['10-9', hardLine('8-10', common.hard)],
              chestValues: { dark: '8-6', holy: '4-7', ice: '8-2', nature: '9-2', fire: '12-6' },
              energyValues: { dark: '~66', holy: '~33', ice: '~30', nature: '~30', fire: '~72' },
            },
            {
              rowKey: 'season5',
              anchorId: 'season-5',
              emblemSrc: '/guides/seasons/season-5.png',
              title: 'Сезон 5 (Династия Дюн)',
              recruits: ['8-6'],
              experience: ['10-8', hardLine('15-10', common.hard)],
              chestValues: { dark: '5-10', holy: '16-8', ice: '22-2', nature: '10-8', fire: '2-9' },
              energyValues: { dark: '~33', holy: '~84', ice: '~60', nature: '~33', fire: '~36' },
            },
            {
              rowKey: 'stories1',
              anchorId: 'stories-1',
              emblemSrc: '/guides/seasons/season-story-1.png',
              title: 'Истории 1 (Нерассказанные истории I: Тайны глубин)',
              recruits: ['1-26', hardLine('3-4', common.hard)],
              experience: ['2-10', hardLine('6-27', common.hard)],
              chestValues: { dark: '5-10', holy: '16-8', ice: '22-2', nature: '10-8', fire: '2-9' },
              energyValues: { dark: common.unknownEnergy, holy: common.unknownEnergy, ice: common.unknownEnergy, nature: common.unknownEnergy, fire: common.unknownEnergy },
            },
            {
              rowKey: 'stories2',
              anchorId: 'stories-2',
              emblemSrc: '/guides/seasons/season-story-2.png',
              title: 'Истории 2 (Нерассказанные истории II: Сокровища пламени и мороза)',
              recruits: ['1-28'],
              experience: ['1-28'],
              chestValues: { dark: '5-10', holy: '16-8', ice: '22-2', nature: '10-8', fire: '2-9' },
              energyValues: { dark: common.unknownEnergy, holy: common.unknownEnergy, ice: common.unknownEnergy, nature: common.unknownEnergy, fire: common.unknownEnergy },
            },
          ]
        : [
            {
              rowKey: 'season2',
              anchorId: 'season-2',
              emblemSrc: '/guides/seasons/season-2-emblem.png',
              title: 'Season 2 (Atlantis)',
              recruits: ['6-9', hardLine('15-8', common.hard)],
              experience: ['9-10', hardLine('6-10', common.hard)],
              chestValues: { dark: '21-10', holy: '13-1', ice: '8-2', nature: '7-1', fire: '3-8' },
              energyValues: { dark: '~54', holy: '~33', ice: '~33', nature: '~30', fire: '~36' },
            },
            {
              rowKey: 'season3',
              anchorId: 'season-3',
              emblemSrc: '/guides/seasons/season-3.png',
              title: 'Season 3 (Valhalla)',
              recruits: ['8-10'],
              experience: ['10-8', hardLine('8-10', common.hard)],
              chestValues: { dark: '17-9', holy: '8-6', ice: '9-8', nature: '4-8', fire: '6-2' },
              energyValues: { dark: '~60', holy: '~33', ice: '~36', nature: '~36', fire: '~36' },
            },
            {
              rowKey: 'season4',
              anchorId: 'season-4',
              emblemSrc: '/guides/seasons/season-4.png',
              title: 'Season 4 (Voyagers of the Underwild)',
              recruits: ['10-7'],
              experience: ['10-9', hardLine('8-10', common.hard)],
              chestValues: { dark: '8-6', holy: '4-7', ice: '8-2', nature: '9-2', fire: '12-6' },
              energyValues: { dark: '~66', holy: '~33', ice: '~30', nature: '~30', fire: '~72' },
            },
            {
              rowKey: 'season5',
              anchorId: 'season-5',
              emblemSrc: '/guides/seasons/season-5.png',
              title: 'Season 5 (Dynasty of Dune)',
              recruits: ['8-6'],
              experience: ['10-8', hardLine('15-10', common.hard)],
              chestValues: { dark: '5-10', holy: '16-8', ice: '22-2', nature: '10-8', fire: '2-9' },
              energyValues: { dark: '~33', holy: '~84', ice: '~60', nature: '~33', fire: '~36' },
            },
            {
              rowKey: 'stories1',
              anchorId: 'stories-1',
              emblemSrc: '/guides/seasons/season-story-1.png',
              title: 'Stories 1 (Untold Tales I: Mysteries of the Deep)',
              recruits: ['1-26', hardLine('3-4', common.hard)],
              experience: ['2-10', hardLine('6-27', common.hard)],
              chestValues: { dark: '5-10', holy: '16-8', ice: '22-2', nature: '10-8', fire: '2-9' },
              energyValues: { dark: common.unknownEnergy, holy: common.unknownEnergy, ice: common.unknownEnergy, nature: common.unknownEnergy, fire: common.unknownEnergy },
            },
            {
              rowKey: 'stories2',
              anchorId: 'stories-2',
              emblemSrc: '/guides/seasons/season-story-2.png',
              title: 'Stories 2 (Untold Tales II: Treasures of Flame and Frost)',
              recruits: ['1-28'],
              experience: ['1-28'],
              chestValues: { dark: '5-10', holy: '16-8', ice: '22-2', nature: '10-8', fire: '2-9' },
              energyValues: { dark: common.unknownEnergy, holy: common.unknownEnergy, ice: common.unknownEnergy, nature: common.unknownEnergy, fire: common.unknownEnergy },
            },
          ];

    const sections = baseSections.map((section) => {
      const avatarData = avatarGuideDataBySection[section.rowKey];
      const guideCards: GuideCard[] = [
        { imageSrc: '/guides/seasons/recruits.png', title: common.recruits, lines: section.recruits },
        { imageSrc: '/guides/seasons/experience.png', title: common.experience, lines: section.experience },
      ];

      if (avatarData) {
        guideCards.push({ imageSrc: '/guides/seasons/adventurers-kit.webp', title: common.backpacks, lines: [avatarData.backpackStage] });
      }

      return {
        ...section,
        subtitle: common.sectionSubtitle,
        guideCards,
        avatarBlock: avatarData
          ? {
              ...avatarData,
              title: common.avatars,
              subtitle: common.avatarSubtitle,
              bossesLabel: common.bossesLabel,
              mobsLabel: common.mobsLabel,
              stagesLabel: common.stagesLabel,
              emptyState: common.emptyState,
              modeLabels: common.modeLabels,
            }
          : undefined,
      } satisfies LocalizedSection;
    });

    return { ...common, sections };
  }, [locale]);

  const sidebarItems: SidebarMenuItem[] = [
    { key: 'home', href: '/', label: t.backHome },
    { key: 'heroes', href: '/heroes', label: t.backHeroes },
    { key: 'hero-coach', href: '/hero-coach', label: messages.home.navHeroCoach },
    { key: 'outfitter', href: '/outfitter', label: messages.home.navOutfitter },
    { key: 'alliance', href: '/alliance', label: t.backAlliances },
  ];

  const sectionAnchorByRow = useMemo(
    () =>
      Object.fromEntries(t.sections.map((section) => [section.rowKey, section.anchorId])) as Partial<Record<RowKey, string>>,
    [t.sections],
  );

  return (
    <div className="flex min-h-screen scroll-smooth flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
      <AppSidebarMenu isOpen={isSidebarOpen} items={sidebarItems} onClose={() => setSidebarOpen(false)} title={messages.home.menuTitle} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 md:px-6">
        <PageQuickLinksToolbar currentPath="/chests" className="flex flex-wrap justify-center gap-4" />

        <section className="overflow-hidden rounded-[2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_42%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t.title}</div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">{t.tableTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">{t.subtitle}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-6">
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-[var(--foreground)] md:text-2xl">{t.tableTitle}</h2>
              <CopyLinkButton href="/chests" copyLabel={t.copyLink} copiedLabel={t.copiedLink} />
            </div>
            <p className="mt-2 text-sm text-[var(--foreground-soft)]">{t.tableSubtitle}</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[740px]">
              <div className="grid grid-cols-[124px_repeat(6,minmax(96px,1fr))] gap-3">
                <div className="sticky left-0 z-10 flex items-end rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{t.season}</div>

                {chestColumns.map((column) => (
                  <div key={column.key} className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.12)]">
                    <Image src={column.imageSrc} alt={column.alt} width={72} height={72} className="h-16 w-16 object-contain md:h-[72px] md:w-[72px]" />
                  </div>
                ))}

                {chestRows.map((row) => (
                  <ChestTableRow key={row.key} rowKey={row.key} label={t.rows[row.key]} values={row.values} anchorId={sectionAnchorByRow[row.key]} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {t.sections.map((section) => (
          <SeasonSection key={section.rowKey} section={section} colorChestsLabel={t.colorChests} energyLabel={t.energy} copyLabel={t.copyLink} copiedLabel={t.copiedLink} />
        ))}
      </main>

      <ScrollToTopButton />
    </div>
  );
}

function SeasonSection({ section, colorChestsLabel, energyLabel, copyLabel, copiedLabel }: { section: LocalizedSection; colorChestsLabel: string; energyLabel: string; copyLabel: string; copiedLabel: string; }) {
  const cardsGridClass = section.guideCards.length >= 3 ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-4 md:grid-cols-2';

  return (
    <section id={section.anchorId} className="scroll-mt-24 rounded-[2rem] border border-cyan-400/16 bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/18 bg-cyan-400/10 p-3 shadow-[0_18px_32px_rgba(34,211,238,0.12)]">
          <Image src={section.emblemSrc} alt={section.title} width={80} height={80} className="h-full w-full object-contain" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">{section.title}</h2>
            <CopyLinkButton href={`/chests#${section.anchorId}`} copyLabel={copyLabel} copiedLabel={copiedLabel} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">{section.subtitle}</p>
        </div>
      </div>

      <div className={cardsGridClass}>
        {section.guideCards.map((card) => <InfoCard key={`${section.anchorId}-${card.title}`} imageSrc={card.imageSrc} title={card.title} lines={card.lines} />)}
      </div>

      {section.avatarBlock ? <AvatarGuideCard block={section.avatarBlock} /> : null}

      <div className="mt-6 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.12)] md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{colorChestsLabel} / {energyLabel}</div>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          <EnergyValueCard energyImageAlt={energyLabel} />
          <ChestValueCard imageSrc={chestColumns[1].imageSrc} alt={chestColumns[1].alt} value={section.chestValues.dark} energyValue={section.energyValues.dark} />
          <ChestValueCard imageSrc={chestColumns[2].imageSrc} alt={chestColumns[2].alt} value={section.chestValues.holy} energyValue={section.energyValues.holy} />
          <ChestValueCard imageSrc={chestColumns[3].imageSrc} alt={chestColumns[3].alt} value={section.chestValues.ice} energyValue={section.energyValues.ice} />
          <ChestValueCard imageSrc={chestColumns[4].imageSrc} alt={chestColumns[4].alt} value={section.chestValues.nature} energyValue={section.energyValues.nature} />
          <ChestValueCard imageSrc={chestColumns[5].imageSrc} alt={chestColumns[5].alt} value={section.chestValues.fire} energyValue={section.energyValues.fire} />
        </div>
      </div>
    </section>
  );
}

function AvatarGuideCard({ block }: { block: LocalizedAvatarBlock }) {
  const [selectedBossId, setSelectedBossId] = useState<string | null>(block.bossOptions[0]?.id ?? null);
  const [selectedMobId, setSelectedMobId] = useState<string | null>(block.mobOptions[0]?.id ?? null);

  const stageEntries = useMemo(() => {
    if (selectedBossId && selectedMobId) {
      return block.combinations.find((stageSet) => stageSet.bossId === selectedBossId && stageSet.mobId === selectedMobId)?.stages ?? [];
    }

    if (selectedBossId) {
      return block.singleBossStages.find((stageSet) => stageSet.id === selectedBossId)?.stages ?? [];
    }

    if (selectedMobId) {
      return block.singleMobStages.find((stageSet) => stageSet.id === selectedMobId)?.stages ?? [];
    }

    return [];
  }, [block.combinations, block.singleBossStages, block.singleMobStages, selectedBossId, selectedMobId]);

  return (
    <div className="mt-6 rounded-[1.75rem] border border-cyan-400/16 bg-[var(--surface)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)] md:p-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{block.title}</div>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)]">{block.subtitle}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <AvatarOptionsColumn title={block.bossesLabel} options={block.bossOptions} selectedId={selectedBossId} onSelect={setSelectedBossId} />
        <AvatarOptionsColumn title={block.mobsLabel} options={block.mobOptions} selectedId={selectedMobId} onSelect={setSelectedMobId} />
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{block.stagesLabel}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {stageEntries.length ? stageEntries.map((stageEntry) => <StageBadge key={stageEntry.label + String(stageEntry.featured)} entry={stageEntry} />) : <span className="text-sm text-[var(--foreground-soft)]">{block.emptyState}</span>}
        </div>
      </div>
    </div>
  );
}

function AvatarOptionsColumn({ title, options, selectedId, onSelect }: { title: string; options: AvatarOption[]; selectedId: string | null; onSelect: (id: string | null) => void; }) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{title}</div>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : option.id)}
              className={`flex flex-col items-center gap-2 rounded-[1.25rem] border px-2 py-3 text-center shadow-[0_14px_32px_rgba(0,0,0,0.10)] transition sm:gap-3 sm:px-4 sm:py-4 ${isSelected ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-[var(--border)] bg-[var(--surface-strong)] hover:border-cyan-400/22 hover:bg-[var(--surface-hover)]'}`}
            >
              <Image src={option.imageSrc} alt={option.amount} width={96} height={96} className="h-14 w-14 object-contain sm:h-20 sm:w-20" />
              <span className="rounded-full border border-cyan-400/16 bg-cyan-400/10 px-2 py-1 text-[11px] font-bold text-cyan-300 sm:px-3 sm:text-sm">{option.amount}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageBadge({ entry }: { entry: StageEntry }) {
  return <span className={`rounded-full border px-3 py-1 text-sm font-bold ${entry.featured ? 'border-amber-300/40 bg-amber-300/14 text-amber-100' : 'border-cyan-400/16 bg-cyan-400/10 text-cyan-300'}`}>{entry.label}</span>;
}

function CopyLinkButton({ href, copyLabel, copiedLabel }: { href: string; copyLabel: string; copiedLabel: string; }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === 'undefined') return;
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
      {copied ? <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-slate-700/95 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-lg">{copiedLabel}</div> : null}
      <button
        type="button"
        onClick={() => void handleCopy()}
        title={copied ? copiedLabel : copyLabel}
        aria-label={copied ? copiedLabel : copyLabel}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${copied ? 'border-emerald-400/35 bg-emerald-400/10 text-[var(--success-text)]' : 'border-cyan-400/18 bg-cyan-400/10 text-[var(--info-text)] hover:border-cyan-400/28'}`}
      >
        {copied ? (
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none"><rect x="5" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><rect x="3" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>
        )}
      </button>
    </div>
  );
}

function ChestTableRow({ rowKey, label, values, anchorId }: { rowKey: string; label: string; values: string[]; anchorId?: string; }) {
  const labelContent = anchorId ? (
    <a href={`#${anchorId}`} className="font-semibold text-cyan-300 underline decoration-cyan-300/55 underline-offset-4 transition hover:text-cyan-200 hover:decoration-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60" title={label} aria-label={label}>
      {label}
    </a>
  ) : label;

  return (
    <>
      <div className="sticky left-0 z-10 flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-4 text-sm font-semibold leading-snug text-[var(--foreground)] shadow-[0_14px_36px_rgba(0,0,0,0.10)]">{labelContent}</div>
      {values.map((value, index) => (
        <div key={`${rowKey}-${index}`} className="group flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-4 text-center shadow-[0_14px_36px_rgba(0,0,0,0.10)] transition hover:border-cyan-400/20 hover:bg-[var(--surface-hover)]">
          <span className="rounded-full border border-cyan-400/16 bg-cyan-400/10 px-3 py-1 text-sm font-bold tracking-wide text-cyan-300 transition group-hover:border-cyan-400/24">{value}</span>
        </div>
      ))}
    </>
  );
}

function InfoCard({ imageSrc, title, lines }: { imageSrc: string; title: string; lines: string[]; }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-3">
        <Image src={imageSrc} alt={title} width={80} height={80} className="h-full w-full object-contain" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{title}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {lines.map((line) => <span key={line} className="rounded-full border border-cyan-400/16 bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-300">{line}</span>)}
        </div>
      </div>
    </div>
  );
}

function ChestValueCard({ imageSrc, alt, value, energyValue }: { imageSrc: string; alt: string; value: string; energyValue?: string; }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-4 shadow-[0_14px_36px_rgba(0,0,0,0.10)]">
      <Image src={imageSrc} alt={alt} width={64} height={64} className="h-14 w-14 object-contain" />
      <span className="rounded-full border border-cyan-400/16 bg-cyan-400/10 px-3 py-1 text-sm font-bold tracking-wide text-cyan-300">{value}</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/16 bg-cyan-400/8 px-2.5 py-1 text-xs font-semibold tracking-wide text-cyan-300">
        <Image src="/guides/seasons/energy.png" alt="Energy" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
        {energyValue}
      </span>
    </div>
  );
}

function EnergyValueCard({ energyImageAlt }: { energyImageAlt: string; }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 opacity-70 shadow-[0_14px_36px_rgba(0,0,0,0.08)]">
      <Image src="/guides/seasons/energy.png" alt={energyImageAlt} width={64} height={64} className="h-14 w-14 object-contain" />
    </div>
  );
}
