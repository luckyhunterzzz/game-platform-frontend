export type AvatarMode = 'both' | 'bosses' | 'mobs';

export type StageEntry = {
  label: string;
  featured?: boolean;
};

export type AvatarOption = {
  id: string;
  imageSrc: string;
  amount: string;
};

export type AvatarCombination = {
  bossId: string;
  mobId: string;
  stages: StageEntry[];
};

export type AvatarSoloStages = {
  id: string;
  stages: StageEntry[];
};

export type AvatarGuideData = {
  modes: AvatarMode[];
  bossOptions: AvatarOption[];
  mobOptions: AvatarOption[];
  combinations: AvatarCombination[];
  singleBossStages: AvatarSoloStages[];
  singleMobStages: AvatarSoloStages[];
  backpackStage: string;
};

const stage = (label: string, featured = false): StageEntry => ({ label, featured });

const buildOptions = (
  counts: number[],
  folder: string,
  filePrefix: string,
  kind: 'boss' | 'enemy',
  extensionOverrides: Partial<Record<number, 'png' | 'webp'>> = {},
): AvatarOption[] =>
  counts.map((count, index) => {
    const optionIndex = index + 1;
    const extension = extensionOverrides[optionIndex] ?? 'webp';

    return {
      id: String(optionIndex),
      imageSrc: "/guides/avatars/" + folder + "/" + filePrefix + '_' + kind + '_' + optionIndex + '.' + extension,
      amount: count + ' шт',
    };
  });

export const avatarGuideDataBySection: Record<string, AvatarGuideData> = {
  season2: {
    modes: ['both'],
    backpackStage: '1-2',
    bossOptions: buildOptions([50, 100, 150, 200, 250], 'atlantis', 'S2', 'boss'),
    mobOptions: buildOptions([400, 800, 1200, 1600, 2000], 'atlantis', 'S2', 'enemy'),
    combinations: [
      { bossId: '1', mobId: '1', stages: [stage('1-1'), stage('3-5')] },
      { bossId: '1', mobId: '2', stages: [stage('1-8'), stage('3-7')] },
      { bossId: '2', mobId: '1', stages: [stage('1-7'), stage('9-3'), stage('9-7'), stage('9-9')] },
      { bossId: '2', mobId: '2', stages: [stage('1-2'), stage('1-4')] },
      { bossId: '3', mobId: '3', stages: [stage('10-1'), stage('10-7'), stage('15-7'), stage('16-6')] },
      { bossId: '3', mobId: '4', stages: [stage('14-3'), stage('14-7'), stage('17-8')] },
      { bossId: '4', mobId: '4', stages: [stage('14-9')] },
      { bossId: '5', mobId: '5', stages: [stage('25-1')] },
    ],
    singleBossStages: [],
    singleMobStages: [],
  },
  season3: {
    modes: ['bosses', 'mobs', 'both'],
    backpackStage: '16-4',
    bossOptions: buildOptions([50, 75, 100, 125, 150, 175, 200, 225, 250], 'valhalla', 'S3', 'boss'),
    mobOptions: buildOptions([400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000], 'valhalla', 'S3', 'enemy'),
    combinations: [
      { bossId: '1', mobId: '1', stages: [stage('1-2'), stage('1-9', true), stage('2-3'), stage('2-6')] },
      { bossId: '1', mobId: '8', stages: [stage('30-3'), stage('30-9'), stage('32-7')] },
      { bossId: '2', mobId: '3', stages: [stage('8-1'), stage('8-5'), stage('36-5'), stage('36-8')] },
      { bossId: '2', mobId: '9', stages: [stage('36-3')] },
      { bossId: '3', mobId: '2', stages: [stage('17-1')] },
      { bossId: '3', mobId: '3', stages: [stage('10-5', true), stage('11-6'), stage('17-1')] },
      { bossId: '4', mobId: '4', stages: [stage('13-8', true), stage('15-1')] },
      { bossId: '5', mobId: '2', stages: [stage('17-2'), stage('17-9'), stage('18-2'), stage('18-9')] },
      { bossId: '5', mobId: '3', stages: [stage('17-5'), stage('17-9'), stage('18-7')] },
      { bossId: '5', mobId: '5', stages: [stage('18-2', true), stage('18-9'), stage('21-7')] },
      { bossId: '6', mobId: '5', stages: [stage('33-6')] },
      { bossId: '6', mobId: '6', stages: [stage('24-3'), stage('24-5'), stage('24-6'), stage('24-7', true), stage('24-9')] },
      { bossId: '6', mobId: '9', stages: [stage('34-3')] },
      { bossId: '7', mobId: '3', stages: [stage('36-2'), stage('36-6')] },
      { bossId: '7', mobId: '9', stages: [stage('36-3')] },
      { bossId: '8', mobId: '1', stages: [stage('29-3')] },
      { bossId: '8', mobId: '8', stages: [stage('31-2'), stage('31-5', true), stage('31-8')] },
      { bossId: '9', mobId: '3', stages: [stage('36-1'), stage('36-6')] },
      { bossId: '9', mobId: '9', stages: [stage('36-9', true)] },
    ],
    singleBossStages: [
      { id: '2', stages: [stage('8-5')] },
      { id: '6', stages: [stage('24-5')] },
      { id: '7', stages: [stage('26-7')] },
      { id: '8', stages: [stage('29-8')] },
    ],
    singleMobStages: [
      { id: '2', stages: [stage('2-8')] },
      { id: '3', stages: [stage('7-4')] },
      { id: '4', stages: [stage('11-2')] },
      { id: '7', stages: [stage('25-1')] },
      { id: '9', stages: [stage('34-3')] },
    ],
  },
  season4: {
    modes: ['bosses', 'mobs', 'both'],
    backpackStage: '15-3',
    bossOptions: buildOptions([50, 80, 110, 140, 170, 210, 250], 'underwild', 'S4', 'boss'),
    mobOptions: buildOptions([400, 650, 900, 1150, 1400, 1700, 2000], 'underwild', 'S4', 'enemy'),
    combinations: [
      { bossId: '1', mobId: '1', stages: [stage('1-2'), stage('1-4'), stage('1-7'), stage('4-3'), stage('4-5'), stage('4-7', true)] },
      { bossId: '2', mobId: '2', stages: [stage('10-1'), stage('10-3'), stage('10-4', true), stage('10-6'), stage('6-1'), stage('6-10', true), stage('6-3'), stage('6-5'), stage('6-8'), stage('7-3'), stage('7-8'), stage('7-9'), stage('9-3'), stage('9-7'), stage('9-9')] },
      { bossId: '3', mobId: '3', stages: [stage('12-5'), stage('12-7', true), stage('13-5'), stage('13-6'), stage('13-8'), stage('14-10'), stage('15-10'), stage('15-4'), stage('15-6')] },
      { bossId: '4', mobId: '4', stages: [stage('18-4'), stage('20-2', true), stage('20-5'), stage('20-7'), stage('21-5'), stage('21-8')] },
      { bossId: '5', mobId: '5', stages: [stage('22-1'), stage('22-10'), stage('22-3', true), stage('22-4'), stage('22-9'), stage('23-2'), stage('23-4'), stage('23-8')] },
      { bossId: '6', mobId: '6', stages: [stage('27-1', true), stage('27-5'), stage('27-6'), stage('27-8'), stage('28-10'), stage('28-3'), stage('28-5'), stage('28-8')] },
      { bossId: '7', mobId: '7', stages: [stage('33-1'), stage('33-10'), stage('33-5'), stage('33-6'), stage('33-8', true), stage('36-3'), stage('36-4'), stage('36-7'), stage('36-9')] },
    ],
    singleBossStages: [
      { id: '1', stages: [stage('4-5')] },
      { id: '2', stages: [stage('6-10'), stage('10-4')] },
      { id: '3', stages: [stage('15-2')] },
      { id: '4', stages: [stage('20-2')] },
      { id: '5', stages: [stage('22-3')] },
      { id: '6', stages: [stage('27-1')] },
      { id: '7', stages: [stage('33-8')] },
    ],
    singleMobStages: [
      { id: '1', stages: [stage('4-5')] },
      { id: '2', stages: [stage('6-10'), stage('10-4')] },
      { id: '3', stages: [stage('15-2')] },
      { id: '4', stages: [stage('21-5')] },
      { id: '5', stages: [stage('22-3')] },
      { id: '6', stages: [stage('27-1')] },
      { id: '7', stages: [stage('33-8')] },
    ],
  },
  season5: {
    modes: ['bosses', 'mobs', 'both'],
    backpackStage: '5-6',
    bossOptions: buildOptions([30, 40, 50, 60, 70, 75, 85, 95, 105, 115, 130, 155], 'dune', 'S5', 'boss'),
    mobOptions: buildOptions([250, 300, 400, 450, 550, 600, 700, 800, 850, 950, 1050, 1300], 'dune', 'S5', 'enemy'),
    combinations: [
      { bossId: '1', mobId: '1', stages: [stage('1-1', true), stage('1-6'), stage('1-9'), stage('5-1'), stage('5-10'), stage('5-3'), stage('5-8')] },
      { bossId: '3', mobId: '3', stages: [stage('7-7')] },
      { bossId: '4', mobId: '4', stages: [stage('11-3')] },
      { bossId: '5', mobId: '5', stages: [stage('13-2')] },
      { bossId: '6', mobId: '6', stages: [stage('17-2')] },
      { bossId: '7', mobId: '7', stages: [stage('19-8')] },
      { bossId: '9', mobId: '9', stages: [stage('25-9')] },
      { bossId: '11', mobId: '11', stages: [stage('31-1')] },
      { bossId: '12', mobId: '12', stages: [stage('35-8')] },
    ],
    singleBossStages: [
      { id: '1', stages: [stage('1-1')] },
      { id: '2', stages: [stage('4-8')] },
      { id: '3', stages: [stage('7-7')] },
      { id: '4', stages: [stage('11-3')] },
      { id: '5', stages: [stage('13-2')] },
      { id: '6', stages: [stage('17-2')] },
      { id: '7', stages: [stage('19-8')] },
      { id: '8', stages: [stage('10-9')] },
      { id: '9', stages: [stage('25-9')] },
      { id: '10', stages: [stage('30-8')] },
      { id: '11', stages: [stage('31-1')] },
      { id: '12', stages: [stage('35-8')] },
    ],
    singleMobStages: [
      { id: '1', stages: [stage('1-1')] },
      { id: '2', stages: [stage('7-4')] },
      { id: '3', stages: [stage('2-2')] },
      { id: '4', stages: [stage('11-3')] },
      { id: '5', stages: [stage('13-7')] },
      { id: '6', stages: [stage('17-2')] },
      { id: '7', stages: [stage('10-4')] },
      { id: '8', stages: [stage('1-7')] },
      { id: '9', stages: [stage('16-7')] },
      { id: '10', stages: [stage('16-4')] },
      { id: '11', stages: [stage('13-8')] },
      { id: '12', stages: [stage('14-8')] },
    ],
  },
  stories1: {
    modes: ['bosses', 'mobs', 'both'],
    backpackStage: '1-14',
    bossOptions: buildOptions([40, 60, 75, 85, 100, 115], 'stories-1', 'UT1', 'boss', { 3: 'png' }),
    mobOptions: buildOptions([250, 400, 550, 700, 850, 1000], 'stories-1', 'UT1', 'enemy'),
    combinations: [
      { bossId: '1', mobId: '2', stages: [stage('1-7'), stage('1-24'), stage('2-1'), stage('3-9'), stage('4-6'), stage('5-3')] },
      { bossId: '1', mobId: '3', stages: [stage('6-3')] },
      { bossId: '1', mobId: '4', stages: [stage('1-7')] },
      { bossId: '1', mobId: '5', stages: [stage('4-6'), stage('4-24')] },
      { bossId: '2', mobId: '3', stages: [stage('4-21'), stage('5-9'), stage('6-3')] },
      { bossId: '2', mobId: '4', stages: [stage('2-14'), stage('4-10')] },
      { bossId: '2', mobId: '5', stages: [stage('1-25'), stage('4-24')] },
      { bossId: '2', mobId: '6', stages: [stage('2-6')] },
      { bossId: '3', mobId: '3', stages: [stage('1-4', true), stage('1-6'), stage('1-23'), stage('3-6'), stage('3-12'), stage('3-18'), stage('4-7'), stage('5-8')] },
      { bossId: '3', mobId: '4', stages: [stage('2-4'), stage('2-15')] },
      { bossId: '3', mobId: '5', stages: [stage('2-10'), stage('4-7')] },
      { bossId: '4', mobId: '4', stages: [stage('4-14', true), stage('6-18')] },
      { bossId: '4', mobId: '5', stages: [stage('1-11'), stage('2-11'), stage('3-27')] },
      { bossId: '4', mobId: '6', stages: [stage('1-11'), stage('1-14'), stage('2-5'), stage('3-1'), stage('3-20'), stage('4-18'), stage('5-13'), stage('5-4')] },
      { bossId: '5', mobId: '5', stages: [stage('5-20'), stage('5-21', true)] },
      { bossId: '5', mobId: '6', stages: [stage('4-19'), stage('4-2'), stage('4-20'), stage('4-5')] },
      { bossId: '6', mobId: '6', stages: [stage('5-28', true)] },
    ],
    singleBossStages: [
      { id: '1', stages: [stage('2-7')] },
      { id: '2', stages: [stage('4-21')] },
      { id: '3', stages: [stage('3-6')] },
      { id: '4', stages: [stage('4-14')] },
      { id: '5', stages: [stage('5-21')] },
      { id: '6', stages: [stage('5-28')] },
    ],
    singleMobStages: [
      { id: '1', stages: [stage('1-1')] },
      { id: '2', stages: [stage('2-7')] },
      { id: '3', stages: [stage('1-4')] },
      { id: '4', stages: [stage('2-15')] },
      { id: '5', stages: [stage('1-25')] },
      { id: '6', stages: [stage('2-5')] },
    ],
  },
  stories2: {
    modes: ['bosses', 'mobs', 'both'],
    backpackStage: '1-28',
    bossOptions: buildOptions([40, 60, 75, 85, 100], 'stories-2', 'UT2', 'boss'),
    mobOptions: buildOptions([250, 400, 550, 700, 850, 1000], 'stories-2', 'UT2', 'enemy'),
    combinations: [
      { bossId: '1', mobId: '1', stages: [stage('1-19', true), stage('2-11'), stage('2-25')] },
      { bossId: '1', mobId: '2', stages: [stage('1-22'), stage('2-12'), stage('2-3')] },
      { bossId: '1', mobId: '4', stages: [stage('1-25'), stage('1-8')] },
      { bossId: '1', mobId: '6', stages: [stage('2-27')] },
      { bossId: '2', mobId: '1', stages: [stage('2-25'), stage('2-28')] },
      { bossId: '2', mobId: '2', stages: [stage('1-24', true), stage('2-3')] },
      { bossId: '2', mobId: '3', stages: [stage('3-26')] },
      { bossId: '2', mobId: '4', stages: [stage('1-26'), stage('1-6'), stage('2-18')] },
      { bossId: '2', mobId: '6', stages: [stage('1-26'), stage('2-17'), stage('2-18'), stage('2-28')] },
      { bossId: '3', mobId: '2', stages: [stage('1-23'), stage('2-12')] },
      { bossId: '3', mobId: '4', stages: [stage('2-22'), stage('2-6'), stage('3-11'), stage('3-13'), stage('3-14'), stage('3-3'), stage('3-7'), stage('3-8')] },
      { bossId: '3', mobId: '5', stages: [stage('2-21'), stage('2-4')] },
      { bossId: '3', mobId: '6', stages: [stage('1-28'), stage('2-28'), stage('3-11')] },
      { bossId: '4', mobId: '3', stages: [stage('3-10'), stage('3-16'), stage('3-19'), stage('3-9')] },
      { bossId: '4', mobId: '6', stages: [stage('3-12'), stage('3-25'), stage('3-5'), stage('3-9')] },
      { bossId: '5', mobId: '3', stages: [stage('3-26')] },
      { bossId: '5', mobId: '6', stages: [stage('3-24')] },
    ],
    singleBossStages: [
      { id: '1', stages: [stage('1-19')] },
      { id: '2', stages: [stage('1-24')] },
      { id: '3', stages: [stage('2-6')] },
      { id: '4', stages: [stage('3-5')] },
      { id: '5', stages: [stage('3-24')] },
    ],
    singleMobStages: [
      { id: '1', stages: [stage('1-28')] },
      { id: '2', stages: [stage('1-24')] },
      { id: '3', stages: [stage('1-18')] },
      { id: '4', stages: [stage('1-25')] },
      { id: '5', stages: [stage('2-21')] },
      { id: '6', stages: [stage('1-27')] },
    ],
  },
};
