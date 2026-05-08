export type EventGuideItem = {
  slug: string;
  titleEn: string;
  titleRu: string;
  accentClassName: string;
  previewImageSrc: string;
};

export const eventGuideItems: EventGuideItem[] = [
  {
    slug: 'ninja-tower',
    titleEn: 'Ninja Tower',
    titleRu: 'Башня Ниндзя',
    accentClassName:
      'border-slate-300/70 bg-gradient-to-b from-slate-200/75 via-slate-300/30 to-slate-900/12 shadow-[0_0_32px_rgba(203,213,225,0.34)]',
    previewImageSrc: '/events/previews/ninjas.webp',
  },
  {
    slug: 'vigilant-vegetables',
    titleEn: 'Vigilant Vegetables',
    titleRu: 'Бдительные овощи',
    accentClassName:
      'border-orange-300/70 bg-gradient-to-b from-orange-300/76 via-orange-400/32 to-orange-950/12 shadow-[0_0_32px_rgba(251,146,60,0.34)]',
    previewImageSrc: '/events/previews/vegetables.webp',
  },
  {
    slug: 'the-brave-and-the-beautiful',
    titleEn: 'The Brave & The Beautiful',
    titleRu: 'Храбрые и прекрасные',
    accentClassName:
      'border-pink-300/70 bg-gradient-to-b from-pink-300/76 via-fuchsia-400/32 to-rose-950/12 shadow-[0_0_32px_rgba(244,114,182,0.34)]',
    previewImageSrc: '/events/previews/brave-beautiful.webp',
  },
  {
    slug: 'tower-of-magic',
    titleEn: 'Tower Of Magic',
    titleRu: 'Башня Магии',
    accentClassName:
      'border-blue-300/70 bg-gradient-to-b from-blue-400/74 via-indigo-500/30 to-slate-950/18 shadow-[0_0_32px_rgba(96,165,250,0.32)]',
    previewImageSrc: '/events/previews/magic.webp',
  },
  {
    slug: 'beowulf-challenge',
    titleEn: 'Beowulf Challenge',
    titleRu: 'Испытания Беовульфа',
    accentClassName:
      'border-zinc-300/70 bg-gradient-to-b from-zinc-300/70 via-zinc-400/28 to-zinc-950/14 shadow-[0_0_32px_rgba(212,212,216,0.3)]',
    previewImageSrc: '/events/previews/beowulf.webp',
  },
];

export function getEventGuideBySlug(slug: string) {
  return eventGuideItems.find((item) => item.slug === slug) ?? null;
}
