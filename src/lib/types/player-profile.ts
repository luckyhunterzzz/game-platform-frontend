export type PlayerProfileStatus = 'INCOMPLETE' | 'COMPLETE' | 'SUSPENDED';

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
