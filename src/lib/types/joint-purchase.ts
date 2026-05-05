export type JointPurchaseOfferStatus =
  | 'OPEN_FOR_APPLICATIONS'
  | 'MAIN_GROUP_FILLED'
  | 'READY_TO_START'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ParticipationApplicationStatus =
  | 'PENDING_TRUST_CHECK'
  | 'PENDING_ORGANIZER_REVIEW'
  | 'APPROVED_MAIN'
  | 'APPROVED_RESERVE'
  | 'REJECTED'
  | 'CANCELLED';

export type ParticipationType = 'MAIN' | 'RESERVE';

export type ParticipantFeedbackResult = 'SUCCESS' | 'UNSUCCESS';

export type JointPurchaseOffer = {
  id: string;
  organizerUserId: string;
  title: string;
  description: string | null;
  allianceName: string;
  contactGroup: string;
  showOrganizerContacts: boolean;
  organizerGameNickname: string | null;
  organizerTelegramUsername: string | null;
  organizerVkUsername: string | null;
  organizerDiscordUsername: string | null;
  screenshotBucket: string | null;
  screenshotObjectKey: string | null;
  screenshotUrl: string | null;
  requiredParticipants: number;
  reserveParticipants: number;
  currentMainParticipants: number;
  currentReserveParticipants: number;
  currentUserApplicationStatus: ParticipationApplicationStatus | null;
  currentUserAssignedParticipationType: ParticipationType | null;
  autoApproveEnabled: boolean;
  status: JointPurchaseOfferStatus;
  plannedStartAt: string;
  plannedEndAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ParticipationApplication = {
  id: string;
  offerId: string;
  applicantUserId: string;
  applicantEmail: string | null;
  status: ParticipationApplicationStatus;
  assignedParticipationType: ParticipationType | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  screenshotBucket: string | null;
  screenshotObjectKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlayerProfileDetails = {
  id: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramUsername: string | null;
  vkUsername: string | null;
  discordUsername: string | null;
  currentGameNickname: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParticipationApplicationDetails = ParticipationApplication & {
  screenshotUrl: string | null;
  playerProfile: PlayerProfileDetails | null;
};

export type ParticipantFeedback = {
  id: string;
  offerId: string;
  applicationId: string;
  participantUserId: string;
  authorUserId: string;
  result: ParticipantFeedbackResult;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateJointPurchaseOfferRequest = {
  title: string;
  description: string;
  allianceName: string;
  contactGroup: string;
  showOrganizerContacts: boolean;
  showOrganizerGameNickname: boolean;
  showOrganizerTelegram: boolean;
  showOrganizerVk: boolean;
  showOrganizerDiscord: boolean;
  screenshotBucket: string | null;
  screenshotObjectKey: string | null;
  requiredParticipants: number;
  reserveParticipants: number;
  autoApproveEnabled: boolean;
  plannedStartAt: string;
  plannedEndAt: string;
};

export type SubmitParticipationApplicationRequest = {
  screenshotBucket: string | null;
  screenshotObjectKey: string | null;
};

export type ReviewParticipationApplicationRequest = {
  participationType: ParticipationType;
};

export type MoveParticipationRequest = {
  participationType: ParticipationType;
};

export type UpdateJointPurchaseOfferStatusRequest = {
  status: JointPurchaseOfferStatus;
};

export type UpsertParticipantFeedbackRequest = {
  result: ParticipantFeedbackResult;
  description: string;
};

export type SendOfferParticipantsEmailRequest = {
  subject: string;
  message: string;
  sendToMain: boolean;
  sendToReserve: boolean;
};

export type OfferParticipantsEmailResponse = {
  eventId: string;
  offerId: string;
  recipientsCount: number;
  requestedAt: string;
};

export type ImageUploadResponse = {
  bucket: string;
  objectKey: string;
  url: string | null;
};

export type ApplicationScreenshotAccessResponse = {
  url: string;
};
