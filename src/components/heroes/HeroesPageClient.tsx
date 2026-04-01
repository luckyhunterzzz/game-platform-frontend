'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { HeroDictionaryKey, HeroDictionaryOption } from '@/lib/types/hero';

import HeroesAdminToolbar from './HeroesAdminToolbar';
import HeroesWorkspace from './admin/HeroesWorkspace';

import ElementsWorkspace from './admin/ElementsWorkspace';
import RaritiesWorkspace from './admin/RaritiesWorkspace';
import HeroClassesWorkspace from './admin/HeroClassesWorkspace';
import ManaSpeedsWorkspace from './admin/ManaSpeedsWorkspace';
import FamiliesWorkspace from './admin/FamiliesWorkspace';
import AlphaTalentsWorkspace from './admin/AlphaTalentsWorkspace';
import PassiveSkillsWorkspace from './admin/PassiveSkillsWorkspace';
import HeroClassEmblemBonusProfilesWorkspace from './admin/HeroClassEmblemBonusProfilesWorkspace';
import RarityEvolutionMultipliersWorkspace from './admin/RarityEvolutionMultipliersWorkspace';

export default function HeroesPageClient() {
  const { roles, authenticated } = useAuth();
  const { messages } = useI18n();

  const isAdmin = useMemo(() => {
    return roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin');
  }, [roles]);

  const [activeDictionary, setActiveDictionary] =
    useState<HeroDictionaryKey>('heroes');

  const dictionaryItems = useMemo<HeroDictionaryOption[]>(() => {
    return [
      {
        key: 'heroes',
        label: messages.heroDictionaries.heroes,
        description: messages.heroDictionaries.heroesDescription,
      },
      {
        key: 'elements',
        label: messages.heroDictionaries.elements,
        description: messages.heroDictionaries.elementsDescription,
      },
      {
        key: 'rarities',
        label: messages.heroDictionaries.rarities,
        description: messages.heroDictionaries.raritiesDescription,
      },
      {
        key: 'heroClasses',
        label: messages.heroDictionaries.heroClasses,
        description: messages.heroDictionaries.heroClassesDescription,
      },
      {
        key: 'manaSpeeds',
        label: messages.heroDictionaries.manaSpeeds,
        description: messages.heroDictionaries.manaSpeedsDescription,
      },
      {
        key: 'families',
        label: messages.heroDictionaries.families,
        description: messages.heroDictionaries.familiesDescription,
      },
      {
        key: 'alphaTalents',
        label: messages.heroDictionaries.alphaTalents,
        description: messages.heroDictionaries.alphaTalentsDescription,
      },
      {
        key: 'passiveSkills',
        label: messages.heroDictionaries.passiveSkills,
        description: messages.heroDictionaries.passiveSkillsDescription,
      },
      {
        key: 'emblemProfiles',
        label: messages.heroDictionaries.emblemProfiles,
        description: messages.heroDictionaries.emblemProfilesDescription,
      },
      {
        key: 'evolutionMultipliers',
        label: messages.heroDictionaries.evolutionMultipliers,
        description: messages.heroDictionaries.evolutionMultipliersDescription,
      },
    ];
  }, [messages.heroDictionaries]);

  const activeItem = dictionaryItems.find((item) => item.key === activeDictionary);

  const renderAdminWorkspace = () => {
    switch (activeDictionary) {
      case 'heroes':
        return <HeroesWorkspace adminMode />;
      case 'elements':
        return <ElementsWorkspace />;
      case 'rarities':
        return <RaritiesWorkspace />;
      case 'heroClasses':
        return <HeroClassesWorkspace />;
      case 'manaSpeeds':
        return <ManaSpeedsWorkspace />;
      case 'families':
        return <FamiliesWorkspace />;
      case 'alphaTalents':
        return <AlphaTalentsWorkspace />;
      case 'passiveSkills':
        return <PassiveSkillsWorkspace />;
      case 'emblemProfiles':
        return <HeroClassEmblemBonusProfilesWorkspace />;
      case 'evolutionMultipliers':
        return <RarityEvolutionMultipliersWorkspace />;
      default:
        return <HeroesWorkspace adminMode />;
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <section className="w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {messages.heroes.pageTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--foreground-soft)]">
              {messages.heroes.pageSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
              {authenticated && isAdmin
                ? messages.heroes.adminBadge
                : messages.heroes.publicBadge}
            </span>
          </div>
        </div>

        {!isAdmin ? (
          <HeroesWorkspace />
        ) : (
          <>
            <HeroesAdminToolbar
              items={dictionaryItems}
              activeKey={activeDictionary}
              onChange={setActiveDictionary}
            />

            <section className="mb-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {activeItem?.label}
              </h2>
              <p className="mt-2 text-sm text-[var(--foreground-soft)]">
                {activeItem?.description}
              </p>
            </section>

            {renderAdminWorkspace()}
          </>
        )}
      </section>
    </main>
  );
}
