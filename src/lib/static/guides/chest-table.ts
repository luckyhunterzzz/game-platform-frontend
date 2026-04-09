export type ChestColumn = {
  key: 'brown' | 'dark' | 'holy' | 'ice' | 'nature' | 'fire';
  imageSrc: string;
  alt: string;
};

export type ChestRow = {
  key: 'season1' | 'season2' | 'season3' | 'season4' | 'season5' | 'stories1' | 'stories2';
  values: [string, string, string, string, string, string];
};

export const chestColumns: ChestColumn[] = [
  { key: 'brown', imageSrc: '/guides/chests/brown-chest.png', alt: 'Brown chest' },
  { key: 'dark', imageSrc: '/guides/chests/dark-chest.png', alt: 'Dark chest' },
  { key: 'holy', imageSrc: '/guides/chests/holy-chest.png', alt: 'Holy chest' },
  { key: 'ice', imageSrc: '/guides/chests/ice-chest.png', alt: 'Ice chest' },
  { key: 'nature', imageSrc: '/guides/chests/nature-chest.png', alt: 'Nature chest' },
  { key: 'fire', imageSrc: '/guides/chests/fire-chest.png', alt: 'Fire chest' },
];

export const chestRows: ChestRow[] = [
  { key: 'season1', values: ['7-4', '7-4', '10-6', '8-7', '7-5', '4-1'] },
  { key: 'season2', values: ['4-3', '21-10', '13-1', '8-2', '7-1', '3-8'] },
  { key: 'season3', values: ['9-8', '17-9', '8-6', '9-8', '4-8', '6-2'] },
  { key: 'season4', values: ['2-2', '8-6', '4-7', '8-2', '9-2', '12-6'] },
  { key: 'season5', values: ['5-10', '5-10', '16-8', '22-2', '10-8', '2-9'] },
  { key: 'stories1', values: ['1-26', '1-28', '6-7', '3-13', '1-11', '1-24'] },
  { key: 'stories2', values: ['1-28', '1-3', '1-15', '2-20', '2-15', '1-27'] },
];
