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

export type PlayerWarModeResponse = {
  code: string;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  sortOrder: number;
};

export type PlayerWarAttackTeamResponse = {
  id: string;
  warModeCode: string;
  teamIndex: number;
  slots: PlayerWarAttackSlotResponse[];
};

export type PlayerWarAttackTeamsResponse = {
  warModes: PlayerWarModeResponse[];
  teams: PlayerWarAttackTeamResponse[];
};

export type PlayerWarAttackSlotUpdateRequest = {
  slot: number;
  playerProfileHeroId: string | null;
};

export type PlayerWarAttackTeamUpdateRequest = {
  warModeCode: string;
  teamIndex: number;
  slots: PlayerWarAttackSlotUpdateRequest[];
};

export type PlayerWarAttackTeamsUpdateRequest = {
  teams: PlayerWarAttackTeamUpdateRequest[];
};

export type WarStatAttackResultType =
  | 'SUCCESS_ONE_SHOT'
  | 'SUCCESS_CLEANUP'
  | 'FAIL_FULL_ATTACK'
  | 'FAIL_CLEANUP';

export type PlayerWarStatAttackTeamSlotResponse = {
  slot: number;
  playerProfileHeroId: string | null;
};

export type PlayerWarStatAttackRecordResponse = {
  id: string;
  warModeCode: string;
  resultType: WarStatAttackResultType;
  battleDate: string;
};

export type PlayerWarStatAttackTeamResponse = {
  id: string;
  name: string;
  teamOrder: number;
  slots: PlayerWarStatAttackTeamSlotResponse[];
  records: PlayerWarStatAttackRecordResponse[];
};

export type PlayerWarStatAttackTeamsResponse = {
  warModes: PlayerWarModeResponse[];
  teams: PlayerWarStatAttackTeamResponse[];
};

export type PlayerWarStatAttackTeamSlotUpdateRequest = {
  slot: number;
  playerProfileHeroId: string | null;
};

export type PlayerWarStatAttackTeamUpdateRequest = {
  name: string;
  slots: PlayerWarStatAttackTeamSlotUpdateRequest[];
};

export type PlayerWarStatAttackRecordUpsertRequest = {
  warModeCode: string;
  resultType: WarStatAttackResultType;
  battleDate: string;
};
