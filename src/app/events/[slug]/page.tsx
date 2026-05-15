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

type ScoreTableRow = {
  stage: string;
  enemyScore: string;
  minimum: string;
  easy: string;
  medium: string;
  hard: string;
  random: string;
};

type ScoreTable = {
  titleRu: string;
  titleEn: string;
  rows: ScoreTableRow[];
  total: ScoreTableRow;
};

type RewardItem = {
  textRu: string;
  textEn: string;
  iconSrcs?: string[];
};

type RewardCategory = {
  titleRu: string;
  titleEn: string;
  items: RewardItem[];
};

type RewardRankTab = {
  id: string;
  labelRu: string;
  labelEn: string;
  categories: RewardCategory[];
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

function ScoreTableBlock({
  locale,
  table,
}: {
  locale: 'ru' | 'en';
  table: ScoreTable;
}) {
  const title = locale === 'ru' ? table.titleRu : table.titleEn;
  const totalLabel = locale === 'ru' ? 'РЎСѓРјРјР°' : 'Total';

  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.10)]">
      <h3 className="mb-4 text-lg font-bold text-[var(--foreground)]">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="rounded-l-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'Р­С‚Р°Рї' : 'Stage'}
              </th>
              <th className="border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'РЎС‡РµС‚ Р·Р° РІСЂР°РіРѕРІ' : 'Enemy score'}
              </th>
              <th className="border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'РњРёРЅРёРјСѓРј' : 'Minimum'}
              </th>
              <th className="border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'Р›РµРіРєРѕ' : 'Easy'}
              </th>
              <th className="border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'РЎСЂРµРґРЅРµ' : 'Medium'}
              </th>
              <th className="border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'РўСЂСѓРґРЅРѕ' : 'Hard'}
              </th>
              <th className="rounded-r-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                {locale === 'ru' ? 'Р Р°РЅРґРѕРј' : 'Random'}
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={`${title}-${row.stage}`}>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.stage}</td>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.enemyScore}</td>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.minimum}</td>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.easy}</td>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.medium}</td>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.hard}</td>
                <td className="border border-[var(--border)] px-3 py-3 text-[var(--foreground-soft)]">{row.random}</td>
              </tr>
            ))}
            <tr>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{totalLabel}</td>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{table.total.enemyScore}</td>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{table.total.minimum}</td>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{table.total.easy}</td>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{table.total.medium}</td>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{table.total.hard}</td>
              <td className="border border-[var(--border)] bg-cyan-400/8 px-3 py-3 font-semibold text-[var(--foreground)]">{table.total.random}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const braveScoreTables: ScoreTable[] = [
  {
    titleRu: 'Р РµРґРєРёР№',
    titleEn: 'Rare',
    rows: [
      { stage: '1', enemyScore: '5 500', minimum: '27 500', easy: '30 250', medium: '30 800', hard: '31 625', random: '32 450' },
      { stage: '2', enemyScore: '6 160', minimum: '30 800', easy: '33 880', medium: '34 496', hard: '35 420', random: '36 344' },
      { stage: '3', enemyScore: '7 440', minimum: '37 200', easy: '40 549', medium: '41 292', hard: '42 408', random: '43 524' },
      { stage: '4', enemyScore: '8 160', minimum: '40 392', easy: '44 472', medium: '45 288', hard: '46 512', random: '47 736' },
      { stage: '5', enemyScore: '8 880', minimum: '43 956', easy: '48 396', medium: '49 284', hard: '50 616', random: '51 948' },
      { stage: '6', enemyScore: '12 000', minimum: '59 400', easy: '66 000', medium: '67 200', hard: '69 000', random: '70 800' },
      { stage: '7', enemyScore: '12 900', minimum: '64 500', easy: '70 950', medium: '72 240', hard: '74 175', random: '76 110' },
      { stage: '8', enemyScore: '13 800', minimum: '69 000', easy: '75 900', medium: '77 280', hard: '79 350', random: '81 420' },
      { stage: '9', enemyScore: '14 700', minimum: '73 500', easy: '80 850', medium: '82 320', hard: '84 525', random: '86 730' },
      { stage: '10', enemyScore: '15 600', minimum: '78 000', easy: '85 800', medium: '87 360', hard: '89 700', random: '92 040' },
    ],
    total: { stage: 'sum', enemyScore: '105 140', minimum: '524 248', easy: '577 046', medium: '587 560', hard: '603 331', random: '619 102' },
  },
  {
    titleRu: 'Р­РїРёС‡РµСЃРєРёР№',
    titleEn: 'Epic',
    rows: [
      { stage: '1', enemyScore: '8 250', minimum: '41 250', easy: '45 376', medium: '46 200', hard: '47 438', random: '48 675' },
      { stage: '2', enemyScore: '8 910', minimum: '44 550', easy: '49 005', medium: '49 896', hard: '51 233', random: '52 569' },
      { stage: '3', enemyScore: '10 440', minimum: '51 678', easy: '56 898', medium: '57 942', hard: '59 508', random: '61 074' },
      { stage: '4', enemyScore: '11 160', minimum: '55 242', easy: '60 822', medium: '61 938', hard: '63 612', random: '65 286' },
      { stage: '5', enemyScore: '11 880', minimum: '58 806', easy: '64 746', medium: '65 934', hard: '67 716', random: '69 498' },
      { stage: '6', enemyScore: '15 750', minimum: '78 750', easy: '86 625', medium: '88 200', hard: '90 563', random: '92 925' },
      { stage: '7', enemyScore: '16 650', minimum: '83 250', easy: '91 575', medium: '93 240', hard: '95 738', random: '98 235' },
      { stage: '8', enemyScore: '17 550', minimum: '87 750', easy: '96 525', medium: '98 280', hard: '100 913', random: '103 545' },
      { stage: '9', enemyScore: '18 450', minimum: '92 250', easy: '101 475', medium: '103 320', hard: '106 088', random: '108 855' },
      { stage: '10', enemyScore: '19 350', minimum: '96 750', easy: '106 425', medium: '108 360', hard: '111 263', random: '114 165' },
    ],
    total: { stage: 'sum', enemyScore: '138 390', minimum: '690 276', easy: '759 471', medium: '773 310', hard: '794 069', random: '814 827' },
  },
  {
    titleRu: 'Р›РµРіРµРЅРґР°СЂРЅС‹Р№',
    titleEn: 'Legendary',
    rows: [
      { stage: '1', enemyScore: '11 000', minimum: '55 000', easy: '60 500', medium: '61 600', hard: '63 250', random: '64 900' },
      { stage: '2', enemyScore: '11 660', minimum: '58 300', easy: '64 130', medium: '65 296', hard: '67 045', random: '68 794' },
      { stage: '3', enemyScore: '13 440', minimum: '66 528', easy: '73 248', medium: '74 592', hard: '76 608', random: '78 624' },
      { stage: '4', enemyScore: '14 160', minimum: '70 092', easy: '77 172', medium: '78 588', hard: '80 712', random: '82 836' },
      { stage: '5', enemyScore: '14 880', minimum: '73 656', easy: '81 096', medium: '82 584', hard: '84 816', random: '87 048' },
      { stage: '6', enemyScore: '19 500', minimum: '97 500', easy: '107 250', medium: '109 200', hard: '112 125', random: '115 050' },
      { stage: '7', enemyScore: '20 400', minimum: '102 000', easy: '112 200', medium: '114 240', hard: '117 300', random: '120 360' },
      { stage: '8', enemyScore: '21 300', minimum: '106 500', easy: '117 150', medium: '119 280', hard: '122 475', random: '125 670' },
      { stage: '9', enemyScore: '22 200', minimum: '111 000', easy: '122 100', medium: '124 320', hard: '127 650', random: '130 980' },
      { stage: '10', enemyScore: '23 100', minimum: '115 500', easy: '127 050', medium: '129 360', hard: '132 825', random: '136 290' },
    ],
    total: { stage: 'sum', enemyScore: '171 640', minimum: '856 076', easy: '941 896', medium: '959 060', hard: '984 806', random: '1 010 552' },
  },
  {
    titleRu: 'РС‚РѕРі',
    titleEn: 'Total',
    rows: [],
    total: { stage: 'sum', enemyScore: '415 170', minimum: '2 070 600', easy: '2 278 413', medium: '2 319 930', hard: '2 382 206', random: '2 444 881' },
  },
];

const rewardIcons = {
  aetherLegendary: '/events/brave-beautiful/rewards/aether_legendary.png',
  aetherRare: '/events/brave-beautiful/rewards/aether_epic.png',
  aetherEpic: '/events/brave-beautiful/rewards/aether_rare.png',
  epicHeroAmulet: '/events/brave-beautiful/rewards/epic_hero_amulet.webp',
  epicTroopAmulet: '/events/brave-beautiful/rewards/epic_troop_amulet.webp',
  worldEnergyFlask: '/events/brave-beautiful/rewards/energy_pve_flask.webp',
  ascensionTelescope: '/events/brave-beautiful/rewards/ascension_elite_farsight_telescope.png',
  ascensionTome: '/events/brave-beautiful/rewards/ascension_elite_tome_of_tactics.png',
  emblems: '/events/brave-beautiful/rewards/emblem.webp',
  avatar: '/events/brave-beautiful/rewards/profile_avatar.webp',
} as const;

const playerRewardsTabs: RewardRankTab[] = [
  {
    id: 'player-top-1',
    labelRu: 'РўРѕРї 1',
    labelEn: 'Top 1',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '2 С€С‚', textEn: '2 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 100%', textEn: '1 slot - 100%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 100%', textEn: '2 slots - 100%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '3 СЃР»РѕС‚Р° - 100%', textEn: '3 slots - 100%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р–РµС‚РѕРЅС‹', titleEn: 'Tokens', items: [{ textRu: '3 СЃР»РѕС‚Р° - 100%', textEn: '3 slots - 100%', iconSrcs: [rewardIcons.epicHeroAmulet] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '6', textEn: '6', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
      { titleRu: 'РџСЂРµРґРјРµС‚С‹', titleEn: 'Items', items: [{ textRu: '2 СЃР»РѕС‚Р° - 100%', textEn: '2 slots - 100%', iconSrcs: [rewardIcons.ascensionTelescope, rewardIcons.ascensionTome] }] },
    ],
  },
  {
    id: 'player-top-2-10',
    labelRu: 'РўРѕРї 2-10',
    labelEn: 'Top 2-10',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '2 С€С‚', textEn: '2 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 100%', textEn: '1 slot - 100%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 90%', textEn: '2 slots - 90%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '2 СЃР»РѕС‚Р° - 90%', textEn: '2 slots - 90%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р–РµС‚РѕРЅС‹', titleEn: 'Tokens', items: [{ textRu: '3 СЃР»РѕС‚Р° - 100%', textEn: '3 slots - 100%', iconSrcs: [rewardIcons.epicHeroAmulet] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '5', textEn: '5', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
      { titleRu: 'РџСЂРµРґРјРµС‚С‹', titleEn: 'Items', items: [{ textRu: '2 СЃР»РѕС‚Р° - 100%', textEn: '2 slots - 100%', iconSrcs: [rewardIcons.ascensionTelescope, rewardIcons.ascensionTome] }] },
    ],
  },
  {
    id: 'player-top-11-100',
    labelRu: 'РўРѕРї 11-100',
    labelEn: 'Top 11-100',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '1 С€С‚', textEn: '1 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 100%', textEn: '1 slot - 100%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 80%', textEn: '2 slots - 80%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '2 СЃР»РѕС‚Р° - 80%', textEn: '2 slots - 80%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р–РµС‚РѕРЅС‹', titleEn: 'Tokens', items: [{ textRu: '3 СЃР»РѕС‚Р° - 100%', textEn: '3 slots - 100%', iconSrcs: [rewardIcons.epicHeroAmulet] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '4', textEn: '4', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
      { titleRu: 'РџСЂРµРґРјРµС‚С‹', titleEn: 'Items', items: [{ textRu: '2 СЃР»РѕС‚Р° - 50%', textEn: '2 slots - 50%', iconSrcs: [rewardIcons.ascensionTelescope, rewardIcons.ascensionTome] }] },
    ],
  },
  {
    id: 'player-top-101-1000',
    labelRu: 'РўРѕРї 101-1000',
    labelEn: 'Top 101-1000',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '1 С€С‚', textEn: '1 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 20%', textEn: '1 slot - 20%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 70%', textEn: '2 slots - 70%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '2 СЃР»РѕС‚Р° - 70%', textEn: '2 slots - 70%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р–РµС‚РѕРЅС‹', titleEn: 'Tokens', items: [{ textRu: '2 СЃР»РѕС‚Р° - 100%', textEn: '2 slots - 100%', iconSrcs: [rewardIcons.epicHeroAmulet] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '3', textEn: '3', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
      { titleRu: 'РџСЂРµРґРјРµС‚С‹', titleEn: 'Items', items: [{ textRu: '1 СЃР»РѕС‚ - 50%', textEn: '1 slot - 50%', iconSrcs: [rewardIcons.ascensionTelescope, rewardIcons.ascensionTome] }] },
    ],
  },
  {
    id: 'player-top-1001-10000',
    labelRu: 'РўРѕРї 1001-10.000',
    labelEn: 'Top 1001-10,000',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '1 С€С‚', textEn: '1 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 20%', textEn: '1 slot - 20%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '1 СЃР»РѕС‚ - 60%', textEn: '1 slot - 60%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '2 СЃР»РѕС‚Р° - 60%', textEn: '2 slots - 60%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      {
        titleRu: 'Р–РµС‚РѕРЅС‹',
        titleEn: 'Tokens',
        items: [
          { textRu: '2 СЃР»РѕС‚Р° - 50%', textEn: '2 slots - 50%', iconSrcs: [rewardIcons.epicHeroAmulet] },
          { textRu: '2 СЃР»РѕС‚Р° - 50%', textEn: '2 slots - 50%', iconSrcs: [rewardIcons.epicTroopAmulet] },
        ],
      },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '2', textEn: '2', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
      { titleRu: 'РџСЂРµРґРјРµС‚С‹', titleEn: 'Items', items: [{ textRu: '1 СЃР»РѕС‚ - 20%', textEn: '1 slot - 20%', iconSrcs: [rewardIcons.ascensionTelescope, rewardIcons.ascensionTome] }] },
    ],
  },
  {
    id: 'player-top-10001-100000',
    labelRu: 'РўРѕРї 10.001-100.000',
    labelEn: 'Top 10,001-100,000',
    categories: [
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 10%', textEn: '1 slot - 10%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '1 СЃР»РѕС‚ - 50%', textEn: '1 slot - 50%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '2 СЃР»РѕС‚Р° - 50%', textEn: '2 slots - 50%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      {
        titleRu: 'Р–РµС‚РѕРЅС‹',
        titleEn: 'Tokens',
        items: [
          { textRu: '2 СЃР»РѕС‚Р° - 20%', textEn: '2 slots - 20%', iconSrcs: [rewardIcons.epicHeroAmulet] },
          { textRu: '2 СЃР»РѕС‚Р° - 80%', textEn: '2 slots - 80%', iconSrcs: [rewardIcons.epicTroopAmulet] },
        ],
      },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '1', textEn: '1', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
    ],
  },
  {
    id: 'player-top-100001-below',
    labelRu: 'РўРѕРї 100.001 Рё РЅРёР¶Рµ',
    labelEn: 'Top 100,001 and below',
    categories: [
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 50%', textEn: '1 slot - 50%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '1 СЃР»РѕС‚ - 50%', textEn: '1 slot - 50%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
    ],
  },
];

const allianceRewardsTabs: RewardRankTab[] = [
  {
    id: 'alliance-top-1',
    labelRu: 'РўРѕРї 1',
    labelEn: 'Top 1',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '2 С€С‚', textEn: '2 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '3 СЃР»РѕС‚Р° - 100%', textEn: '3 slots - 100%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '3 СЃР»РѕС‚Р° - 100%', textEn: '3 slots - 100%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '4 СЃР»РѕС‚Р° - 100%', textEn: '4 slots - 100%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р­РјРєРё', titleEn: 'Emblems', items: [{ textRu: 'x50 - 4 СЃР»РѕС‚Р° - 100%', textEn: 'x50 - 4 slots - 100%', iconSrcs: [rewardIcons.emblems] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '5', textEn: '5', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
    ],
  },
  {
    id: 'alliance-top-2-10',
    labelRu: 'РўРѕРї 2-10',
    labelEn: 'Top 2-10',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '2 С€С‚', textEn: '2 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '2 СЃР»РѕС‚Р° - 100%', textEn: '2 slots - 100%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 90%', textEn: '2 slots - 90%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '3 СЃР»РѕС‚Р° - 90%', textEn: '3 slots - 90%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р­РјРєРё', titleEn: 'Emblems', items: [{ textRu: 'x30 - 4 СЃР»РѕС‚Р° - 100%', textEn: 'x30 - 4 slots - 100%', iconSrcs: [rewardIcons.emblems] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '4', textEn: '4', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
    ],
  },
  {
    id: 'alliance-top-11-100',
    labelRu: 'РўРѕРї 11-100',
    labelEn: 'Top 11-100',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '1 С€С‚', textEn: '1 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 100%', textEn: '1 slot - 100%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 80%', textEn: '2 slots - 80%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '3 СЃР»РѕС‚Р° - 80%', textEn: '3 slots - 80%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р­РјРєРё', titleEn: 'Emblems', items: [{ textRu: 'x30 - 3 СЃР»РѕС‚Р° - 100%', textEn: 'x30 - 3 slots - 100%', iconSrcs: [rewardIcons.emblems] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '3', textEn: '3', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
    ],
  },
  {
    id: 'alliance-top-101-1000',
    labelRu: 'РўРѕРї 101-1000',
    labelEn: 'Top 101-1000',
    categories: [
      { titleRu: 'РђРІС‹', titleEn: 'Avatars', items: [{ textRu: '1 С€С‚', textEn: '1 pcs', iconSrcs: [rewardIcons.avatar] }] },
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 20%', textEn: '1 slot - 20%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 70%', textEn: '2 slots - 70%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '3 СЃР»РѕС‚Р° - 70%', textEn: '3 slots - 70%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р­РјРєРё', titleEn: 'Emblems', items: [{ textRu: 'x20 - 3 СЃР»РѕС‚Р° - 100%', textEn: 'x20 - 3 slots - 100%', iconSrcs: [rewardIcons.emblems] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '2', textEn: '2', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
    ],
  },
  {
    id: 'alliance-top-1001-10000',
    labelRu: 'РўРѕРї 1001-10.000',
    labelEn: 'Top 1001-10,000',
    categories: [
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '1 СЃР»РѕС‚ - 10%', textEn: '1 slot - 10%', iconSrcs: [rewardIcons.aetherLegendary] },
          { textRu: '2 СЃР»РѕС‚Р° - 60%', textEn: '2 slots - 60%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '3 СЃР»РѕС‚Р° - 60%', textEn: '3 slots - 60%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р­РјРєРё', titleEn: 'Emblems', items: [{ textRu: 'x20 - 2 СЃР»РѕС‚Р° - 100%', textEn: 'x20 - 2 slots - 100%', iconSrcs: [rewardIcons.emblems] }] },
      { titleRu: 'Р¤Р»СЏРіРё', titleEn: 'Flasks', items: [{ textRu: '1', textEn: '1', iconSrcs: [rewardIcons.worldEnergyFlask] }] },
    ],
  },
  {
    id: 'alliance-top-10001-below',
    labelRu: 'РўРѕРї 10.001 Рё РЅРёР¶Рµ',
    labelEn: 'Top 10,001 and below',
    categories: [
      {
        titleRu: 'Р­С„РёСЂ',
        titleEn: 'Aether',
        items: [
          { textRu: '2 СЃР»РѕС‚Р° - 50%', textEn: '2 slots - 50%', iconSrcs: [rewardIcons.aetherRare] },
          { textRu: '3 СЃР»РѕС‚Р° - 50%', textEn: '3 slots - 50%', iconSrcs: [rewardIcons.aetherEpic] },
        ],
      },
      { titleRu: 'Р­РјРєРё', titleEn: 'Emblems', items: [{ textRu: 'x10 - 1 СЃР»РѕС‚ - 100%', textEn: 'x10 - 1 slot - 100%', iconSrcs: [rewardIcons.emblems] }] },
    ],
  },
];

function ScoreReferenceBlock({ locale }: { locale: 'ru' | 'en' }) {
  const difficultyTables = braveScoreTables.slice(0, 3);
  const totalTable = braveScoreTables[3];
  const [activeTab, setActiveTab] = useState(difficultyTables[0]?.titleEn ?? 'Rare');

  const activeTable =
    difficultyTables.find((table) => table.titleEn === activeTab) ?? difficultyTables[0];

  if (!activeTable || !totalTable) {
    return null;
  }

  const labels =
    locale === 'ru'
      ? {
          stage: 'Р­С‚Р°Рї',
          enemyScore: 'РЎС‡РµС‚ Р·Р°\nРІСЂР°РіРѕРІ',
          minimum: 'РњРёРЅ.',
          easy: 'Р›РµРіРєРѕ',
          medium: 'РЎСЂРµРґРЅРµ',
          hard: 'РўСЂСѓРґРЅРѕ',
          random: 'Р Р°РЅРґРѕРј',
          total: 'РС‚РѕРі',
          note:
            'Р’РЅРёРјР°РЅРёРµ: РЅР° 3-5 СЌС‚Р°РїР°С… РІСЃРµС… СЃР»РѕР¶РЅРѕСЃС‚РµР№ РїСЂРёРјРµРЅРµРЅ РґСЂСѓРіРѕР№ РєРѕСЌС„С„РёС†РёРµРЅС‚, РЅР° 0,05 РјРµРЅСЊС€Рµ Р·Р°СЏРІР»РµРЅРЅРѕРіРѕ РІ РІРµСЂС…РЅРµР№ СЃС‚СЂРѕРєРµ С‚Р°Р±Р»РёС†С‹, РїРѕСЃРєРѕР»СЊРєСѓ С‚Р°Рј РґСЂСѓРіР°СЏ С„РѕСЂРјСѓР»Р° РїРѕРґСЃС‡РµС‚Р° Р±РѕРЅСѓСЃР° РІСЂРµРјРµРЅРё.',
          original: 'РћСЂРёРіРёРЅР°Р»:',
        }
      : {
          stage: 'Stage',
          enemyScore: 'Enemy score',
          minimum: 'Minimum',
          easy: 'Easy',
          medium: 'Medium',
          hard: 'Hard',
          random: 'Random',
          total: 'Total',
          note:
            'Note: on stages 3-5 of every difficulty, a different coefficient is used. It is lower by 0.05 than the value shown in the top row because those stages use a different time bonus formula.',
          original: 'Original:',
        };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {difficultyTables.map((table) => {
          const isActive = table.titleEn === activeTab;
          const label = locale === 'ru' ? table.titleRu : table.titleEn;

          return (
            <button
              key={table.titleEn}
              type="button"
              onClick={() => setActiveTab(table.titleEn)}
              className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                isActive
                  ? 'border-cyan-300/40 bg-cyan-400/16 text-cyan-200'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:border-cyan-400/24 hover:text-[var(--foreground)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_14px_36px_rgba(0,0,0,0.10)]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-30 min-w-[88px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.stage}
                </th>
                <th className="min-w-[136px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-[11px] font-semibold leading-4 text-[var(--foreground)]">
                  <span className="block whitespace-pre-line">{labels.enemyScore}</span>
                </th>
                <th className="min-w-[132px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.minimum}
                </th>
                <th className="min-w-[132px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.easy}
                </th>
                <th className="min-w-[132px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.medium}
                </th>
                <th className="min-w-[132px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.hard}
                </th>
                <th className="min-w-[132px] border-b border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.random}
                </th>
              </tr>
            </thead>
            <tbody>
              {activeTable.rows.map((row) => (
                <tr key={`${activeTable.titleEn}-${row.stage}`}>
                  <td className="sticky left-0 z-20 min-w-[88px] border-r border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-[var(--foreground)]">
                    {row.stage}
                  </td>
                  <td className="min-w-[136px] border-r border-[var(--border)] px-3 py-3 text-[var(--foreground)]">
                    {row.enemyScore}
                  </td>
                  <td className="min-w-[132px] border-r border-[var(--border)] px-3 py-3 text-[var(--foreground)]">{row.minimum}</td>
                  <td className="min-w-[132px] border-r border-[var(--border)] px-3 py-3 text-[var(--foreground)]">{row.easy}</td>
                  <td className="min-w-[132px] border-r border-[var(--border)] px-3 py-3 text-[var(--foreground)]">{row.medium}</td>
                  <td className="min-w-[132px] border-r border-[var(--border)] px-3 py-3 text-[var(--foreground)]">{row.hard}</td>
                  <td className="min-w-[132px] border-r border-[var(--border)] px-3 py-3 text-[var(--foreground)]">{row.random}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-cyan-400/16 bg-cyan-400/8 shadow-[0_14px_36px_rgba(0,0,0,0.10)]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-30 min-w-[136px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.total}
                </th>
                <th className="min-w-[136px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 text-[11px] font-semibold leading-4 text-[var(--foreground)]">
                  <span className="block whitespace-pre-line">{labels.enemyScore}</span>
                </th>
                <th className="min-w-[132px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.minimum}
                </th>
                <th className="min-w-[132px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.easy}
                </th>
                <th className="min-w-[132px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.medium}
                </th>
                <th className="min-w-[132px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.hard}
                </th>
                <th className="min-w-[132px] border-b border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.random}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sticky left-0 z-20 min-w-[136px] border-r border-cyan-400/16 bg-[var(--surface-strong)] px-3 py-3 font-semibold text-[var(--foreground)]">
                  {labels.total}
                </td>
                <td className="min-w-[136px] border-r border-cyan-400/16 px-3 py-3 font-semibold text-[var(--foreground)]">
                  {totalTable.total.enemyScore}
                </td>
                <td className="min-w-[132px] border-r border-cyan-400/16 px-3 py-3 font-semibold text-[var(--foreground)]">{totalTable.total.minimum}</td>
                <td className="min-w-[132px] border-r border-cyan-400/16 px-3 py-3 font-semibold text-[var(--foreground)]">{totalTable.total.easy}</td>
                <td className="min-w-[132px] border-r border-cyan-400/16 px-3 py-3 font-semibold text-[var(--foreground)]">{totalTable.total.medium}</td>
                <td className="min-w-[132px] border-r border-cyan-400/16 px-3 py-3 font-semibold text-[var(--foreground)]">{totalTable.total.hard}</td>
                <td className="min-w-[132px] border-r border-cyan-400/16 px-3 py-3 font-semibold text-[var(--foreground)]">{totalTable.total.random}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <SectionText>{labels.note}</SectionText>
        <SectionText>
          by <strong>@mister_random</strong>
        </SectionText>
        <SectionText>
          {labels.original}{' '}
          <a
            href="https://t.me/AQevents/481"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Telegram
          </a>
        </SectionText>
      </div>
    </div>
  );
}

function RewardsTabsBlock({
  locale,
  tabs,
  noteRu,
  noteEn,
}: {
  locale: 'ru' | 'en';
  tabs: RewardRankTab[];
  noteRu: ReactNode;
  noteEn: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');
  const activeTabData = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (!activeTabData) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const label = locale === 'ru' ? tab.labelRu : tab.labelEn;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                isActive
                  ? 'border-cyan-300/40 bg-cyan-400/16 text-cyan-200'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:border-cyan-400/24 hover:text-[var(--foreground)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeTabData.categories.map((category) => (
          <div
            key={`${activeTabData.id}-${locale === 'ru' ? category.titleRu : category.titleEn}`}
            className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.10)]"
          >
            <h3 className="text-base font-bold text-[var(--foreground)] md:text-lg">
              {locale === 'ru' ? category.titleRu : category.titleEn}
            </h3>
            <div className="mt-4 space-y-3">
              {category.items.map((item, index) => (
                <div
                  key={`${activeTabData.id}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3"
                >
                  {item.iconSrcs?.length ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {item.iconSrcs.map((iconSrc) => (
                        <div
                          key={iconSrc}
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                        >
                          <Image
                            src={iconSrc}
                            alt=""
                            width={48}
                            height={48}
                            className="h-10 w-10 object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="flex-1 text-sm leading-6 text-[var(--foreground)] md:text-base">
                    {locale === 'ru' ? item.textRu : item.textEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionText>{locale === 'ru' ? noteRu : noteEn}</SectionText>
    </div>
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
                РЎР±СЂРѕСЃРёС‚СЊ
              </button>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                Р—Р°РєСЂС‹С‚СЊ
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
        title: 'РўР°Р±Р»РёС†Р° СЃРѕР±С‹С‚РёСЏ',
        content: (
          <div className="space-y-4">
            <SectionText>
              РљСЂР°С‚РєР°СЏ С‚Р°Р±Р»РёС†Р° СЃ РѕСЃРЅРѕРІРЅС‹РјРё РїСЂР°РІРёР»Р°РјРё, СЌС‚Р°РїР°РјРё, РїРѕСЂС‚Р°Р»Р°РјРё Рё РЅР°РіСЂР°РґР°РјРё СЃРѕР±С‹С‚РёСЏ.
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
        title: 'Р“РµСЂРѕРё СЃРѕР±С‹С‚РёСЏ',
        content: (
          <div className="space-y-4">
            <SectionText>
              РљР°Рє Рё РІ РґСЂСѓРіРёС… РїРѕС…РѕР¶РёС… СЃРѕР±С‹С‚РёСЏС…, РіРµСЂРѕРё С‚РµРєСѓС‰РµРіРѕ РёРІРµРЅС‚Р° РїРѕР»СѓС‡Р°СЋС‚ Р±РѕРЅСѓСЃС‹ РІ РђР <em>РҐСЂР°Р±СЂС‹Рµ Рё РџСЂРµРєСЂР°СЃРЅС‹Рµ</em>.
            </SectionText>
            <SectionSubtitle>РљРѕРЅРєСЂРµС‚РЅРѕ</SectionSubtitle>
            <SectionList
              items={[
                <>Р“РµСЂРѕРё СЃРµРјРµР№ <strong>РњСѓС€РєРµС‚РµСЂС‹</strong> Рё <strong>РҐСЂР°Р±СЂС‹Рµ Рё РџСЂРµРєСЂР°СЃРЅС‹Рµ</strong> РїРѕР»СѓС‡Р°СЋС‚ <strong>+20% Рє Р°С‚Р°РєРµ</strong>, <strong>+20% Рє Р·Р°С‰РёС‚Рµ</strong> Рё <strong>+20% Рє Р·РґРѕСЂРѕРІСЊСЋ</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'special-gameplay',
        title: 'РћСЃРѕР±Р°СЏ РјРµС…Р°РЅРёРєР°',
        content: (
          <div className="space-y-4">
            <SectionText>
              Р“Р»Р°РІРЅР°СЏ РјРµС…Р°РЅРёРєР° СЃРѕР±С‹С‚РёСЏ РЅР°Р·С‹РІР°РµС‚СЃСЏ <strong>Р’СЃРµ Р·Р° РѕРґРЅРѕРіРѕ!</strong>
            </SectionText>
            <SectionSubtitle>РњСѓС€РєРµС‚С‘СЂСЃРєРёРµ С‰РёС‚С‹</SectionSubtitle>
            <SectionList
              items={[
                <>Р•СЃР»Рё СЃРѕР±СЂР°С‚СЊ РєРѕРјР±РёРЅР°С†РёСЋ РёР· 4 РєР°РјРЅРµР№, РІРјРµСЃС‚Рѕ Р‘РѕРјР±С‹ (Dragon Shield) РїРѕСЏРІР»СЏРµС‚СЃСЏ <strong>РњСѓС€РєРµС‚РµСЂСЃРєРёР№ С‰РёС‚</strong>.</>,
                <>РџСЂРё СЃРѕРІРїР°РґРµРЅРёРё РѕРЅ РІР·СЂС‹РІР°РµС‚СЃСЏ РєР°Рє РѕР±С‹С‡РЅР°СЏ Р‘РѕРјР±Р° (Dragon Shield).</>,
                <>Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ РѕРЅ СѓРЅРёС‡С‚РѕР¶Р°РµС‚ 4 СЃРѕСЃРµРґРЅРёС… С‚Р°Р№Р»Р°: РІРІРµСЂС…, РІРЅРёР·, РІР»РµРІРѕ Рё РІРїСЂР°РІРѕ.</>,
                <>РўР°РєР¶Рµ РѕРЅ СЃРЅРёРјР°РµС‚ Р±Р°С„С‹ СЃРѕ РІСЃРµС… РІСЂР°РіРѕРІ.</>,
              ]}
            />
            <SectionSubtitle>Р­Р»РёС‚РЅС‹Р№ РјСѓС€РєРµС‚С‘СЂСЃРєРёР№ С‰РёС‚</SectionSubtitle>
            <SectionList
              items={[
                <>Р•СЃР»Рё СЃРѕР±СЂР°С‚СЊ РєРѕРјР±РёРЅР°С†РёСЋ РёР· 5 РєР°РјРЅРµР№, РІРјРµСЃС‚Рѕ РљСЂРёСЃС‚Р°Р»Р»Р° (Power Shard) РїРѕСЏРІР»СЏРµС‚СЃСЏ <strong>Р­Р»РёС‚РЅС‹Р№ РјСѓС€РєРµС‚С‘СЂСЃРєРёР№ С‰РёС‚</strong>.</>,
                <>РџСЂРё СЃРѕРІРїР°РґРµРЅРёРё РѕРЅ СѓРЅРёС‡С‚РѕР¶Р°РµС‚ РІРµСЃСЊ СЂСЏРґ Рё РІСЃСЋ РєРѕР»РѕРЅРєСѓ.</>,
                <>РўР°РєР¶Рµ РѕРЅ СЃРЅРёРјР°РµС‚ Р±Р°С„С‹ СЃРѕ РІСЃРµС… РІСЂР°РіРѕРІ.</>,
              ]}
            />
            <SectionSubtitle>РЈСЃРёР»РµРЅРёРµ СЃРїРµС†РёР°Р»СЊРЅС‹С… С‰РёС‚РѕРІ</SectionSubtitle>
            <SectionList
              items={[
                <>Р•СЃР»Рё СЃРїРµС†РёР°Р»СЊРЅС‹Рµ С‰РёС‚С‹ РЅРµ Р°РєС‚РёРІРёСЂРѕРІР°С‚СЊ СЃСЂР°Р·Сѓ, РёС… СЃРёР»Р° СѓРІРµР»РёС‡РёРІР°РµС‚СЃСЏ РЅР° <strong>20%</strong> РєР°Р¶РґС‹Р№ С…РѕРґ.</>,
                <>РњР°РєСЃРёРјСѓРј СѓСЃРёР»РµРЅРёСЏ: <strong>200%</strong>.</>,
              ]}
            />
            <SectionSubtitle>Р’Р°Р¶РЅС‹Р№ РјРѕРјРµРЅС‚</SectionSubtitle>
            <SectionList
              items={[
                <>Р‘Р°С„С‹ РІСЂР°РіРѕРІ СЃРЅРёРјР°СЋС‚СЃСЏ <strong>РґРѕ</strong> С‚РѕРіРѕ, РєР°Рє СѓСЂРѕРЅ РѕС‚ РєР°РјРЅРµР№ РґРѕР»РµС‚РёС‚ РґРѕ РІСЂР°РіРѕРІ.</>,
                <>РќР°РїСЂРёРјРµСЂ, РµСЃР»Рё РЅР° РІСЂР°РіРµ Р±С‹Р» РєРѕРЅС‚СЂСѓРґР°СЂ, С‚Рѕ РїРѕСЃР»Рµ СЃРЅСЏС‚РёСЏ Р±Р°С„Р° РІР°С€Рё РіРµСЂРѕРё РЅРµ РїРѕР»СѓС‡Р°С‚ СѓСЂРѕРЅ РѕС‚ РєРѕРЅС‚СЂР°С‚Р°РєРё.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'extra-challenge',
        title: 'Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕРµ РёСЃРїС‹С‚Р°РЅРёРµ',
        content: (
          <div className="space-y-4">
            <SectionText>
              Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ РјРѕРґРёС„РёРєР°С‚РѕСЂ.
            </SectionText>
            <SectionList
              items={[
                <>РљР°Р¶РґС‹Рµ <strong>5 С…РѕРґРѕРІ</strong> РІСЃРµ РІСЂР°РіРё РїРѕР»СѓС‡Р°СЋС‚ <strong>+30% Рє Р·Р°С‰РёС‚Рµ</strong> РЅР° 3 С…РѕРґР°.</>,
                <>РљР°Р¶РґС‹Рµ <strong>5 С…РѕРґРѕРІ</strong> РІСЃРµ РІСЂР°РіРё РїРѕР»СѓС‡Р°СЋС‚ <strong>РєРѕРЅС‚СЂР°С‚Р°РєСѓ РЅР° 100% РїРѕР»СѓС‡РµРЅРЅРѕРіРѕ СѓСЂРѕРЅР°</strong> РЅР° 3 С…РѕРґР°.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'difficulty-unlock',
        title: 'Р Р°Р·Р±Р»РѕРєРёСЂРѕРІРєР° СЃР»РѕР¶РЅРѕСЃС‚Рё',
        content: (
          <div className="space-y-4">
            <SectionSubtitle>Р­РїРёС‡РµСЃРєРёР№</SectionSubtitle>
            <SectionList items={[<>РћС‚РєСЂС‹РІР°РµС‚СЃСЏ, РєРѕРіРґР° Р°Р»СЊСЏРЅСЃ РЅР°Р±РёСЂР°РµС‚ <strong>2 500 000</strong> РѕС‡РєРѕРІ.</>]} />
            <SectionSubtitle>Р›РµРіРµРЅРґР°СЂРЅС‹Р№</SectionSubtitle>
            <SectionList items={[<>РћС‚РєСЂС‹РІР°РµС‚СЃСЏ, РєРѕРіРґР° Р°Р»СЊСЏРЅСЃ РЅР°Р±РёСЂР°РµС‚ <strong>10 000 000</strong> РѕС‡РєРѕРІ.</>]} />
          </div>
        ),
      },
      {
        anchorId: 'summoning-odds',
        title: 'РЁР°РЅСЃС‹ РїСЂРёР·С‹РІР°',
        content: (
          <div className="space-y-4">
            <SectionText>
              Р’ СЃРѕР±С‹С‚РёРё РґРѕСЃС‚СѓРїРµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ РїРѕСЂС‚Р°Р» РїСЂРёР·С‹РІР° <em>РҐСЂР°Р±СЂС‹Рµ Рё РџСЂРµРєСЂР°СЃРЅС‹Рµ</em>.
            </SectionText>
            <SectionText>
              Р’ РїРѕСЂС‚Р°Р»Рµ РґРѕСЃС‚СѓРїРЅС‹ РіРµСЂРѕРё СЃРµРјРµР№ <strong>РњСѓС€РєРµС‚РµСЂРѕРІ</strong> Рё <strong>РҐСЂР°Р±СЂС‹С… Рё РџСЂРµРєСЂР°СЃРЅС‹С…</strong>.
            </SectionText>
            <SectionSubtitle>РљР»Р°СЃСЃРёС‡РµСЃРєРёРµ РіРµСЂРѕРё</SectionSubtitle>
            <SectionList
              items={[
                <>Р РµРґРєРёР№: <strong>64.3%</strong></>,
                <>Р­РїРёС‡РµСЃРєРёР№: <strong>20.8%</strong></>,
                <>Р›РµРіРµРЅРґР°СЂРЅС‹Р№: <strong>1.2%</strong></>,
              ]}
            />
            <SectionSubtitle>РРІРµРЅС‚РѕРІС‹Рµ РіРµСЂРѕРё</SectionSubtitle>
            <SectionList
              items={[
                <>Р РµРґРєРёР№: <strong>6.7%</strong></>,
                <>Р­РїРёС‡РµСЃРєРёР№: <strong>5.7%</strong></>,
                <>Р›РµРіРµРЅРґР°СЂРЅС‹Р№: <strong>0.3%</strong></>,
                <>РР·Р±СЂР°РЅРЅС‹Р№ Р»РµРіРµРЅРґР°СЂРЅС‹Р№: <strong>1.0%</strong></>,
              ]}
            />
            <SectionText>(РљРѕСЃС‚СЋРј РІРєР»СЋС‡С‘РЅ, РµСЃР»Рё РґРѕСЃС‚СѓРїРµРЅ)</SectionText>
            <SectionSubtitle>Bonus Draw</SectionSubtitle>
            <SectionList items={[<>Р›РµРіРµРЅРґР°СЂРЅС‹Р№ Р“РµСЂРѕР№ РњРµСЃСЏС†Р°: <strong>1.3%</strong></>]} />
          </div>
        ),
      },
      {
        anchorId: 'event-coins',
        title: 'РњРѕРЅРµС‚С‹ СЃРѕР±С‹С‚РёСЏ Рё СЃС‚РѕРёРјРѕСЃС‚СЊ РїСЂРёР·С‹РІР°',
        content: (
          <div className="space-y-4">
            <SectionText>
              РЎРѕР±С‹С‚РёРµ РёСЃРїРѕР»СЊР·СѓРµС‚ СЃС‚Р°РЅРґР°СЂС‚РЅС‹Рµ <strong>РњРѕРЅРµС‚С‹ РљРІРµСЃС‚Р° РђР»СЊСЏРЅСЃР°</strong>, РєР°Рє Рё РґСЂСѓРіРёРµ РђР»СЊСЏРЅСЃРѕРІС‹Рµ РљРІРµСЃС‚С‹.
            </SectionText>
            <SectionSubtitle>Р’Р°Р¶РЅРѕ</SectionSubtitle>
            <SectionList
              items={[
                <>Р’ СЃРѕР±С‹С‚РёРё РЅРµС‚ <strong>Suspicious Chests (РЎСѓРЅРґСѓРєРѕРІ)</strong>.</>,
                <>РњРѕРЅРµС‚С‹ РјРѕР¶РЅРѕ РїРѕР»СѓС‡РёС‚СЊ С‚РѕР»СЊРєРѕ Р·Р° РїРµСЂРІРѕРµ РїСЂРѕС…РѕР¶РґРµРЅРёРµ СЌС‚Р°РїРѕРІ.</>,
              ]}
            />
            <SectionSubtitle>РЎС‚РѕРёРјРѕСЃС‚СЊ</SectionSubtitle>
            <SectionList
              items={[
                <>1 РїСЂРёР·С‹РІ: <strong>10 РјРѕРЅРµС‚</strong> РёР»Рё <strong>350 РіРµРјРѕРІ</strong>.</>,
                <>10 РїСЂРёР·С‹РІРѕРІ: <strong>3000 РіРµРјРѕРІ</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'event-information',
        title: 'Р’Р°Р¶РЅР°СЏРЅС„РѕСЂРјР°С†РёСЏ Рѕ СЃРѕР±С‹С‚РёРё',
        content: (
          <div className="space-y-4">
            <SectionText>
              РЎРѕР±С‹С‚РёРµ РёСЃРїРѕР»СЊР·СѓРµС‚ РєР»Р°СЃСЃРёС‡РµСЃРєСѓСЋ СЃРёСЃС‚РµРјСѓ Challenge Event: <strong>Rare</strong>, <strong>Epic</strong>, <strong>Legendary</strong>.
            </SectionText>
            <SectionText>
              РќРѕ, РєР°Рє Рё LoV / Starfall Circus / Slayers, РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ СЃС‚Р°СЂС‹Р№ С„РѕСЂРјР°С‚ СЃ <strong>10 СЌС‚Р°РїР°РјРё</strong> РЅР° РєР°Р¶РґСѓСЋ СЃР»РѕР¶РЅРѕСЃС‚СЊ.
            </SectionText>
          </div>
        ),
      },
      {
        anchorId: 'alliance-quest-rules',
        title: 'РџСЂР°РІРёР»Р° Alliance Quest',
        content: (
          <div className="space-y-4">
            <SectionText>
              Р¦РµР»СЊ СЃРѕР±С‹С‚РёСЏ: РЅР°Р±СЂР°С‚СЊ РєР°Рє РјРѕР¶РЅРѕ Р±РѕР»СЊС€Рµ РѕС‡РєРѕРІ Р°Р»СЊСЏРЅСЃР°.
            </SectionText>
            <SectionText>
              РџРѕР±РµР¶РґР°СЋС‚ Р°Р»СЊСЏРЅСЃС‹ СЃ РЅР°РёР±РѕР»СЊС€РёРј <strong>Alliance Quest Score</strong>.
            </SectionText>
            <SectionSubtitle>РљР°Рє СЃС‡РёС‚Р°РµС‚СЃСЏ СЃС‡С‘С‚</SectionSubtitle>
            <SectionList
              items={[
                <>РЈР±РёС‚С‹Рµ РІСЂР°РіРё.</>,
                <>РЎРєРѕСЂРѕСЃС‚СЊ РїСЂРѕС…РѕР¶РґРµРЅРёСЏ.</>,
                <>РћСЃС‚Р°РІС€РµРµСЃСЏ Р·РґРѕСЂРѕРІСЊРµ РіРµСЂРѕРµРІ.</>,
                <>Р‘РѕР»СЊС€РёРµ РєРѕРјР±Рѕ.</>,
                <>РҐРѕСЂРѕС€РёРµ СЃРѕРІРїР°РґРµРЅРёСЏ С‚Р°Р№Р»РѕРІ.</>,
              ]}
            />
            <SectionSubtitle>Continues</SectionSubtitle>
            <SectionText>
              РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РїСЂРѕРґРѕР»Р¶РµРЅРёР№ СЃРЅРёР¶Р°РµС‚ РёС‚РѕРіРѕРІС‹Р№ СЃС‡С‘С‚ СЌС‚Р°РїР°.
            </SectionText>
            <SectionSubtitle>РљС‚Рѕ РјРѕР¶РµС‚ СѓС‡Р°СЃС‚РІРѕРІР°С‚СЊ</SectionSubtitle>
            <SectionList
              items={[
                <>РўРѕР»СЊРєРѕ РёРіСЂРѕРєРё, РєРѕС‚РѕСЂС‹Рµ РІСЃС‚СѓРїРёР»Рё РІ Р°Р»СЊСЏРЅСЃ <strong>РґРѕ РЅР°С‡Р°Р»Р° СЃРѕР±С‹С‚РёСЏ</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'score-reference',
        title: 'РўР°Р±Р»РёС†Р° РѕС‡РєРѕРІ',
        content: (
          <div className="space-y-4">
            <SectionText>
              РќРёР¶Рµ РїСЂРёРІРµРґРµРЅР° СѓРґРѕР±РЅР°СЏ С‚Р°Р±Р»РёС†Р° РѕС‡РєРѕРІ РїРѕ РІСЃРµРј СЃР»РѕР¶РЅРѕСЃС‚СЏРј Рё СЌС‚Р°РїР°Рј.
            </SectionText>
            <div className="space-y-4">
              {braveScoreTables.map((table) => (
                <ScoreTableBlock key={table.titleEn} locale={locale} table={table} />
              ))}
            </div>
            <SectionText className="mt-4">
              Р’РЅРёРјР°РЅРёРµ: РЅР° 3-5 СЌС‚Р°РїР°С… РІСЃРµС… СЃР»РѕР¶РЅРѕСЃС‚РµР№ РїСЂРёРјРµРЅС‘РЅ РґСЂСѓРіРѕР№ РєРѕСЌС„С„РёС†РёРµРЅС‚, РЅР° 0,05 РјРµРЅСЊС€Рµ Р·Р°СЏРІР»РµРЅРЅРѕРіРѕ РІ РІРµСЂС…РЅРµР№ СЃС‚СЂРѕРєРµ С‚Р°Р±Р»РёС†С‹, РїРѕС‚РѕРјСѓ С‡С‚Рѕ С‚Р°Рј РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґСЂСѓРіР°СЏ С„РѕСЂРјСѓР»Р° РїРѕРґСЃС‡С‘С‚Р° Р±РѕРЅСѓСЃР° РІСЂРµРјРµРЅРё.
            </SectionText>
            <SectionText>
              by <strong>@mister_random</strong>
            </SectionText>
            <SectionText>
              РћСЂРёРіРёРЅР°Р»:
              {' '}
              <a
                href="https://t.me/AQevents/481"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                Telegram
              </a>
            </SectionText>
          </div>
        ),
      },
      {
        anchorId: 'monster-lure',
        title: 'РџСЂРёРјР°РЅРєР° РґР»СЏ РјРѕРЅСЃС‚СЂРѕРІ',
        content: (
          <div className="space-y-4">
            <SectionText>
              Р’Рѕ РІСЂРµРјСЏ СЃРѕР±С‹С‚РёСЏ РґРѕСЃС‚СѓРїРЅР° СЃРїРµС†РёР°Р»СЊРЅР°СЏ РїСЂРёРјР°РЅРєР° РґР»СЏ РјРѕРЅСЃС‚СЂРѕРІ Alliance Quest.
            </SectionText>
            <SectionList
              items={[
                <>Р•СЃР»Рё Р°РєС‚РёРІРёСЂРѕРІР°С‚СЊ РїСЂРёРјР°РЅРєСѓ, РІ РєРІРµСЃС‚Рµ РјРѕРіСѓС‚ РїРѕСЏРІР»СЏС‚СЊСЃСЏ СЂРµРґРєРёРµ <strong>Inscrutable Mimes</strong>.</>,
                <>Р—Р° РєР°Р¶РґРѕРіРѕ РїРѕР±РµР¶РґС‘РЅРЅРѕРіРѕ РјРёРјР° РіР°СЂР°РЅС‚РёСЂРѕРІР°РЅРЅРѕ РґР°С‘С‚СЃСЏ <strong>1 Alliance Quest Coin</strong>.</>,
                <>Р—Р° СЃРѕР±С‹С‚РёРµ РјРѕР¶РЅРѕ РЅР°Р№С‚Рё РѕРіСЂР°РЅРёС‡РµРЅРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РјРёРјРѕРІ.</>,
                <>РџСЂРѕРіСЂРµСЃСЃ РѕС‚РѕР±СЂР°Р¶Р°РµС‚СЃСЏ РѕС‚РґРµР»СЊРЅРѕР№ С€РєР°Р»РѕР№ РІ РѕРєРЅРµ Alliance Quest.</>,
              ]}
            />
            <SectionSubtitle>Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ</SectionSubtitle>
            <SectionList
              items={[
                <>Inscrutable Mimes <strong>РЅРµ РІР»РёСЏСЋС‚</strong> РЅР° РёРіСЂРѕРІРѕР№ РїСЂРѕС†РµСЃСЃ.</>,
                <>Inscrutable Mimes <strong>РЅРµ РІР»РёСЏСЋС‚</strong> РЅР° СЃРёСЃС‚РµРјСѓ РїРѕРґСЃС‡С‘С‚Р° РѕС‡РєРѕРІ.</>,
                <>РџСЂРёРјР°РЅРєР° СЂР°Р±РѕС‚Р°РµС‚ С‚РѕР»СЊРєРѕ РІ С‚РµРєСѓС‰РµРј Alliance Quest: <strong>The Brave & The Beautiful</strong>.</>,
              ]}
            />
          </div>
        ),
      },
      {
        anchorId: 'video-walkthrough',
        title: 'Р’РёРґРµРѕ СЃ РїСЂРѕС…РѕР¶РґРµРЅРёРµРј',
        content: (
          <div className="space-y-4">
            <SectionText>
              Р’РёРґРµРѕ:
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
      anchorId: 'score-reference',
      title: 'Score table',
      content: (
        <div className="space-y-4">
          <SectionText>
            Below is a quick score reference for every stage and difficulty.
          </SectionText>
          <div className="space-y-4">
            {braveScoreTables.map((table) => (
              <ScoreTableBlock key={table.titleEn} locale={locale} table={table} />
            ))}
          </div>
          <SectionText className="mt-4">
            Note: on stages 3-5 of every difficulty, a different coefficient is used. It is lower by 0.05 than the value shown in the top row because those stages use a different time bonus formula.
          </SectionText>
          <SectionText>
            by <strong>@mister_random</strong>
          </SectionText>
          <SectionText>
            Original:
            {' '}
            <a
              href="https://t.me/AQevents/481"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Telegram
            </a>
          </SectionText>
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
      { label: locale === 'ru' ? '\u041E\u0442\u0440\u044F\u0434\u044B' : 'Troops', href: '/troops', imageSrc: '/heroes/troops/red_legendary_master_assassin.webp' },
      { label: messages.home.navEvents, href: '/events', imageSrc: '/home-quick-links/events.png' },
      { label: locale === 'ru' ? '\u0421\u0443\u043D\u0434\u0443\u043A\u0438' : 'Chests', href: '/chests', imageSrc: '/home-quick-links/guides.png' },
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
      messages.home.navEvents,
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
  const copyLabel = locale === 'ru' ? 'РЎРєРѕРїРёСЂРѕРІР°С‚СЊ' : 'Copy';
  const copiedLabel = locale === 'ru' ? 'РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР°' : 'Link copied';
  const listLabel = locale === 'ru' ? 'Р’СЃРµ СЃРѕР±С‹С‚РёСЏ' : 'All events';
  const jumpLabel = locale === 'ru' ? 'Р‘С‹СЃС‚СЂС‹Р№ РїРµСЂРµС…РѕРґ РїРѕ СЂР°Р·РґРµР»Р°Рј' : 'Jump to section';
  const jumpHint = locale === 'ru' ? 'РћС‚РєСЂС‹С‚СЊ СЃРїРёСЃРѕРє' : 'Open list';
  const isBravePage = eventItem.slug === 'the-brave-and-the-beautiful';
  const braveSections = isBravePage ? buildBraveSections(locale) : [];
  const allianceWarningSection: EventSection = locale === 'ru'
    ? {
        anchorId: 'alliance-warning',
        title: 'РљР°Рє РЅРµ РїРѕРґСЃС‚Р°РІРёС‚СЊ Р°Р»СЊСЏРЅСЃ Рё РЅРµ РїРѕС‚РµСЂСЏС‚СЊ РЅР°РіСЂР°РґС‹',
        content: (
          <div className="space-y-4">
            <SectionSubtitle>Р’Р°Р¶РЅРѕ РїРѕРјРЅРёС‚СЊ:</SectionSubtitle>
            <SectionText>1. Р§С‚РѕР±С‹ РїСЂРѕС…РѕРґРёС‚СЊ СЌС‚Р°РїС‹, РЅР°Р±РёСЂР°С‚СЊ РѕС‡РєРё Рё РїРѕР»СѓС‡Р°С‚СЊ РЅР°РіСЂР°РґС‹:</SectionText>
            <SectionList items={[<>РЅСѓР¶РЅРѕ РЅР°С…РѕРґРёС‚СЊСЃСЏ РІ Р°Р»СЊСЏРЅСЃРµ Р”Рћ СЃС‚Р°СЂС‚Р° СЃРѕР±С‹С‚РёСЏ.</>]} />
            <SectionText>Р•СЃР»Рё РІС‹ С‡Р°СЃС‚Рѕ РїРµСЂРµС…РѕРґРёС‚Рµ РјРµР¶РґСѓ Р°Р»СЊСЏРЅСЃР°РјРё:</SectionText>
            <SectionList
              items={[
                <>СЃР»РµРґРёС‚Рµ РµС‰С‘ Рё Р·Р° РІРѕР№РЅР°РјРё,</>,
                <>РїРѕС‚РѕРјСѓ С‡С‚Рѕ РљРІРµСЃС‚ РђР»СЊСЏРЅСЃР° РёРЅРѕРіРґР° СЃС‚Р°СЂС‚СѓРµС‚ РїСЂСЏРјРѕ РІРѕ РІСЂРµРјСЏ РІРѕР№РЅС‹.</>,
              ]}
            />
            <SectionText>РњРѕР¶РЅРѕ СЃР»СѓС‡Р°Р№РЅРѕ:</SectionText>
            <SectionList
              items={[
                <>РїРѕРґСЃС‚Р°РІРёС‚СЊ Р°Р»СЊСЏРЅСЃ,</>,
                <>РЅРµ РѕС‚Р±РёС‚СЊ С‚Р°РїРєРё,</>,
                <>Рё РїРѕС‚РµСЂСЏС‚СЊ С‡Р°СЃС‚СЊ РЅР°РіСЂР°Рґ.</>,
              ]}
            />
            <SectionText>2. Р•СЃР»Рё РІС‹Р№С‚Рё РёР· Р°Р»СЊСЏРЅСЃР° РІРѕ РІСЂРµРјСЏ СЃРѕР±С‹С‚РёСЏ:</SectionText>
            <SectionList
              items={[
                <>РІР°С€Рё РѕС‡РєРё СЃРѕС…СЂР°РЅСЏС‚СЃСЏ,</>,
                <>РЅРѕ РїРѕСЃР»Рµ РІРѕР·РІСЂР°С‰РµРЅРёСЏ РІС‹ РќР• СЃРјРѕР¶РµС‚Рµ:</>,
              ]}
            />
            <SectionList
              items={[
                <>СѓР»СѓС‡С€Р°С‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚,</>,
                <>РїРµСЂРµРїСЂРѕС…РѕРґРёС‚СЊ СЌС‚Р°РїС‹,</>,
                <>РїРѕР»СѓС‡Р°С‚СЊ РЅР°РіСЂР°РґС‹ СЃРѕР±С‹С‚РёСЏ.</>,
              ]}
            />
            <SectionText>РџРѕСЌС‚РѕРјСѓ РµСЃР»Рё РІС‹ РІС‹С…РѕРґРёС‚Рµ СЂР°РґРё Р·Р°РєСѓРїРѕРє, РїРѕРґР°СЂРєРѕРІ РёР»Рё РІСЂРµРјРµРЅРЅРѕРіРѕ РїРµСЂРµС…РѕРґР°:</SectionText>
            <SectionList
              items={[
                <>СЃРЅР°С‡Р°Р»Р° РЅР°Р±РµР№С‚Рµ РЅСѓР¶РЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РѕС‡РєРѕРІ РґР»СЏ Р°Р»СЊСЏРЅСЃР°,</>,
                <>С‡С‚РѕР±С‹ РїРѕС‚РѕРј РЅРµ РїСЂРёС€Р»РѕСЃСЊ РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рё РїС‹С‚Р°С‚СЊСЃСЏ С‡С‚Рѕ-С‚Рѕ РґРѕР±РёРІР°С‚СЊ.</>,
              ]}
            />
          </div>
        ),
      }
    : {
        anchorId: 'alliance-warning',
        title: 'How Not to Let Your Alliance Down and Lose Rewards',
        content: (
          <div className="space-y-4">
            <SectionSubtitle>Important to remember:</SectionSubtitle>
            <SectionText>1. To clear stages, score points, and receive rewards:</SectionText>
            <SectionList items={[<>you need to be in the alliance BEFORE the event starts.</>]} />
            <SectionText>If you often move between alliances:</SectionText>
            <SectionList
              items={[
                <>also keep an eye on wars,</>,
                <>because Alliance Quest can sometimes start right in the middle of one.</>,
              ]}
            />
            <SectionText>You can accidentally:</SectionText>
            <SectionList
              items={[
                <>let your alliance down,</>,
                <>fail to use all war flags,</>,
                <>and lose part of the rewards.</>,
              ]}
            />
            <SectionText>2. If you leave the alliance during the event:</SectionText>
            <SectionList
              items={[
                <>your points will remain,</>,
                <>but after returning you will NOT be able to:</>,
              ]}
            />
            <SectionList
              items={[
                <>improve your score,</>,
                <>replay unfinished stages,</>,
                <>receive event rewards.</>,
              ]}
            />
            <SectionText>So if you leave for purchases, gifts, or a temporary move:</SectionText>
            <SectionList
              items={[
                <>first score the amount of points your alliance needs,</>,
                <>so you do not have to come back and try to finish or improve anything later.</>,
              ]}
            />
          </div>
        ),
      };
  const hiddenSectionIds = new Set([
    'summoning-odds',
    'event-coins',
    'event-information',
    'alliance-quest-rules',
    'who-can-participate',
    'score-reference',
    'alliance-warning',
  ]);
  const visibleBraveSections = isBravePage
    ? braveSections.filter((section) => !hiddenSectionIds.has(section.anchorId))
    : [];
  const difficultyUnlockIndex = visibleBraveSections.findIndex((section) => section.anchorId === 'difficulty-unlock');
  const articleSections = isBravePage
    ? [
        ...visibleBraveSections.slice(0, difficultyUnlockIndex + 1),
        allianceWarningSection,
        ...visibleBraveSections.slice(difficultyUnlockIndex + 1),
      ]
    : [];
  const scoreSectionTitle = locale === 'ru' ? 'РўР°Р±Р»РёС†Р° РѕС‡РєРѕРІ' : 'Score table';
  const playerRewardsTitle =
    locale === 'ru' ? 'РќР°РіСЂР°РґС‹ Р·Р° РђР»СЊСЏРЅСЃРѕРІС‹Р№ РРІРµРЅС‚ (РўРѕРї РёРіСЂРѕРєРѕРІ)' : 'Alliance Event Rewards (Top Players)';
  const allianceRewardsTitle =
    locale === 'ru' ? 'РќР°РіСЂР°РґР° Р·Р° РђР»СЊСЏРЅСЃРѕРІС‹Р№ РРІРµРЅС‚ (РўРѕРї Р°Р»СЊСЏРЅСЃРѕРІ)' : 'Alliance Event Rewards (Top Alliances)';
  const quickJumpSections = isBravePage
    ? [
        ...articleSections,
        { anchorId: 'player-top-rewards', title: playerRewardsTitle },
        { anchorId: 'alliance-top-rewards', title: allianceRewardsTitle },
        { anchorId: 'score-reference', title: scoreSectionTitle },
      ]
    : [];

  const placeholderText =
    locale === 'ru'
      ? 'РљРѕРЅС‚РµРЅС‚ РґР»СЏ СЌС‚РѕР№ СЃС‚СЂР°РЅРёС†С‹ РјС‹ РґРѕР±Р°РІРёРј СЃР»РµРґСѓСЋС‰РёРј С€Р°РіРѕРј.'
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
                  {locale === 'ru' ? 'РЎРѕР±С‹С‚РёРµ' : 'Event'}
                </div>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground-soft)] md:text-lg">
                  {isBravePage
                    ? locale === 'ru'
                      ? 'РџРѕР»РЅС‹Р№ СЂР°Р·Р±РѕСЂ Alliance Quest'
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
                  {quickJumpSections.map((section) => (
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
              {articleSections.map((section) => (
                <EventSectionCard
                  key={section.anchorId}
                  section={section}
                  eventPath={eventPath}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                />
              ))}
            </div>

            <section
              id="player-top-rewards"
              className="mt-8 scroll-mt-24 rounded-[2rem] border border-cyan-400/16 bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">
                  {playerRewardsTitle}
                </h2>
                <CopyLinkButton
                  href={`${eventPath}#player-top-rewards`}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                />
              </div>

              <RewardsTabsBlock
                locale={locale}
                tabs={playerRewardsTabs}
                noteRu={
                  <>
                    РџСЂРёРјРµС‡Р°РЅРёРµ: РµСЃР»Рё СѓРєР°Р·Р°РЅРѕ <strong>Р­С„РёСЂ 4* - 2 СЃР»РѕС‚Р° - 60%</strong>, СЌС‚Рѕ РѕР·РЅР°С‡Р°РµС‚, С‡С‚Рѕ С‚РµР±Рµ РјРѕРіСѓС‚ РІС‹РїР°СЃС‚СЊ РґРІРµ РѕС‚РґРµР»СЊРЅС‹Рµ 4* СЌС„РёСЂРєРё, РєР°Р¶РґР°СЏ СЃ С€Р°РЅСЃРѕРј 60%. РўР°РєР¶Рµ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ РґР°СЋС‚ СЌР»РёС‚РЅСѓСЋ СЂР°СЃС…РѕРґРєСѓ Рё РјР°С‚РµСЂРёР°Р»С‹ РґР»СЏ РєСЂР°С„С‚Р° - Р·РґРµСЃСЊ СѓРєР°Р·Р°РЅ С‚РѕР»СЊРєРѕ СЃР°РјС‹Р№ Р·РЅР°С‡РёРјС‹Р№ Р»СѓС‚.
                  </>
                }
                noteEn={
                  <>
                    Note: if it says <strong>4* Aether - 2 slots - 60%</strong>, it means you can get two separate 4* Aethers, each with a 60% chance. Additional elite battle items and crafting materials are also included, but only the most valuable loot is shown here.
                  </>
                }
              />
            </section>

            <section
              id="alliance-top-rewards"
              className="mt-8 scroll-mt-24 rounded-[2rem] border border-cyan-400/16 bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">
                  {allianceRewardsTitle}
                </h2>
                <CopyLinkButton
                  href={`${eventPath}#alliance-top-rewards`}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                />
              </div>

              <RewardsTabsBlock
                locale={locale}
                tabs={allianceRewardsTabs}
                noteRu={
                  <>
                    РџСЂРёРјРµС‡Р°РЅРёРµ: РµСЃР»Рё СѓРєР°Р·Р°РЅРѕ <strong>Р­С„РёСЂ 4* - 2 СЃР»РѕС‚Р° - 60%</strong>, СЌС‚Рѕ РѕР·РЅР°С‡Р°РµС‚, С‡С‚Рѕ С‚РµР±Рµ РјРѕРіСѓС‚ РІС‹РїР°СЃС‚СЊ РґРІРµ РѕС‚РґРµР»СЊРЅС‹Рµ 4* СЌС„РёСЂРєРё, РєР°Р¶РґР°СЏ СЃ С€Р°РЅСЃРѕРј 60%. РўР°РєР¶Рµ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ РґР°СЋС‚ СЌР»РёС‚РЅСѓСЋ СЂР°СЃС…РѕРґРєСѓ Рё РјР°С‚РµСЂРёР°Р»С‹ РґР»СЏ РєСЂР°С„С‚Р° - Р·РґРµСЃСЊ СѓРєР°Р·Р°РЅ С‚РѕР»СЊРєРѕ СЃР°РјС‹Р№ Р·РЅР°С‡РёРјС‹Р№ Р»СѓС‚.
                  </>
                }
                noteEn={
                  <>
                    Note: if it says <strong>4* Aether - 2 slots - 60%</strong>, it means you can get two separate 4* Aethers, each with a 60% chance. Additional elite battle items and crafting materials are also included, but only the most valuable loot is shown here.
                  </>
                }
              />

              <SectionText className="mt-5">
                {locale === 'ru' ? 'РСЃС‚РѕС‡РЅРёРє: ' : 'Source: '}
                <a
                  href="https://t.me/EmpiresPuzzlesBot"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  @EmpiresPuzzlesBot
                </a>
                {' '}
                <a
                  href="https://t.me/Tudan_news"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  @Tudan_news
                </a>
              </SectionText>
            </section>

            <section
              id="score-reference"
              className="mt-8 scroll-mt-24 rounded-[2rem] border border-cyan-400/16 bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">
                  {scoreSectionTitle}
                </h2>
                <CopyLinkButton
                  href={`${eventPath}#score-reference`}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                />
              </div>

              <SectionText className="mb-5">
                {locale === 'ru'
                  ? 'РўР°Р±Р»РёС†Р° СЃ РЅРµРѕР±С…РѕРґРёРјС‹РјРё РѕС‡РєР°РјРё РґР»СЏ Р·Р°РЅСЏС‚РёСЏ С…РѕСЂРѕС€РёС… РјРµСЃС‚ РІ С‚РѕРїРµ.'
                  : 'This table is from another author. You can quickly switch difficulty tabs and check the needed stages.'}
              </SectionText>

              <ScoreReferenceBlock locale={locale} />
            </section>

            <footer className="mt-8 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm leading-7 text-[var(--foreground-soft)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              <span>
                {locale === 'ru'
                  ? 'Р‘Р»Р°РіРѕРґР°СЂРЅРѕСЃС‚СЊ Р·Р° РїРѕРјРѕС‰СЊ РІ СЃРѕСЃС‚Р°РІР»РµРЅРёРё РґР°РЅРЅРѕР№ СЃС‚Р°С‚СЊРё @Vesta22: '
                  : 'Thanks to @Vesta22 for help with this article: '}
              </span>
              <a
                href="https://t.me/VestiVesta"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                Telegram
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

