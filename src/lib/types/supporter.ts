export type SupporterFontStyle = 'ELEGANT' | 'SCRIPT' | 'CLASSIC' | 'MODERN';

export type Supporter = {
  id: number;
  nickname: string;
  color: string;
  fontStyle: SupporterFontStyle;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SupporterUpsertRequest = Pick<
  Supporter,
  'nickname' | 'color' | 'fontStyle' | 'active' | 'sortOrder'
>;
