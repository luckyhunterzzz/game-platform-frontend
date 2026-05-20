export type PlayerProfileStatus = 'INCOMPLETE' | 'COMPLETE' | 'SUSPENDED';
export type HeroPowerGrade =
  | 'FIRST_TIER'
  | 'FIRST_ASCENSION'
  | 'SECOND_ASCENSION'
  | 'FULLY_ASCENDED'
  | 'FIRST_LIMIT_BROKEN'
  | 'SECOND_LIMIT_BROKEN';

export type PlayerProfileResponse = {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  telegramUsername: string | null;
  vkUsername: string | null;
  discordUsername: string | null;
  currentGameNickname: string | null;
  status: PlayerProfileStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlayerProfileUpdateRequest = {
  firstName: string;
  lastName: string;
  telegramUsername: string;
  vkUsername: string;
  discordUsername: string;
  currentGameNickname: string;
};

export type PlayerProfileHeroResponse = {
  id: string;
  playerProfileId: string;
  heroId: number;
  powerGrade: HeroPowerGrade;
  talentLevel: number;
  createdAt: string;
};

export type PlayerWarAttackSlotResponse = {
  slot: number;
  playerProfileHeroId: string | null;
};

export type PlayerWarAttackTeamResponse = {
  id: string;
  teamIndex: number;
  slots: PlayerWarAttackSlotResponse[];
};

export type PlayerWarAttackTeamsResponse = {
  teams: PlayerWarAttackTeamResponse[];
};

export type PlayerWarAttackSlotUpdateRequest = {
  slot: number;
  playerProfileHeroId: string | null;
};

export type PlayerWarAttackTeamUpdateRequest = {
  teamIndex: number;
  slots: PlayerWarAttackSlotUpdateRequest[];
};

export type PlayerWarAttackTeamsUpdateRequest = {
  teams: PlayerWarAttackTeamUpdateRequest[];
};
