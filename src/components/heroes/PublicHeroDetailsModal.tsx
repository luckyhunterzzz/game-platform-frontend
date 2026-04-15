'use client';

import { useMemo, useState } from 'react';
import DictionaryModal from './admin/DictionaryModal';
import HeroInfoPopover from './admin/HeroInfoPopover';
import DictionaryInlineValue from './DictionaryInlineValue';
import DictionaryMiniIcon from './DictionaryMiniIcon';

type Reference = {
  id: number;
  name: string;
  imageUrl?: string | null;
} | null;

type Rarity = {
  id: number;
  stars: number;
  imageUrl?: string | null;
} | null;

type PassiveSkill = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
};

type CostumeBonus = {
  attack?: number | null;
  armor?: number | null;
  hp?: number | null;
  mana?: number | null;
} | null;

type Costume = {
  id: number;
  slug: string;
  name: string;
  bonus?: CostumeBonus;
};

export type PublicHeroDetails = {
  id: number;
  slug: string;
  name: string;
  element: Reference;
  rarity: Rarity;
  heroClass: Reference;
  family: Reference;
  manaSpeed: Reference;
  alphaTalent: Reference;
  specialSkill: {
    name: string;
    description: string;
  } | null;
  passiveSkills: PassiveSkill[];
  costumes: Costume[];
  baseHeroId: number | null;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  costumeBonusJson?: CostumeBonus;
  imageUrl: string | null;
  releaseDate: string | null;
};

export type PublicHeroStats = {
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
};

type PublicHeroDetailsModalProps = {
  open: boolean;
  locale: 'RU' | 'EN';
  loading: boolean;
  error: string | null;
  details: PublicHeroDetails | null;
  stats: PublicHeroStats | null;
  onClose: () => void;
  onOpenHero?: (slug: string) => void;
};

function formatCostumeBonusContent(locale: 'RU' | 'EN', bonus: CostumeBonus | undefined): string {
  if (!bonus) {
    return '';
  }

  const lines =
    locale === 'RU'
      ? [
          `Бонус к атаке: +${bonus.attack ?? 0}%`,
          `Бонус к защите: +${bonus.armor ?? 0}%`,
          `Бонус к здоровью: +${bonus.hp ?? 0}%`,
          `Бонус к мане: +${bonus.mana ?? 0}%`,
        ]
      : [
          `Attack Bonus: +${bonus.attack ?? 0}%`,
          `Defence Bonus: +${bonus.armor ?? 0}%`,
          `Health Bonus: +${bonus.hp ?? 0}%`,
          `Mana Bonus: +${bonus.mana ?? 0}%`,
        ];

  return lines.join('\n');
}

function LabeledReferenceRow({
  label,
  value,
  imageUrl,
  tooltipContent,
}: {
  label: string;
  value: string;
  imageUrl?: string | null;
  tooltipContent?: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-[var(--foreground-soft)]">{label}:</div>
      <div className="flex min-w-0 items-start gap-2 text-[var(--foreground)]">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <DictionaryMiniIcon imageUrl={imageUrl} label={value} size={20} />
          <span className="min-w-0 leading-5 [overflow-wrap:anywhere]">{value}</span>
        </div>
        {tooltipContent ? <HeroInfoPopover label={label} content={tooltipContent} /> : null}
      </div>
    </div>
  );
}

export default function PublicHeroDetailsModal({
  open,
  locale,
  loading,
  error,
  details,
  stats,
  onClose,
  onOpenHero,
}: PublicHeroDetailsModalProps) {
  const [computedOpen, setComputedOpen] = useState(false);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: details?.name ?? 'Просмотр героя',
            close: 'Закрыть',
            loading: 'Загрузка карточки героя...',
            empty: 'Герой не найден.',
            image: 'Изображение',
            imageStub: 'Здесь позже появится картинка героя.',
            element: 'Элемент',
            rarity: 'Редкость',
            heroClass: 'Класс',
            family: 'Семья',
            manaSpeed: 'Скорость маны',
            alphaTalent: 'Альфа-талант',
            specialSkill: 'Спецнавык',
            passiveSkills: 'Пассивные навыки',
            costumes: 'Костюмы',
            baseHero: 'Базовый герой',
            releaseDate: 'Дата выхода',
            baseStats: 'Базовые статы',
            computedStats: 'Вычисляемые статы',
            computedHint:
              'Заглушка. Позже здесь появятся вычисляемые статы из отдельного ендпоинта.',
            noValue: 'Не указано',
            noPassiveSkills: 'Пассивные навыки пока не указаны.',
            noCostumes: 'Костюмов пока нет.',
            otherCostumes: 'Остальные костюмы',
            openCostume: 'Открыть',
            baseAttack: 'Атака',
            baseArmor: 'Броня',
            baseHp: 'HP',
            publicLinkHint:
              'Публичный полный просмотр костюмов зависит от backend-контракта и будет расширен позже.',
          }
        : {
            title: details?.name ?? 'Hero details',
            close: 'Close',
            loading: 'Loading hero details...',
            empty: 'Hero not found.',
            image: 'Image',
            imageStub: 'Hero image will appear here later.',
            element: 'Element',
            rarity: 'Rarity',
            heroClass: 'Class',
            family: 'Family',
            manaSpeed: 'Mana speed',
            alphaTalent: 'Alpha talent',
            specialSkill: 'Special skill',
            passiveSkills: 'Passive skills',
            costumes: 'Costumes',
            baseHero: 'Base hero',
            releaseDate: 'Release date',
            baseStats: 'Base stats',
            computedStats: 'Computed stats',
            computedHint:
              'Placeholder. Computed stats will arrive later from a dedicated endpoint.',
            noValue: 'Not set',
            noPassiveSkills: 'No passive skills yet.',
            noCostumes: 'No costumes yet.',
            otherCostumes: 'Other costumes',
            openCostume: 'Open',
            baseAttack: 'Attack',
            baseArmor: 'Armor',
            baseHp: 'HP',
            publicLinkHint:
              'Full public costume view depends on a later backend contract update.',
          },
    [details?.name, locale],
  );

  const renderValue = (value?: string | number | null) =>
    value === null || value === undefined || value === '' ? t.noValue : value;

  return (
    <DictionaryModal open={open} title={t.title} closeLabel={t.close} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : !details ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
          {t.empty}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                {t.image}
              </div>
              {details.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={details.imageUrl}
                  alt={details.name}
                  className="h-56 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 text-center text-sm text-[var(--foreground-soft)]">
                  {t.imageStub}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                <div className="text-2xl font-semibold text-[var(--foreground)]">{details.name}</div>
                <div className="mt-1 text-sm text-[var(--foreground-soft)]">{details.slug}</div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                  <LabeledReferenceRow
                    label={t.element}
                    value={String(renderValue(details.element?.name))}
                    imageUrl={details.element?.imageUrl}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                  <LabeledReferenceRow
                    label={t.rarity}
                    value={details.rarity ? `${details.rarity.stars}*` : t.noValue}
                    imageUrl={details.rarity?.imageUrl}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                  <LabeledReferenceRow
                    label={t.heroClass}
                    value={String(renderValue(details.heroClass?.name))}
                    imageUrl={details.heroClass?.imageUrl}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                  <LabeledReferenceRow
                    label={t.family}
                    value={String(renderValue(details.family?.name))}
                    imageUrl={details.family?.imageUrl}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                  <LabeledReferenceRow
                    label={t.manaSpeed}
                    value={String(renderValue(details.manaSpeed?.name))}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                  <LabeledReferenceRow
                    label={t.alphaTalent}
                    value={String(renderValue(details.alphaTalent?.name))}
                    imageUrl={details.alphaTalent?.imageUrl}
                  />
                </div>
                {details.costumeBonusJson ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                    <LabeledReferenceRow
                      label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                      value={locale === 'RU' ? 'Показать детали' : 'Show details'}
                      tooltipContent={formatCostumeBonusContent(locale, details.costumeBonusJson)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.specialSkill}</div>
            <div className="text-sm font-medium text-[var(--foreground)]">
              {renderValue(details.specialSkill?.name)}
            </div>
            <div className="mt-2 text-sm text-[var(--foreground-soft)]">
              {renderValue(details.specialSkill?.description)}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.baseStats}</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                {t.baseAttack}: {renderValue(details.baseAttack ?? stats?.baseAttack)}
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                {t.baseArmor}: {renderValue(details.baseArmor ?? stats?.baseArmor)}
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                {t.baseHp}: {renderValue(details.baseHp ?? stats?.baseHp)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <button
              type="button"
              onClick={() => setComputedOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-[var(--foreground)]">{t.computedStats}</span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {computedOpen ? '−' : '+'}
              </span>
            </button>
            {computedOpen && (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-soft)]">
                {t.computedHint}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.passiveSkills}</div>
            {details.passiveSkills.length === 0 ? (
              <div className="text-sm text-[var(--foreground-soft)]">{t.noPassiveSkills}</div>
            ) : (
              <div className="space-y-3">
                {details.passiveSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="mb-2">
                      <DictionaryInlineValue
                        label={locale === 'RU' ? 'Навык' : 'Skill'}
                        value={skill.name}
                        imageUrl={skill.imageUrl}
                        valueClassName="font-medium text-[var(--foreground)]"
                      />
                    </div>
                    <div className="text-sm text-[var(--foreground-soft)]">
                      {skill.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.costumes}</div>
            {details.baseHeroId && (
              <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                {t.baseHero}: #{details.baseHeroId}
              </div>
            )}
            {details.costumes.length === 0 ? (
              <div className="text-sm text-[var(--foreground-soft)]">{t.noCostumes}</div>
            ) : (
              <div className="space-y-3">
                {details.costumes.map((costume) => (
                  <button
                    key={costume.id}
                    type="button"
                    onClick={() => onOpenHero?.(costume.slug)}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:bg-[var(--surface-hover)]"
                  >
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {costume.name}
                      </div>
                      <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                        {costume.slug}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--foreground-soft)]">{t.openCostume}</span>
                  </button>
                ))}
                <div className="text-xs text-[var(--foreground-muted)]">{t.publicLinkHint}</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
            {t.releaseDate}: {renderValue(details.releaseDate)}
          </div>
        </div>
      )}
    </DictionaryModal>
  );
}
