'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ImagePlus,
  LoaderCircle,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { PlayerProfileResponse } from '@/lib/types/player-profile';
import type {
  CreateJointPurchaseOfferRequest,
  ImageUploadResponse,
  JointPurchaseOffer,
  JointPurchaseOfferStatus,
  MoveParticipationRequest,
  OfferParticipantsEmailResponse,
  ParticipantFeedback,
  ParticipantFeedbackResult,
  ParticipationApplication,
  ParticipationApplicationDetails,
  ParticipationType,
  ReviewParticipationApplicationRequest,
  SendOfferParticipantsEmailRequest,
  SubmitParticipationApplicationRequest,
  UpdateJointPurchaseOfferStatusRequest,
  UpsertParticipantFeedbackRequest,
} from '@/lib/types/joint-purchase';
import { ApiError, useApi } from '@/lib/use-api';

type CreateOfferFormState = {
  title: string;
  description: string;
  allianceName: string;
  contactGroup: string;
  showOrganizerContacts: boolean;
  showOrganizerGameNickname: boolean;
  showOrganizerTelegram: boolean;
  showOrganizerVk: boolean;
  showOrganizerDiscord: boolean;
  requiredParticipants: number;
  reserveParticipants: number;
  plannedStartAt: string;
  plannedEndAt: string;
  autoApproveEnabled: boolean;
};

type FeedbackDraft = {
  result: ParticipantFeedbackResult;
  description: string;
};

type BulkEmailFormState = {
  subject: string;
  message: string;
  sendToMain: boolean;
  sendToReserve: boolean;
};

const ORGANIZER_ROLES = new Set(['ROLE_contractor', 'ROLE_admin', 'ROLE_superadmin']);

const initialCreateForm: CreateOfferFormState = {
  title: '',
  description: '',
  allianceName: '',
  contactGroup: '',
  showOrganizerContacts: false,
  showOrganizerGameNickname: false,
  showOrganizerTelegram: false,
  showOrganizerVk: false,
  showOrganizerDiscord: false,
  requiredParticipants: 29,
  reserveParticipants: 3,
  plannedStartAt: '',
  plannedEndAt: '',
  autoApproveEnabled: false,
};

const initialBulkEmailForm: BulkEmailFormState = {
  subject: '',
  message: '',
  sendToMain: true,
  sendToReserve: false,
};

const ALLIANCE_NAME_VISIBLE_STATUSES = new Set<JointPurchaseOfferStatus>([
  'READY_TO_START',
  'IN_PROGRESS',
  'COMPLETED',
]);

function fromLocalDateTimeValue(value: string): string {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString();
}

function toLocalDateTimeValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null, locale: 'ru' | 'en' = 'ru'): string {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? '';
}

function buildContactGroupHref(value?: string | null): string | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  if (normalized.startsWith('@')) {
    return `https://t.me/${normalized.slice(1)}`;
  }

  if (normalized.startsWith('t.me/') || normalized.startsWith('telegram.me/')) {
    return `https://${normalized}`;
  }

  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(normalized)) {
    return `https://${normalized}`;
  }

  return null;
}

function buildTelegramHref(value?: string | null): string | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  const handle = normalized.startsWith('@') ? normalized.slice(1) : normalized;

  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    return null;
  }

  return `https://t.me/${handle}`;
}

function getCooldownRemainingMs(nextAllowedAt?: string | null): number {
  if (!nextAllowedAt) {
    return 0;
  }

  const nextAllowedTimestamp = new Date(nextAllowedAt).getTime();

  if (Number.isNaN(nextAllowedTimestamp)) {
    return 0;
  }

  return Math.max(0, nextAllowedTimestamp - Date.now());
}

function formatCooldownRemaining(ms: number, locale: 'ru' | 'en'): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return locale === 'ru' ? `${minutes} мин ${seconds} сек` : `${minutes} min ${seconds} sec`;
}

function buildEmptyFeedbackDraft(): FeedbackDraft {
  return {
    result: 'SUCCESS',
    description: '',
  };
}

function buildDefaultBulkEmailSubject(offer: JointPurchaseOffer, locale: 'ru' | 'en'): string {
  return locale === 'ru'
    ? `Сообщение по совместной закупке: ${offer.title}`
    : `Joint purchase update: ${offer.title}`;
}

function buildDefaultBulkEmailMessage(offer: JointPurchaseOffer, locale: 'ru' | 'en'): string {
  const startAt = formatDateTime(offer.plannedStartAt, locale);
  const endAt = formatDateTime(offer.plannedEndAt, locale);

  if (locale === 'ru') {
    return [
      `Привет!`,
      ``,
      `Это сообщение по совместной закупке "${offer.title}".`,
      `Плановое окно: ${startAt} - ${endAt}.`,
      ``,
      `Если есть вопросы по участию, ответь на это письмо или свяжись с организатором удобным способом.`,
      ``,
      `Спасибо!`,
    ].join('\n');
  }

  return [
    `Hello!`,
    ``,
    `This is an update about the joint purchase "${offer.title}".`,
    `Planned window: ${startAt} - ${endAt}.`,
    ``,
    `If you have any questions about participation, please reply to this email or contact the organizer.`,
    ``,
    `Thank you!`,
  ].join('\n');
}

function SectionCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.16)] ${className}`}>
      {children}
    </div>
  );
}

function OfferStatusBadge({
  status,
  labels,
}: {
  status: JointPurchaseOfferStatus;
  labels: Record<JointPurchaseOfferStatus, string>;
}) {
  const colorClass =
    status === 'COMPLETED'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
      : status === 'CANCELLED'
        ? 'border-red-400/25 bg-red-400/10 text-red-300'
        : status === 'IN_PROGRESS'
          ? 'border-amber-400/25 bg-amber-400/10 text-amber-300'
          : 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${colorClass}`}>
      {labels[status]}
    </span>
  );
}

function EmptyCreateTile({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[18rem] w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-cyan-400/25 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(15,23,42,0.16))] px-6 py-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.18)] transition hover:border-cyan-400/45 hover:bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(15,23,42,0.22))]"
    >
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-cyan-400/20 bg-[var(--surface-strong)] text-cyan-200 shadow-[inset_0_12px_30px_rgba(255,255,255,0.05),0_22px_50px_rgba(0,0,0,0.22)] transition group-hover:scale-105">
        <Plus className="h-11 w-11 opacity-80" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-[var(--foreground-soft)]">{description}</p>
    </button>
  );
}

export default function JointPurchasesPageClient() {
  const { authenticated, roles, userId } = useAuth();
  const { locale, messages } = useI18n();
  const { apiDelete, apiJson, apiPatchJson, apiPostFormData, apiPostJson, apiPutJson } = useApi();

  const [openOffers, setOpenOffers] = useState<JointPurchaseOffer[]>([]);
  const [organizerOffers, setOrganizerOffers] = useState<JointPurchaseOffer[]>([]);
  const [selectedOrganizerOfferId, setSelectedOrganizerOfferId] = useState<string | null>(null);
  const [offerApplications, setOfferApplications] = useState<ParticipationApplication[]>([]);
  const [offerFeedback, setOfferFeedback] = useState<ParticipantFeedback[]>([]);
  const [applicationDetails, setApplicationDetails] = useState<ParticipationApplicationDetails | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingOrganizerBoard, setLoadingOrganizerBoard] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingApplyOfferId, setSubmittingApplyOfferId] = useState<string | null>(null);
  const [actionApplicationId, setActionApplicationId] = useState<string | null>(null);
  const [actionOfferId, setActionOfferId] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [applyModalOffer, setApplyModalOffer] = useState<JointPurchaseOffer | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [showProcessedApplications, setShowProcessedApplications] = useState(false);
  const [showCompletedClientOffers, setShowCompletedClientOffers] = useState(false);
  const [expandedInactiveOfferIds, setExpandedInactiveOfferIds] = useState<Record<string, boolean>>({});
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [createOfferForm, setCreateOfferForm] = useState<CreateOfferFormState>(initialCreateForm);
  const [createOfferFileName, setCreateOfferFileName] = useState<string | null>(null);
  const [createOfferScreenshot, setCreateOfferScreenshot] = useState<ImageUploadResponse | null>(null);
  const [createOfferUploadLoading, setCreateOfferUploadLoading] = useState(false);
  const [applyFileName, setApplyFileName] = useState<string | null>(null);
  const [applyScreenshot, setApplyScreenshot] = useState<ImageUploadResponse | null>(null);
  const [applyUploadLoading, setApplyUploadLoading] = useState(false);
  const [applyEligibilityLoading, setApplyEligibilityLoading] = useState(false);
  const [applyEligibilityAllowed, setApplyEligibilityAllowed] = useState(false);
  const [applyEligibilityMessage, setApplyEligibilityMessage] = useState<string | null>(null);
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [applyModalError, setApplyModalError] = useState<string | null>(null);
  const [bulkEmailModalError, setBulkEmailModalError] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, FeedbackDraft>>({});
  const [organizerProfile, setOrganizerProfile] = useState<PlayerProfileResponse | null>(null);
  const [bulkEmailForm, setBulkEmailForm] = useState<BulkEmailFormState>(initialBulkEmailForm);
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());

  const isOrganizer = useMemo(
    () => roles.some((role) => ORGANIZER_ROLES.has(role)),
    [roles],
  );
  const isAdminOrganizer = roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin');
  const isContractorOnlyOrganizer = roles.includes('ROLE_contractor') && !isAdminOrganizer;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCooldownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!imagePreview) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!pageError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPageError(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [pageError]);

  useEffect(() => {
    if (!pageSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPageSuccess(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [pageSuccess]);

  const copyText = locale === 'ru'
    ? {
        overviewTitle: 'Совместные закупки',
        overviewSubtitle:
          'Здесь вы можете скоординироваться вместе и выгодно приобрести акционные предложения.',
        organizerBadge: 'Доступ организатора',
        createOffer: 'Создать оффер',
        editOffer: 'Редактировать оффер',
        createOfferHint: 'Открой новую закупку и сразу собери первый рабочий сценарий.',
        emptyTitle: 'Пока нет совместных закупок',
        emptyDescription: 'Как только появятся первые офферы, они будут показаны здесь.',
        organizerEmptyDescription: 'Можно уже создать первый оффер и проверить flow прямо с этого экрана.',
        openOffersTitle: 'Доступные офферы и мои участия',
        openOffersHint: 'Здесь видны открытые предложения и закупки, в которых ты уже подтверждён как участник.',
        organizerOffersTitle: 'Мои офферы',
        organizerOffersHint: 'Создание, статусы, заявки, перевод между MAIN и RESERVE и feedback.',
        organizerBoardTitle: 'Панель оффера',
        organizerBoardHint: 'Выбери оффер справа и работай с заявками и финальным feedback.',
        applicationsTitle: 'Заявки',
        feedbackTitle: 'Feedback по MAIN',
        createModalTitle: 'Создать оффер закупки',
        editModalTitle: 'Редактировать оффер закупки',
        applyModalTitle: 'Подать заявку',
        detailsModalTitle: 'Детали заявки',
        screenshotLabel: 'Скриншот',
        screenshotHintOffer: 'Сначала загрузи скриншот акции, потом отправим сам оффер.',
        screenshotHintApplication: 'Прикрепи скриншот, где видно, что акция ещё не куплена.',
        screenshotEmpty: 'Файл не выбран',
        titleLabel: 'Заголовок',
        descriptionLabel: 'Описание',
        allianceNameLabel: 'Название альянса',
        requiredParticipantsLabel: 'Основной набор',
        reserveParticipantsLabel: 'Резерв',
        plannedStartLabel: 'Плановый старт',
        plannedEndLabel: 'Плановое завершение',
        autoApproveLabel: 'Разрешить auto-approve',
        create: 'Создать',
        saveChanges: 'Сохранить изменения',
        submitApplication: 'Отправить заявку',
        cancel: 'Отмена',
        close: 'Закрыть',
        profileBlockTitle: 'Профиль игрока',
        contactsTitle: 'Контакты',
        statusTitle: 'Статус заявки',
        noScreenshot: 'Скриншот пока не загружен',
        openScreenshot: 'Открыть скриншот',
        approveMain: 'Одобрить в основной набор',
        approveReserve: 'Одобрить в резерв',
        reject: 'Отклонить',
        moveToMain: 'Перевести в основной набор',
        moveToReserve: 'Перевести в резерв',
        removeFromPurchase: 'Убрать из закупки',
        saveFeedback: 'Сохранить feedback',
        resultSuccess: 'SUCCESS',
        resultUnsuccess: 'UNSUCCESS',
        commentLabel: 'Комментарий',
        selectedOfferMissing: 'Выбери оффер, чтобы открыть заявки и feedback.',
        noApplications: 'Заявок пока нет.',
        noFeedback: 'Feedback по MAIN пока не заполнен.',
        noOrganizerOffers: 'Ты ещё не создал ни одного оффера.',
        noOpenOffers: 'Сейчас нет открытых офферов.',
        apply: 'Участвовать',
        ownerBadge: 'Твой оффер',
        loadError: 'Не удалось загрузить данные раздела.',
        createSuccess: 'Оффер создан.',
        updateSuccess: 'Оффер обновлён.',
        applySuccess: 'Заявка отправлена.',
        feedbackSuccess: 'Feedback сохранён.',
        statusSuccess: 'Статус оффера обновлён.',
        actionSuccess: 'Действие выполнено.',
        statusLabels: {
          OPEN_FOR_APPLICATIONS: 'Открыт набор',
          MAIN_GROUP_FILLED: 'Основной набор собран',
          READY_TO_START: 'Готов к старту',
          IN_PROGRESS: 'В процессе',
          COMPLETED: 'Завершено',
          CANCELLED: 'Отменено',
        } as Record<JointPurchaseOfferStatus, string>,
        applicationStatusLabels: {
          PENDING_TRUST_CHECK: 'Ожидает trust score',
          PENDING_ORGANIZER_REVIEW: 'Ждёт review',
          APPROVED_MAIN: 'Одобрено в основной набор',
          APPROVED_RESERVE: 'Одобрено в резерв',
          REJECTED: 'Отклонено',
        } as Record<string, string>,
      }
    : {
        overviewTitle: 'Joint purchases',
        overviewSubtitle:
          'Here you can coordinate together and purchase promotional offers more advantageously.',
        organizerBadge: 'Organizer access',
        createOffer: 'Create offer',
        editOffer: 'Edit offer',
        createOfferHint: 'Open a new purchase and build the first real flow.',
        emptyTitle: 'No joint purchases yet',
        emptyDescription: 'The first offers will appear here.',
        organizerEmptyDescription: 'You can already create the first offer and test the flow from this screen.',
        openOffersTitle: 'Available offers and my participations',
        openOffersHint: 'This list shows open offers and purchases where you are already confirmed as a participant.',
        organizerOffersTitle: 'My offers',
        organizerOffersHint: 'Creation, statuses, applications, MAIN/RESERVE moves, and feedback.',
        organizerBoardTitle: 'Offer board',
        organizerBoardHint: 'Pick an offer and work with applications and final feedback.',
        applicationsTitle: 'Applications',
        feedbackTitle: 'MAIN feedback',
        createModalTitle: 'Create purchase offer',
        editModalTitle: 'Edit purchase offer',
        applyModalTitle: 'Submit application',
        detailsModalTitle: 'Application details',
        screenshotLabel: 'Screenshot',
        screenshotHintOffer: 'Upload offer screenshot first, then submit the offer.',
        screenshotHintApplication: 'Attach a screenshot that shows the offer has not been purchased yet.',
        screenshotEmpty: 'No file selected',
        titleLabel: 'Title',
        descriptionLabel: 'Description',
        allianceNameLabel: 'Alliance name',
        requiredParticipantsLabel: 'Main roster',
        reserveParticipantsLabel: 'Reserve',
        plannedStartLabel: 'Planned start',
        plannedEndLabel: 'Planned end',
        autoApproveLabel: 'Allow auto-approve',
        create: 'Create',
        saveChanges: 'Save changes',
        submitApplication: 'Submit application',
        cancel: 'Cancel',
        close: 'Close',
        profileBlockTitle: 'Player profile',
        contactsTitle: 'Contacts',
        statusTitle: 'Application status',
        noScreenshot: 'Screenshot is not available yet',
        openScreenshot: 'Open screenshot',
        approveMain: 'Approve to main roster',
        approveReserve: 'Approve to reserve',
        reject: 'Reject',
        moveToMain: 'Move to main roster',
        moveToReserve: 'Move to reserve',
        removeFromPurchase: 'Remove from purchase',
        saveFeedback: 'Save feedback',
        resultSuccess: 'SUCCESS',
        resultUnsuccess: 'UNSUCCESS',
        commentLabel: 'Comment',
        selectedOfferMissing: 'Select an offer to open applications and feedback.',
        noApplications: 'No applications yet.',
        noFeedback: 'No MAIN feedback yet.',
        noOrganizerOffers: 'You have not created any offers yet.',
        noOpenOffers: 'There are no open offers right now.',
        apply: 'Apply',
        ownerBadge: 'Your offer',
        loadError: 'Failed to load section data.',
        createSuccess: 'Offer created.',
        updateSuccess: 'Offer updated.',
        applySuccess: 'Application submitted.',
        feedbackSuccess: 'Feedback saved.',
        statusSuccess: 'Offer status updated.',
        actionSuccess: 'Action completed.',
        statusLabels: {
          OPEN_FOR_APPLICATIONS: 'Open',
          MAIN_GROUP_FILLED: 'Main roster filled',
          READY_TO_START: 'Ready to start',
          IN_PROGRESS: 'In progress',
          COMPLETED: 'Completed',
          CANCELLED: 'Cancelled',
        } as Record<JointPurchaseOfferStatus, string>,
        applicationStatusLabels: {
          PENDING_TRUST_CHECK: 'Waiting trust score',
          PENDING_ORGANIZER_REVIEW: 'Waiting review',
          APPROVED_MAIN: 'Approved to main roster',
          APPROVED_RESERVE: 'Approved to reserve',
          REJECTED: 'Rejected',
        } as Record<string, string>,
      };

  const allianceNameHiddenLabel =
    locale === 'ru' ? 'Скрыто до готовности закупки' : 'Hidden until purchase is ready';
  const contactGroupLabel = locale === 'ru' ? 'Группа для связи' : 'Contact group';
  const contactGroupHiddenLabel =
    locale === 'ru'
      ? 'Доступно после подтверждения в основной состав'
      : 'Visible after approval to the main roster';
  const organizerContactsToggleLabel =
    locale === 'ru' ? 'Показывать контакты организатора' : 'Show organizer contacts';
  const organizerContactsSectionLabel =
    locale === 'ru' ? 'Контакты организатора' : 'Organizer contacts';
  const organizerNicknameLabel =
    locale === 'ru' ? 'Игровой никнейм' : 'Game nickname';
  const telegramLabel = 'Telegram';
  const vkLabel = 'VK';
  const discordLabel = 'Discord';
  const offersActiveDescription =
    locale === 'ru'
      ? 'Ниже уже есть активные офферы. Можно сразу переходить к нужному сценарию.'
      : 'There are already active offers below. You can jump straight into the needed flow.'; void offersActiveDescription;
  const profileIncompleteForApplyMessage =
    locale === 'ru'
      ? 'Чтобы подать заявку, сначала заполни профиль до статуса COMPLETE.'
      : 'Complete your profile first before submitting an application.';
  const applyCheckFailedMessage =
    locale === 'ru'
      ? 'Не удалось проверить профиль. Попробуй ещё раз.'
      : 'Failed to check profile. Try again.';
  const mainLabel = locale === 'ru' ? 'Основной набор' : 'Main roster';
  const reserveLabel = locale === 'ru' ? 'Резервный состав' : 'Reserve roster';
  const cancelApplicationLabel = locale === 'ru' ? 'Отозвать заявку' : 'Withdraw application';
  const feedbackTitleLabel =
    locale === 'ru' ? 'Фидбэк по основному набору' : 'Main roster feedback';
  const activeOrganizerOffers = organizerOffers.filter(
    (offer) => offer.status !== 'COMPLETED' && offer.status !== 'CANCELLED',
  );
  const inactiveOrganizerOffers = organizerOffers.filter(
    (offer) => offer.status === 'COMPLETED' || offer.status === 'CANCELLED',
  );
  const organizerHasOffers = activeOrganizerOffers.length > 0;
  const shouldShowOrganizerCreate = isOrganizer && activeOrganizerOffers.length === 0;
  const organizerCanCreateOffer = !isContractorOnlyOrganizer || organizerProfile?.status === 'COMPLETE';
  const activeVisibleOffers = openOffers.filter(
    (offer) => offer.status !== 'COMPLETED' && offer.status !== 'CANCELLED',
  );
  const inactiveParticipantOffers = openOffers.filter(
    (offer) =>
      (offer.status === 'COMPLETED' || offer.status === 'CANCELLED')
      && Boolean(offer.currentUserApplicationStatus)
      && offer.organizerUserId !== userId,
  );

  const selectedOrganizerOffer = useMemo(
    () => activeOrganizerOffers.find((offer) => offer.id === selectedOrganizerOfferId) ?? null,
    [activeOrganizerOffers, selectedOrganizerOfferId],
  );
  const selectedOrganizerOfferCooldownMs = selectedOrganizerOffer
    ? Math.max(
        0,
        (selectedOrganizerOffer.nextParticipantsEmailAllowedAt
          ? new Date(selectedOrganizerOffer.nextParticipantsEmailAllowedAt).getTime()
          : 0) - cooldownNow,
      )
    : 0;
  const selectedOrganizerOfferEmailCooldownActive = selectedOrganizerOfferCooldownMs > 0;

  const approvedMainApplications = useMemo(
    () =>
      offerApplications.filter((application) => application.status === 'APPROVED_MAIN'),
    [offerApplications],
  );

  const visibleOfferApplications = useMemo(() => {
    if (showProcessedApplications) {
      return offerApplications;
    }

    return offerApplications.filter(
      (application) => application.status !== 'REJECTED' && application.status !== 'CANCELLED',
    );
  }, [offerApplications, showProcessedApplications]);

  const resetCreateState = () => {
    setEditingOfferId(null);
    setCreateOfferForm(initialCreateForm);
    setCreateOfferFileName(null);
    setCreateOfferScreenshot(null);
    setCreateModalError(null);
  };

  const resetApplyState = () => {
    setApplyFileName(null);
    setApplyScreenshot(null);
    setApplyEligibilityLoading(false);
    setApplyEligibilityAllowed(false);
    setApplyEligibilityMessage(null);
    setApplyModalError(null);
  };

  const resetBulkEmailState = () => {
    setBulkEmailForm(initialBulkEmailForm);
    setBulkEmailModalError(null);
    setSendingBulkEmail(false);
  };

  const startEditingOffer = (offer: JointPurchaseOffer) => {
    setEditingOfferId(offer.id);
    setCreateOfferForm({
      title: offer.title,
      description: offer.description ?? '',
      allianceName: offer.allianceName ?? '',
      contactGroup: offer.contactGroup ?? '',
      showOrganizerContacts: Boolean(offer.showOrganizerContacts),
      showOrganizerGameNickname: Boolean(offer.showOrganizerGameNickname),
      showOrganizerTelegram: Boolean(offer.showOrganizerTelegram),
      showOrganizerVk: Boolean(offer.showOrganizerVk),
      showOrganizerDiscord: Boolean(offer.showOrganizerDiscord),
      requiredParticipants: offer.requiredParticipants,
      reserveParticipants: offer.reserveParticipants,
      plannedStartAt: toLocalDateTimeValue(offer.plannedStartAt),
      plannedEndAt: toLocalDateTimeValue(offer.plannedEndAt),
      autoApproveEnabled: Boolean(offer.autoApproveEnabled),
    });
    setCreateOfferFileName(offer.screenshotObjectKey ? offer.screenshotObjectKey.split('/').pop() ?? null : null);
    setCreateOfferScreenshot(
      offer.screenshotBucket && offer.screenshotObjectKey
        ? {
            bucket: offer.screenshotBucket,
            objectKey: offer.screenshotObjectKey,
            url: offer.screenshotUrl ?? null,
          }
        : null,
    );
    setCreateModalError(null);
    setCreateModalOpen(true);
  };

  const openBulkEmailModal = (offer: JointPurchaseOffer) => {
    setBulkEmailForm({
      subject: buildDefaultBulkEmailSubject(offer, locale),
      message: buildDefaultBulkEmailMessage(offer, locale),
      sendToMain: true,
      sendToReserve: false,
    });
    setBulkEmailModalError(null);
    setBulkEmailModalOpen(true);
  };

  const localizeJointPurchaseError = (message: string) => {
    if (!message) {
      return copyText.loadError;
    }

    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('game nickname is required')) {
      return locale === 'ru' ? 'Игровой ник обязателен.' : 'Game nickname is required.';
    }

    if (normalizedMessage.includes('at least two contact channels are required')) {
      return locale === 'ru'
        ? 'Нужно заполнить минимум 2 из 3 контактов: Telegram, VK, Discord.'
        : 'Fill at least 2 of 3 contact channels: Telegram, VK, Discord.';
    }

    if (normalizedMessage.includes('profile must be complete')) {
      return profileIncompleteForApplyMessage;
    }

    if (normalizedMessage.includes('organizer can have only one active joint purchase offer')) {
      return locale === 'ru'
        ? 'У организатора может быть только один активный оффер одновременно.'
        : 'Organizer can have only one active offer at a time.';
    }

    if (normalizedMessage.includes('user cannot create an offer while participating')) {
      return locale === 'ru'
        ? 'Пока ты участвуешь в активной закупке, создать новый оффер нельзя.'
        : 'You cannot create an offer while participating in another active purchase.';
    }

    if (normalizedMessage.includes('organizer cannot participate')) {
      return locale === 'ru'
        ? 'Организатор не может участвовать в закупках как клиент.'
        : 'Organizer cannot participate as a client.';
    }

    if (normalizedMessage.includes('application already exists')) {
      return locale === 'ru'
        ? 'Заявка на этот оффер уже подана.'
        : 'You have already submitted an application for this offer.';
    }

    if (normalizedMessage.includes('user already has active main participation')) {
      return locale === 'ru'
        ? 'Нельзя подать новую заявку, пока ты уже находишься в основном составе другой активной закупки.'
        : 'You cannot submit a new application while you are already in the main roster of another active purchase.';
    }

    if (normalizedMessage.includes('main group is already full')) {
      return locale === 'ru'
        ? 'Основной набор уже заполнен.'
        : 'Main roster is already full.';
    }

    if (normalizedMessage.includes('reserve group is already full')) {
      return locale === 'ru'
        ? 'Резерв уже заполнен.'
        : 'Reserve is already full.';
    }

    if (normalizedMessage.includes('participants email cooldown is active')) {
      const secondsMatch = normalizedMessage.match(/retry after (\d+) seconds/);
      const seconds = secondsMatch ? Number(secondsMatch[1]) : 0;

      if (seconds > 0) {
        const formatted = formatCooldownRemaining(seconds * 1000, locale);
        return locale === 'ru'
          ? `Повторная отправка будет доступна через ${formatted}.`
          : `Email sending will be available again in ${formatted}.`;
      }

      return locale === 'ru'
        ? 'Повторная отправка писем пока недоступна.'
        : 'Email sending is temporarily unavailable.';
    }

    if (normalizedMessage.includes('application can be cancelled only before the purchase is ready')) {
      return locale === 'ru'
        ? 'Заявку можно отозвать только до подготовки закупки к старту.'
        : 'Application can be withdrawn only before the purchase is ready.';
    }

    if (normalizedMessage.includes('application has already been processed')) {
      return locale === 'ru'
        ? 'Эта заявка уже обработана.'
        : 'This application has already been processed.';
    }

    if (normalizedMessage.includes('plannedendat must be after plannedstartat')) {
      return locale === 'ru'
        ? 'Плановое завершение должно быть позже времени старта.'
        : 'Planned end must be later than planned start.';
    }

    if (normalizedMessage.includes('invalid offer status transition')) {
      return locale === 'ru'
        ? 'Нельзя перевести оффер в этот статус сейчас.'
        : 'This offer cannot be moved to that status now.';
    }

    return message;
  };

  const handleApiError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiError) {
      setPageError(localizeJointPurchaseError(error.message));
      return;
    }

    setPageError(fallbackMessage);
  };

  const loadOpenOffers = async () => {
    const response = await apiJson<JointPurchaseOffer[]>('/api/v1/joint-purchases');
    setOpenOffers(response);
  };

  const loadOrganizerProfileStatus = async () => {
    if (!isOrganizer) {
      setOrganizerProfile(null);
      return;
    }

    const response = await apiJson<PlayerProfileResponse>('/api/v1/profile/me');
    setOrganizerProfile(response);
  };

  const loadOrganizerOffers = async (preserveSelection = true) => {
    if (!isOrganizer) {
      setOrganizerOffers([]);
      return;
    }

    const response = await apiJson<JointPurchaseOffer[]>('/api/v1/organizer/joint-purchases');
    setOrganizerOffers(response);
    const activeOffers = response.filter(
      (offer) => offer.status !== 'COMPLETED' && offer.status !== 'CANCELLED',
    );

    if (!preserveSelection) {
      setSelectedOrganizerOfferId(activeOffers[0]?.id ?? null);
      return;
    }

    setSelectedOrganizerOfferId((current) => {
      if (current && activeOffers.some((item) => item.id === current)) {
        return current;
      }

      return activeOffers[0]?.id ?? null;
    });
  };

  const loadOrganizerOfferBoard = async (offerId: string) => {
    setLoadingOrganizerBoard(true);

    try {
      const [applications, feedback] = await Promise.all([
        apiJson<ParticipationApplication[]>(`/api/v1/organizer/joint-purchases/${offerId}/applications`),
        apiJson<ParticipantFeedback[]>(`/api/v1/organizer/joint-purchases/${offerId}/feedback`),
      ]);

      setOfferApplications(applications);
      setOfferFeedback(feedback);
      setFeedbackDrafts((prev) => {
        const next = { ...prev };

        feedback.forEach((item) => {
          next[item.applicationId] = {
            result: item.result,
            description: item.description ?? '',
          };
        });

        applications
          .filter((item) => item.status === 'APPROVED_MAIN')
          .forEach((item) => {
            if (!next[item.id]) {
              next[item.id] = buildEmptyFeedbackDraft();
            }
          });

        return next;
      });
    } finally {
      setLoadingOrganizerBoard(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingPage(true);
      setPageError(null);

      try {
        await Promise.all([
          loadOpenOffers(),
          loadOrganizerOffers(),
          loadOrganizerProfileStatus(),
        ]);
      } catch (error) {
        if (!cancelled) {
          handleApiError(error, copyText.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authenticated, isOrganizer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedOrganizerOfferId || !isOrganizer) {
      setOfferApplications([]);
      setOfferFeedback([]);
      setApplicationDetails(null);
      return;
    }

    void loadOrganizerOfferBoard(selectedOrganizerOfferId).catch((error) => {
      handleApiError(error, copyText.loadError);
    });
  }, [selectedOrganizerOfferId, isOrganizer]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadOfferScreenshot = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setCreateOfferUploadLoading(true);

    try {
      const response = await apiPostFormData<ImageUploadResponse>(
        '/api/v1/joint-purchases/media/offer-screenshots',
        formData,
      );

      setCreateOfferScreenshot(response);
      setCreateOfferFileName(file.name);
    } finally {
      setCreateOfferUploadLoading(false);
    }
  };

  const uploadApplicationScreenshot = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setApplyUploadLoading(true);

    try {
      const response = await apiPostFormData<ImageUploadResponse>(
        '/api/v1/joint-purchases/media/application-screenshots',
        formData,
      );

      setApplyScreenshot(response);
      setApplyFileName(file.name);
    } finally {
      setApplyUploadLoading(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (
      createOfferForm.showOrganizerContacts &&
      !createOfferForm.showOrganizerGameNickname &&
      !createOfferForm.showOrganizerTelegram &&
      !createOfferForm.showOrganizerVk &&
      !createOfferForm.showOrganizerDiscord
    ) {
      setCreateModalError(
        locale === 'ru'
          ? 'Выбери хотя бы один контакт организатора для показа в оффере.'
          : 'Select at least one organizer contact to show in the offer.',
      );
      return;
    }

    setSubmittingCreate(true);
    setPageError(null);
    setPageSuccess(null);
    setCreateModalError(null);

    try {
      const payload: CreateJointPurchaseOfferRequest = {
        title: normalizeText(createOfferForm.title),
        description: normalizeText(createOfferForm.description),
        allianceName: normalizeText(createOfferForm.allianceName),
        contactGroup: normalizeText(createOfferForm.contactGroup),
        showOrganizerContacts: createOfferForm.showOrganizerContacts,
        showOrganizerGameNickname: createOfferForm.showOrganizerContacts && createOfferForm.showOrganizerGameNickname,
        showOrganizerTelegram: createOfferForm.showOrganizerContacts && createOfferForm.showOrganizerTelegram,
        showOrganizerVk: createOfferForm.showOrganizerContacts && createOfferForm.showOrganizerVk,
        showOrganizerDiscord: createOfferForm.showOrganizerContacts && createOfferForm.showOrganizerDiscord,
        screenshotBucket: createOfferScreenshot?.bucket ?? null,
        screenshotObjectKey: createOfferScreenshot?.objectKey ?? null,
        requiredParticipants: createOfferForm.requiredParticipants,
        reserveParticipants: createOfferForm.reserveParticipants,
        autoApproveEnabled: createOfferForm.autoApproveEnabled,
        plannedStartAt: fromLocalDateTimeValue(createOfferForm.plannedStartAt),
        plannedEndAt: fromLocalDateTimeValue(createOfferForm.plannedEndAt),
      };

      if (editingOfferId) {
        const updated = await apiPutJson<CreateJointPurchaseOfferRequest, JointPurchaseOffer>(
          `/api/v1/organizer/joint-purchases/${editingOfferId}`,
          payload,
        );
        setCreateModalOpen(false);
        resetCreateState();
        setPageSuccess(copyText.updateSuccess);
        await Promise.all([loadOpenOffers(), loadOrganizerOffers(false)]);
        setSelectedOrganizerOfferId(updated.id);
      } else {
        const created = await apiPostJson<CreateJointPurchaseOfferRequest, JointPurchaseOffer>(
          '/api/v1/organizer/joint-purchases',
          payload,
        );

        setCreateModalOpen(false);
        resetCreateState();
        setPageSuccess(copyText.createSuccess);
        await Promise.all([loadOpenOffers(), loadOrganizerOffers(false)]);
        setSelectedOrganizerOfferId(created.id);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateModalError(localizeJointPurchaseError(error.message));
      } else {
        setCreateModalError(copyText.loadError);
      }
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleApply = async () => {
    if (!applyModalOffer) {
      return;
    }

    setSubmittingApplyOfferId(applyModalOffer.id);
    setPageError(null);
    setPageSuccess(null);
    setApplyModalError(null);

    try {
      const payload: SubmitParticipationApplicationRequest = {
        screenshotBucket: applyScreenshot?.bucket ?? null,
        screenshotObjectKey: applyScreenshot?.objectKey ?? null,
      };

      await apiPostJson<SubmitParticipationApplicationRequest, ParticipationApplication>(
        `/api/v1/joint-purchases/${applyModalOffer.id}/applications`,
        payload,
      );

      setApplyModalOffer(null);
      resetApplyState();
      setPageSuccess(copyText.applySuccess);
      await Promise.all([loadOpenOffers(), loadOrganizerOffers()]);
    } catch (error) {
      if (error instanceof ApiError) {
        setApplyModalError(localizeJointPurchaseError(error.message));
      } else {
        setApplyModalError(copyText.loadError);
      }
    } finally {
      setSubmittingApplyOfferId(null);
    }
  };

  const handleCancelApplication = async (offerId: string) => {
    setSubmittingApplyOfferId(offerId);
    setPageError(null);
    setPageSuccess(null);

    try {
      await apiDelete<ParticipationApplication>(`/api/v1/joint-purchases/${offerId}/applications/me`);
      await Promise.all([loadOpenOffers(), loadOrganizerOffers()]);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setSubmittingApplyOfferId(null);
    }
  };

  const openApplyModal = async (offer: JointPurchaseOffer) => {
    setApplyModalOffer(offer);
    resetApplyState();
    setApplyEligibilityLoading(true);

    try {
      const profile = await apiJson<PlayerProfileResponse>('/api/v1/profile/me');
      const isComplete = profile.status === 'COMPLETE';

      setApplyEligibilityAllowed(isComplete);
      setApplyEligibilityMessage(isComplete ? null : profileIncompleteForApplyMessage);
    } catch (error) {
      setApplyEligibilityAllowed(false);

      if (error instanceof ApiError) {
        setApplyEligibilityMessage(error.message);
      } else {
        setApplyEligibilityMessage(applyCheckFailedMessage);
      }
    } finally {
      setApplyEligibilityLoading(false);
    }
  };

  const getAllianceNameLabel = (offer: JointPurchaseOffer, organizerView: boolean) => {
    const isOwnOffer = Boolean(userId && offer.organizerUserId === userId);

    if (organizerView || isOwnOffer || ALLIANCE_NAME_VISIBLE_STATUSES.has(offer.status)) {
      return offer.allianceName;
    }

    return allianceNameHiddenLabel;
  };

  const getContactGroupLabel = (offer: JointPurchaseOffer, organizerView: boolean) => {
    const isOwnOffer = Boolean(userId && offer.organizerUserId === userId);
    const isMainParticipant = offer.currentUserAssignedParticipationType === 'MAIN';

    if (organizerView || isOwnOffer || isMainParticipant) {
      return offer.contactGroup;
    }

    return contactGroupHiddenLabel;
  };

  const renderContactGroupValue = (offer: JointPurchaseOffer, organizerView: boolean) => {
    const label = getContactGroupLabel(offer, organizerView);
    const href = buildContactGroupHref(label);

    if (!href || label === contactGroupHiddenLabel) {
      return label;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 transition hover:text-cyan-200"
      >
        {label}
      </a>
    );
  };

  const getParticipationTypeLabel = (participationType?: ParticipationType | null) => {
    if (!participationType) {
      return null;
    }

    return participationType === 'MAIN' ? mainLabel : reserveLabel;
  };

  const getApplicationStatusLabel = (status?: string | null) => {
    if (!status) {
      return '--';
    }

    if (status === 'CANCELLED') {
      return locale === 'ru' ? 'Заявка отозвана' : 'Withdrawn';
    }

    return copyText.applicationStatusLabels[status] ?? status;
  };

  const renderCurrentUserStatus = (offer: JointPurchaseOffer, organizerView: boolean) => {
    if (organizerView || !offer.currentUserApplicationStatus) {
      return null;
    }

    const assignedLabel = getParticipationTypeLabel(offer.currentUserAssignedParticipationType);

    return (
      <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
          {copyText.statusTitle}
        </div>
        <div className="mt-1 font-semibold text-[var(--foreground)]">
          {getApplicationStatusLabel(offer.currentUserApplicationStatus)}
        </div>
        {assignedLabel ? (
          <div className="mt-1 text-[var(--foreground-soft)]">{assignedLabel}</div>
        ) : null}
      </div>
    );
  };

  const renderOrganizerContacts = (offer: JointPurchaseOffer) => {
    const items = [
      offer.organizerGameNickname
        ? { label: organizerNicknameLabel, value: offer.organizerGameNickname }
        : null,
      offer.organizerTelegramUsername
        ? { label: telegramLabel, value: `@${normalizeText(offer.organizerTelegramUsername).replace(/^@/, '')}` }
        : null,
      offer.organizerVkUsername
        ? { label: vkLabel, value: offer.organizerVkUsername }
        : null,
      offer.organizerDiscordUsername
        ? { label: discordLabel, value: offer.organizerDiscordUsername }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;

    if (!offer.showOrganizerContacts || items.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
        <div className="text-xs uppercase tracking-[0.18em]">{organizerContactsSectionLabel}</div>
        <div className="mt-2 grid gap-2">
          {items.map((item) => (
            <div key={item.label}>
              <span className="text-[var(--foreground)]">{item.label}:</span> {item.value}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canCancelCurrentUserApplication = (offer: JointPurchaseOffer) => {
    if (!offer.currentUserApplicationStatus) {
      return false;
    }

    if (offer.status !== 'OPEN_FOR_APPLICATIONS' && offer.status !== 'MAIN_GROUP_FILLED') {
      return false;
    }

    return (
      offer.currentUserApplicationStatus === 'PENDING_TRUST_CHECK'
      || offer.currentUserApplicationStatus === 'PENDING_ORGANIZER_REVIEW'
      || offer.currentUserApplicationStatus === 'APPROVED_MAIN'
      || offer.currentUserApplicationStatus === 'APPROVED_RESERVE'
    );
  };

  const canApplyToOffer = (offer: JointPurchaseOffer, isOwnOffer: boolean, currentUserHasApplication: boolean) => {
    if (!authenticated || isOwnOffer || currentUserHasApplication) {
      return false;
    }

    if (offer.status === 'OPEN_FOR_APPLICATIONS') {
      return true;
    }

    if (offer.status === 'MAIN_GROUP_FILLED') {
      return offer.currentReserveParticipants < offer.reserveParticipants;
    }

    return false;
  };

  const handleLoadApplicationDetails = async (offerId: string, applicationId: string) => {
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    setPageError(null);

    try {
      const details = await apiJson<ParticipationApplicationDetails>(
        `/api/v1/organizer/joint-purchases/${offerId}/applications/${applicationId}`,
      );
      setApplicationDetails(details);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setLoadingDetails(false);
    }
  };

  const refreshAfterApplicationAction = async (offerId: string) => {
    await Promise.all([
      loadOpenOffers(),
      loadOrganizerOffers(),
      loadOrganizerOfferBoard(offerId),
    ]);
  };

  const handleApprove = async (
    offerId: string,
    applicationId: string,
    participationType: ParticipationType,
  ) => {
    setActionApplicationId(applicationId);
    setPageError(null);

    try {
      const payload: ReviewParticipationApplicationRequest = { participationType };
      await apiPostJson<ReviewParticipationApplicationRequest, ParticipationApplication>(
        `/api/v1/organizer/joint-purchases/${offerId}/applications/${applicationId}/approve`,
        payload,
      );
      setPageSuccess(copyText.actionSuccess);
      await refreshAfterApplicationAction(offerId);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setActionApplicationId(null);
    }
  };

  const handleReject = async (offerId: string, applicationId: string) => {
    setActionApplicationId(applicationId);
    setPageError(null);

    try {
      await apiPostJson<Record<string, never>, ParticipationApplication>(
        `/api/v1/organizer/joint-purchases/${offerId}/applications/${applicationId}/reject`,
        {},
      );
      setPageSuccess(copyText.actionSuccess);
      await refreshAfterApplicationAction(offerId);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setActionApplicationId(null);
    }
  };

  const handleMove = async (
    offerId: string,
    applicationId: string,
    participationType: ParticipationType,
  ) => {
    setActionApplicationId(applicationId);
    setPageError(null);

    try {
      const payload: MoveParticipationRequest = { participationType };
      await apiPatchJson<MoveParticipationRequest, ParticipationApplication>(
        `/api/v1/organizer/joint-purchases/${offerId}/applications/${applicationId}/participation`,
        payload,
      );
      setPageSuccess(copyText.actionSuccess);
      await refreshAfterApplicationAction(offerId);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setActionApplicationId(null);
    }
  };

  const handleOrganizerCancelApprovedApplication = async (
    offerId: string,
    applicationId: string,
  ) => {
    setActionApplicationId(applicationId);
    setPageError(null);

    try {
      await apiDelete<ParticipationApplication>(
        `/api/v1/organizer/joint-purchases/${offerId}/applications/${applicationId}`,
      );
      setApplicationDetails((current) => (
        current?.id === applicationId ? null : current
      ));
      setDetailsModalOpen(false);
      setPageSuccess(copyText.actionSuccess);
      await refreshAfterApplicationAction(offerId);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setActionApplicationId(null);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!selectedOrganizerOffer) {
      return;
    }

    if (!bulkEmailForm.sendToMain && !bulkEmailForm.sendToReserve) {
      setBulkEmailModalError(
        locale === 'ru'
          ? 'Выбери хотя бы один состав для рассылки.'
          : 'Select at least one roster for the email.',
      );
      return;
    }

    setSendingBulkEmail(true);
    setPageError(null);
    setPageSuccess(null);
    setBulkEmailModalError(null);

    try {
      const payload: SendOfferParticipantsEmailRequest = {
        subject: normalizeText(bulkEmailForm.subject),
        message: normalizeText(bulkEmailForm.message),
        sendToMain: bulkEmailForm.sendToMain,
        sendToReserve: bulkEmailForm.sendToReserve,
      };

      const response = await apiPostJson<
        SendOfferParticipantsEmailRequest,
        OfferParticipantsEmailResponse
      >(
        `/api/v1/organizer/joint-purchases/${selectedOrganizerOffer.id}/notifications/email`,
        payload,
      );

      setBulkEmailModalOpen(false);
      resetBulkEmailState();
      await loadOrganizerOffers();
      setPageSuccess(
        locale === 'ru'
          ? `Письма поставлены в отправку: ${response.recipientsCount}`
          : `Email dispatch queued: ${response.recipientsCount}`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setBulkEmailModalError(localizeJointPurchaseError(error.message));
      } else {
        setBulkEmailModalError(copyText.loadError);
      }
    } finally {
      setSendingBulkEmail(false);
    }
  };

  const handleUpdateOfferStatus = async (offerId: string, status: JointPurchaseOfferStatus) => {
    setActionOfferId(offerId);
    setPageError(null);

    try {
      const payload: UpdateJointPurchaseOfferStatusRequest = { status };
      await apiPatchJson<UpdateJointPurchaseOfferStatusRequest, JointPurchaseOffer>(
        `/api/v1/organizer/joint-purchases/${offerId}/status`,
        payload,
      );
      setPageSuccess(copyText.statusSuccess);
      await Promise.all([loadOpenOffers(), loadOrganizerOffers()]);
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        setSelectedOrganizerOfferId(null);
        setOfferApplications([]);
        setOfferFeedback([]);
        setApplicationDetails(null);
      } else {
        await loadOrganizerOfferBoard(offerId);
      }
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setActionOfferId(null);
    }
  };

  const handleSaveFeedback = async (offerId: string, applicationId: string) => {
    const draft = feedbackDrafts[applicationId] ?? buildEmptyFeedbackDraft();
    setSavingFeedbackId(applicationId);
    setPageError(null);

    try {
      const payload: UpsertParticipantFeedbackRequest = {
        result: draft.result,
        description: normalizeText(draft.description),
      };

      await apiPutJson<UpsertParticipantFeedbackRequest, ParticipantFeedback>(
        `/api/v1/organizer/joint-purchases/${offerId}/applications/${applicationId}/feedback`,
        payload,
      );

      setPageSuccess(copyText.feedbackSuccess);
      await loadOrganizerOfferBoard(offerId);
    } catch (error) {
      handleApiError(error, copyText.loadError);
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const renderStatusActions = (offer: JointPurchaseOffer) => {
    if (!isOrganizer || offer.organizerUserId !== userId) {
      return null;
    }

    const availableStatuses = (() => {
      switch (offer.status) {
        case 'OPEN_FOR_APPLICATIONS':
          return ['READY_TO_START'] satisfies JointPurchaseOfferStatus[];
        case 'MAIN_GROUP_FILLED':
          return ['READY_TO_START'] satisfies JointPurchaseOfferStatus[];
        case 'READY_TO_START':
          return ['IN_PROGRESS'] satisfies JointPurchaseOfferStatus[];
        case 'IN_PROGRESS':
          return ['COMPLETED'] satisfies JointPurchaseOfferStatus[];
        default:
          return [];
      }
    })();

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {offer.status === 'OPEN_FOR_APPLICATIONS' ? (
          <button
            type="button"
            onClick={() => startEditingOffer(offer)}
            disabled={actionOfferId === offer.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copyText.editOffer}
          </button>
        ) : null}

        {availableStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => void handleUpdateOfferStatus(offer.id, status)}
            disabled={actionOfferId === offer.id}
            className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionOfferId === offer.id ? '...' : copyText.statusLabels[status]}
          </button>
        ))}

        {offer.status !== 'CANCELLED' && offer.status !== 'COMPLETED' ? (
          <button
            type="button"
            onClick={() => void handleUpdateOfferStatus(offer.id, 'CANCELLED')}
            disabled={actionOfferId === offer.id}
            className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            CANCELLED
          </button>
        ) : null}
      </div>
    );
  };

  const renderOfferCard = (offer: JointPurchaseOffer, organizerView: boolean) => {
    const isOwnOffer = Boolean(userId && offer.organizerUserId === userId);
    const currentUserHasApplication = Boolean(offer.currentUserApplicationStatus);
    const canApply = canApplyToOffer(offer, isOwnOffer, currentUserHasApplication);
    const canCancelApplication = canCancelCurrentUserApplication(offer);

    return (
      <div
        key={offer.id}
        className={`rounded-[1.75rem] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition ${
          organizerView && selectedOrganizerOfferId === offer.id
            ? 'border-cyan-400/45 bg-cyan-400/8'
            : 'border-[var(--border)] bg-[var(--surface)]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{offer.title}</h3>
              <OfferStatusBadge status={offer.status} labels={copyText.statusLabels} />
              {isOwnOffer ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                  {copyText.ownerBadge}
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">
              {offer.description || '--'}
            </p>
          </div>
        </div>

        {offer.screenshotUrl ? (
          <button
            type="button"
            onClick={() => setImagePreview({ url: offer.screenshotUrl!, title: offer.title })}
            className="mt-4 block w-full overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] transition hover:opacity-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.screenshotUrl}
              alt={offer.title}
              className="max-h-[32rem] w-full object-contain"
            />
          </button>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
            <div className="text-xs uppercase tracking-[0.18em]">{mainLabel}</div>
            <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
              {offer.currentMainParticipants} / {offer.requiredParticipants}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
            <div className="text-xs uppercase tracking-[0.18em]">{reserveLabel}</div>
            <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
              {offer.currentReserveParticipants} / {offer.reserveParticipants}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
            <div className="text-xs uppercase tracking-[0.18em]">{copyText.allianceNameLabel}</div>
            <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
              {getAllianceNameLabel(offer, organizerView)}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
            <div className="text-xs uppercase tracking-[0.18em]">{contactGroupLabel}</div>
            <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
              {renderContactGroupValue(offer, organizerView)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--foreground-soft)]">
          <span>{copyText.plannedStartLabel}: {formatDateTime(offer.plannedStartAt, locale)}</span>
          <span>{copyText.plannedEndLabel}: {formatDateTime(offer.plannedEndAt, locale)}</span>
        </div>

        {renderCurrentUserStatus(offer, organizerView)}
        {renderOrganizerContacts(offer)}

        <div className="mt-4 flex flex-wrap gap-2">
          {organizerView ? (
            <button
              type="button"
              onClick={() => setSelectedOrganizerOfferId(offer.id)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            >
              {copyText.organizerBoardTitle}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void openApplyModal(offer);
              }}
              disabled={!canApply}
              className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentUserHasApplication
                ? getApplicationStatusLabel(offer.currentUserApplicationStatus)
                : copyText.apply}
            </button>
          )}

          {!organizerView && canCancelApplication ? (
            <button
              type="button"
              onClick={() => void handleCancelApplication(offer.id)}
              disabled={submittingApplyOfferId === offer.id}
              className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingApplyOfferId === offer.id ? '...' : cancelApplicationLabel}
            </button>
          ) : null}
        </div>

        {renderStatusActions(offer)}
      </div>
    );
  };

  const renderArchivedParticipantOfferCard = (offer: JointPurchaseOffer) => {
    const assignedLabel = getParticipationTypeLabel(offer.currentUserAssignedParticipationType);

    return (
      <div
        key={offer.id}
        className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-[var(--foreground)]">{offer.title}</div>
            <div className="mt-2 text-sm text-[var(--foreground-soft)]">
              {copyText.plannedStartLabel}: {formatDateTime(offer.plannedStartAt, locale)}
            </div>
            <div className="text-sm text-[var(--foreground-soft)]">
              {copyText.plannedEndLabel}: {formatDateTime(offer.plannedEndAt, locale)}
            </div>
          </div>
          <OfferStatusBadge status={offer.status} labels={copyText.statusLabels} />
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            {copyText.statusTitle}
          </div>
          <div className="mt-1 font-semibold text-[var(--foreground)]">
            {getApplicationStatusLabel(offer.currentUserApplicationStatus)}
          </div>
          {assignedLabel ? (
            <div className="mt-1 text-[var(--foreground-soft)]">{assignedLabel}</div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_42%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
          <div className="max-w-4xl">
            {isOrganizer ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {copyText.organizerBadge}
              </div>
            ) : null}

            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">
              {copyText.overviewTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">
              {copyText.overviewSubtitle}
            </p>
          </div>
        </section>

        {pageError ? (
          <div className="fixed bottom-6 left-1/2 z-[95] w-[min(92vw,32rem)] -translate-x-1/2 rounded-2xl border border-red-500/30 bg-slate-950/95 px-4 py-3 text-sm text-red-300 shadow-2xl">
            {pageError}
          </div>
        ) : null}

        {pageSuccess ? (
          <div className="fixed bottom-6 left-1/2 z-[95] w-[min(92vw,32rem)] -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-slate-950/95 px-4 py-3 text-sm text-emerald-300 shadow-2xl">
            {pageSuccess}
          </div>
        ) : null}

        {loadingPage ? (
          <SectionCard className="flex min-h-[18rem] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[var(--foreground-soft)]">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
              <span>{messages.profile.loading}</span>
            </div>
          </SectionCard>
        ) : (
          <>
            {shouldShowOrganizerCreate ? (
              <section>
                <EmptyCreateTile
                  title={copyText.createOffer}
                  description={
                    isContractorOnlyOrganizer && !organizerCanCreateOffer
                      ? (locale === 'ru'
                        ? 'Для создания оффера контрактору нужен заполненный профиль со статусом COMPLETE.'
                        : 'Contractors need a COMPLETE profile before creating an offer.')
                      : copyText.createOfferHint
                  }
                  onClick={() => {
                    if (!organizerCanCreateOffer) {
                      setPageError(
                        locale === 'ru'
                          ? 'Контрактору нужен заполненный профиль со статусом COMPLETE, чтобы создать оффер.'
                          : 'Contractor profile must be COMPLETE before creating an offer.',
                      );
                      return;
                    }
                    resetCreateState();
                    setCreateModalOpen(true);
                  }}
                />
              </section>
            ) : null}

            {(!isOrganizer || !organizerHasOffers) ? (
              <section>
                <SectionCard>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                        {copyText.openOffersTitle}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">
                        {copyText.openOffersHint}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {activeVisibleOffers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
                        {copyText.noOpenOffers}
                      </div>
                    ) : (
                      activeVisibleOffers.map((offer) => renderOfferCard(offer, false))
                    )}
                  </div>
                </SectionCard>
              </section>
            ) : null}

            {organizerHasOffers ? (
              <section className="space-y-6">
                <SectionCard>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {copyText.organizerOffersTitle}
                  </h2>
                  <p className="hidden">
                    {copyText.organizerOffersHint}
                  </p>

                  <div className="mt-6 space-y-4">
                    {activeOrganizerOffers.map((offer) => renderOfferCard(offer, true))}
                  </div>
                </SectionCard>
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <SectionCard>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                        {copyText.organizerBoardTitle}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">
                        {copyText.organizerBoardHint}
                      </p>
                    </div>
                  </div>

                  {!selectedOrganizerOffer ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
                      {copyText.selectedOfferMissing}
                    </div>
                  ) : loadingOrganizerBoard ? (
                    <div className="mt-6 flex min-h-[16rem] items-center justify-center">
                      <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">
                              {selectedOrganizerOffer.title}
                            </h3>
                            <OfferStatusBadge
                              status={selectedOrganizerOffer.status}
                              labels={copyText.statusLabels}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => openBulkEmailModal(selectedOrganizerOffer)}
                            disabled={selectedOrganizerOfferEmailCooldownActive}
                            className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {locale === 'ru' ? 'Написать участникам' : 'Email participants'}
                          </button>
                        </div>
                        {selectedOrganizerOfferEmailCooldownActive ? (
                          <div className="mt-2 text-xs text-amber-300">
                            {locale === 'ru'
                              ? `Повторная отправка через ${formatCooldownRemaining(selectedOrganizerOfferCooldownMs, locale)}`
                              : `Next email available in ${formatCooldownRemaining(selectedOrganizerOfferCooldownMs, locale)}`}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            {copyText.applicationsTitle}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowProcessedApplications((current) => !current)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                          >
                            {showProcessedApplications
                              ? (locale === 'ru' ? 'Скрыть отклонённые и отозванные' : 'Hide rejected and withdrawn')
                              : (locale === 'ru' ? 'Показать отклонённые и отозванные' : 'Show rejected and withdrawn')}
                          </button>
                        </div>

                        {visibleOfferApplications.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
                            {copyText.noApplications}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {visibleOfferApplications.map((application) => (
                              <div
                                key={application.id}
                                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-medium text-[var(--foreground)]">
                                      {application.applicantEmail ?? application.applicantUserId}
                                    </div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                                      {getApplicationStatusLabel(application.status)}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleLoadApplicationDetails(selectedOrganizerOffer.id, application.id)
                                    }
                                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                                  >
                                    {copyText.detailsModalTitle}
                                  </button>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {application.status === 'PENDING_ORGANIZER_REVIEW' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleApprove(selectedOrganizerOffer.id, application.id, 'MAIN')
                                        }
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.approveMain}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleApprove(selectedOrganizerOffer.id, application.id, 'RESERVE')
                                        }
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.approveReserve}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleReject(selectedOrganizerOffer.id, application.id)}
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.reject}
                                      </button>
                                    </>
                                  ) : null}

                                  {(selectedOrganizerOffer.status === 'OPEN_FOR_APPLICATIONS'
                                    || selectedOrganizerOffer.status === 'MAIN_GROUP_FILLED')
                                    && application.status === 'APPROVED_MAIN' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void handleMove(selectedOrganizerOffer.id, application.id, 'RESERVE')}
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.moveToReserve}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleOrganizerCancelApprovedApplication(selectedOrganizerOffer.id, application.id)}
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.removeFromPurchase}
                                      </button>
                                    </>
                                  ) : null}

                                  {(selectedOrganizerOffer.status === 'OPEN_FOR_APPLICATIONS'
                                    || selectedOrganizerOffer.status === 'MAIN_GROUP_FILLED')
                                    && application.status === 'APPROVED_RESERVE' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void handleMove(selectedOrganizerOffer.id, application.id, 'MAIN')}
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.moveToMain}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleOrganizerCancelApprovedApplication(selectedOrganizerOffer.id, application.id)}
                                        disabled={actionApplicationId === application.id}
                                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {copyText.removeFromPurchase}
                                      </button>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>

                {selectedOrganizerOffer && (selectedOrganizerOffer.status === 'IN_PROGRESS' || selectedOrganizerOffer.status === 'COMPLETED') ? (
                  <SectionCard>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                      {feedbackTitleLabel}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">
                      {feedbackTitleLabel}
                    </p>

                    {approvedMainApplications.length === 0 ? (
                      <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
                        {copyText.noFeedback}
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {approvedMainApplications.map((application) => {
                          const draft = feedbackDrafts[application.id] ?? buildEmptyFeedbackDraft();
                          const currentFeedback = offerFeedback.find((item) => item.applicationId === application.id);

                          return (
                            <div
                              key={application.id}
                              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                            >
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-[var(--foreground)]">
                                    {application.applicantEmail ?? application.applicantUserId}
                                  </div>
                                  <div className="text-xs text-[var(--foreground-soft)]">
                                    {currentFeedback ? formatDateTime(currentFeedback.updatedAt, locale) : '--'}
                                  </div>
                                  {currentFeedback ? (
                                    <div className="mt-1 text-xs font-medium text-emerald-300">
                                      {locale === 'ru' ? '(заполнено)' : '(saved)'}
                                    </div>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void handleSaveFeedback(selectedOrganizerOffer.id, application.id)}
                                  disabled={savingFeedbackId === application.id || selectedOrganizerOffer.status === 'COMPLETED'}
                                  className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {savingFeedbackId === application.id ? '...' : copyText.saveFeedback}
                                </button>
                              </div>

                              <div className="grid gap-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFeedbackDrafts((prev) => ({
                                        ...prev,
                                        [application.id]: {
                                          ...draft,
                                          result: 'SUCCESS',
                                        },
                                      }))
                                    }
                                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                      draft.result === 'SUCCESS'
                                        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                  >
                                    {copyText.resultSuccess}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFeedbackDrafts((prev) => ({
                                        ...prev,
                                        [application.id]: {
                                          ...draft,
                                          result: 'UNSUCCESS',
                                        },
                                      }))
                                    }
                                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                      draft.result === 'UNSUCCESS'
                                        ? 'border-red-400/25 bg-red-400/10 text-red-300'
                                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                  >
                                    {copyText.resultUnsuccess}
                                  </button>
                                </div>

                                <textarea
                                  value={draft.description}
                                  onChange={(event) =>
                                    setFeedbackDrafts((prev) => ({
                                      ...prev,
                                      [application.id]: {
                                        ...draft,
                                        description: event.target.value,
                                      },
                                    }))
                                  }
                                  rows={3}
                                  placeholder={copyText.commentLabel}
                                  disabled={selectedOrganizerOffer.status === 'COMPLETED'}
                                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40 disabled:opacity-60"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                ) : null}
              </section>
            </section>
            ) : null}

            {inactiveParticipantOffers.length > 0 ? (
              <SectionCard>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                      {locale === 'ru' ? 'Завершённые закупки' : 'Completed purchases'}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">
                      {locale === 'ru'
                        ? 'Здесь остаются закупки, в которых ты уже участвовал. Можно быстро проверить итоговый статус и свой набор.'
                        : 'This section keeps purchases where you already participated, with the final offer status and your roster.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCompletedClientOffers((current) => !current)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                  >
                    {showCompletedClientOffers
                      ? (locale === 'ru' ? 'Скрыть завершённые закупки' : 'Hide completed purchases')
                      : (locale === 'ru' ? 'Посмотреть завершённые закупки' : 'View completed purchases')}
                  </button>
                </div>

                {showCompletedClientOffers ? (
                  <div className="mt-6 space-y-4">
                    {inactiveParticipantOffers.map((offer) => renderArchivedParticipantOfferCard(offer))}
                  </div>
                ) : null}
              </SectionCard>
            ) : null}

            {isOrganizer && inactiveOrganizerOffers.length > 0 ? (
              <SectionCard>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {locale === 'ru' ? 'Завершённые и отменённые' : 'Completed and cancelled'}
                  </h2>
                  <p className="hidden">
                    {locale === 'ru'
                      ? 'История прошлых закупок. Их можно развернуть и посмотреть.'
                      : 'History of past purchases. Expand any item to review it.'}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {inactiveOrganizerOffers.map((offer) => {
                    const isExpanded = Boolean(expandedInactiveOfferIds[offer.id]);

                    return (
                      <div
                        key={offer.id}
                        className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedInactiveOfferIds((current) => ({
                              ...current,
                              [offer.id]: !current[offer.id],
                            }))
                          }
                          className="flex w-full items-center justify-between gap-3 text-left"
                        >
                          <div>
                            <div className="text-base font-semibold text-[var(--foreground)]">{offer.title}</div>
                            <div className="mt-1 text-sm text-[var(--foreground-soft)]">
                              {formatDateTime(offer.updatedAt, locale)}
                            </div>
                          </div>
                          <OfferStatusBadge status={offer.status} labels={copyText.statusLabels} />
                        </button>

                        {isExpanded ? (
                          <div className="mt-4">
                            {renderOfferCard(offer, true)}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            ) : null}
          </>
        )}
      </div>

      {createModalOpen ? (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setCreateModalOpen(false);
            resetCreateState();
          }}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  {editingOfferId ? copyText.editModalTitle : copyText.createModalTitle}
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    resetCreateState();
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                <div className="rounded-[1.75rem] border border-dashed border-cyan-400/25 bg-cyan-400/8 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{copyText.screenshotLabel}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">{copyText.screenshotHintOffer}</p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-cyan-400/25 bg-[var(--surface)] px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-[var(--surface-hover)]">
                      {createOfferUploadLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      <span>{createOfferFileName ?? copyText.screenshotEmpty}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }

                          void uploadOfferScreenshot(file).catch((error) => {
                            handleApiError(error, copyText.loadError);
                          });
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.titleLabel}</span>
                    <input
                      value={createOfferForm.title}
                      onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.descriptionLabel}</span>
                    <textarea
                      rows={4}
                      value={createOfferForm.description}
                      onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, description: event.target.value }))}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.allianceNameLabel}</span>
                    <input
                      value={createOfferForm.allianceName}
                      onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, allianceName: event.target.value }))}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{contactGroupLabel}</span>
                    <input
                      value={createOfferForm.contactGroup}
                      onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, contactGroup: event.target.value }))}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={createOfferForm.showOrganizerContacts}
                        onChange={(event) =>
                          setCreateOfferForm((prev) => ({
                            ...prev,
                            showOrganizerContacts: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface-strong)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">{organizerContactsToggleLabel}</span>
                    </label>

                    {createOfferForm.showOrganizerContacts ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {organizerProfile?.currentGameNickname ? (
                          <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
                            <input
                              type="checkbox"
                              checked={createOfferForm.showOrganizerGameNickname}
                              onChange={(event) =>
                                setCreateOfferForm((prev) => ({
                                  ...prev,
                                  showOrganizerGameNickname: event.target.checked,
                                }))
                              }
                              className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">{organizerNicknameLabel}</span>
                          </label>
                        ) : null}

                        {organizerProfile?.telegramUsername ? (
                          <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
                            <input
                              type="checkbox"
                              checked={createOfferForm.showOrganizerTelegram}
                              onChange={(event) =>
                                setCreateOfferForm((prev) => ({
                                  ...prev,
                                  showOrganizerTelegram: event.target.checked,
                                }))
                              }
                              className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">{telegramLabel}</span>
                          </label>
                        ) : null}

                        {organizerProfile?.vkUsername ? (
                          <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
                            <input
                              type="checkbox"
                              checked={createOfferForm.showOrganizerVk}
                              onChange={(event) =>
                                setCreateOfferForm((prev) => ({
                                  ...prev,
                                  showOrganizerVk: event.target.checked,
                                }))
                              }
                              className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">{vkLabel}</span>
                          </label>
                        ) : null}

                        {organizerProfile?.discordUsername ? (
                          <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
                            <input
                              type="checkbox"
                              checked={createOfferForm.showOrganizerDiscord}
                              onChange={(event) =>
                                setCreateOfferForm((prev) => ({
                                  ...prev,
                                  showOrganizerDiscord: event.target.checked,
                                }))
                              }
                              className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">{discordLabel}</span>
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.requiredParticipantsLabel}</span>
                    <input
                      type="number"
                      min={1}
                      value={createOfferForm.requiredParticipants}
                      onChange={(event) =>
                        setCreateOfferForm((prev) => ({
                          ...prev,
                          requiredParticipants: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.reserveParticipantsLabel}</span>
                    <input
                      type="number"
                      min={0}
                      value={createOfferForm.reserveParticipants}
                      onChange={(event) =>
                        setCreateOfferForm((prev) => ({
                          ...prev,
                          reserveParticipants: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.plannedStartLabel}</span>
                    <input
                      type="datetime-local"
                      value={createOfferForm.plannedStartAt}
                      onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, plannedStartAt: event.target.value }))}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{copyText.plannedEndLabel}</span>
                    <input
                      type="datetime-local"
                      value={createOfferForm.plannedEndAt}
                      onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, plannedEndAt: event.target.value }))}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 opacity-60">
                  <input
                    type="checkbox"
                    checked={createOfferForm.autoApproveEnabled}
                    disabled
                    onChange={(event) => setCreateOfferForm((prev) => ({ ...prev, autoApproveEnabled: event.target.checked }))}
                    className="mt-1 h-4 w-4 cursor-not-allowed rounded border-[var(--border)] bg-[var(--surface-strong)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{copyText.autoApproveLabel}</span>
                </label>
              </div>

              {createModalError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                  {createModalError}
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    resetCreateState();
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
                >
                  {copyText.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitOffer()}
                  disabled={submittingCreate || createOfferUploadLoading}
                  className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingCreate ? '...' : (editingOfferId ? copyText.saveChanges : copyText.create)}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {applyModalOffer ? (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setApplyModalOffer(null)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">{copyText.applyModalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setApplyModalOffer(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-lg font-semibold text-[var(--foreground)]">{applyModalOffer.title}</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">{applyModalOffer.description || '--'}</div>
                </div>

                <div className="rounded-[1.75rem] border border-dashed border-cyan-400/25 bg-cyan-400/8 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{copyText.screenshotLabel}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--foreground-soft)]">{copyText.screenshotHintApplication}</p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-cyan-400/25 bg-[var(--surface)] px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-[var(--surface-hover)]">
                      {applyUploadLoading || applyEligibilityLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      <span>{applyFileName ?? copyText.screenshotEmpty}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={!applyEligibilityAllowed || applyEligibilityLoading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }

                          void uploadApplicationScreenshot(file).catch((error) => {
                            handleApiError(error, copyText.loadError);
                          });
                        }}
                      />
                    </label>
                  </div>
                </div>

                {applyEligibilityMessage ? (
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
                    {applyEligibilityMessage}
                  </div>
                ) : null}

                {applyModalError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                    {applyModalError}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOffer(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
                >
                  {copyText.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleApply()}
                  disabled={
                    submittingApplyOfferId === applyModalOffer.id
                    || applyUploadLoading
                    || applyEligibilityLoading
                    || !applyEligibilityAllowed
                  }
                  className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingApplyOfferId === applyModalOffer.id ? '...' : copyText.submitApplication}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bulkEmailModalOpen && selectedOrganizerOffer ? (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setBulkEmailModalOpen(false);
            resetBulkEmailState();
          }}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">
                    {locale === 'ru' ? 'Письмо участникам' : 'Email participants'}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground-soft)]">
                    {locale === 'ru'
                      ? 'Выбери, кому отправлять письмо. По умолчанию выбран только основной состав.'
                      : 'Choose which participants should receive the email. By default, only the main roster is selected.'}
                  </p>
                  <p className="hidden">
                    {locale === 'ru'
                      ? 'Письмо уйдет всем активным участникам этого оффера. Текст можно отредактировать перед отправкой.'
                      : 'The message will be sent to all active participants of this offer. You can edit the text before sending.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBulkEmailModalOpen(false);
                    resetBulkEmailState();
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {selectedOrganizerOffer.title}
                  </div>
                  <div className="mt-2 text-sm text-[var(--foreground-soft)]">
                    {locale === 'ru'
                      ? 'Получатели: подтвержденные активные участники выбранных составов'
                      : 'Recipients: confirmed active participants from the selected rosters'}
                  </div>
                  <div className="hidden">
                    {locale === 'ru'
                      ? 'Получатели: активные MAIN и RESERVE участники'
                      : 'Recipients: active MAIN and RESERVE participants'}
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4">
                    <input
                      type="checkbox"
                      checked={bulkEmailForm.sendToMain}
                      onChange={(event) =>
                        setBulkEmailForm((prev) => ({ ...prev, sendToMain: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">{mainLabel}</span>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4">
                    <input
                      type="checkbox"
                      checked={bulkEmailForm.sendToReserve}
                      onChange={(event) =>
                        setBulkEmailForm((prev) => ({ ...prev, sendToReserve: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">{reserveLabel}</span>
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {locale === 'ru' ? 'Тема письма' : 'Email subject'}
                  </span>
                  <input
                    value={bulkEmailForm.subject}
                    onChange={(event) =>
                      setBulkEmailForm((prev) => ({ ...prev, subject: event.target.value }))
                    }
                    maxLength={255}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {locale === 'ru' ? 'Сообщение' : 'Message'}
                  </span>
                  <textarea
                    rows={10}
                    value={bulkEmailForm.message}
                    onChange={(event) =>
                      setBulkEmailForm((prev) => ({ ...prev, message: event.target.value }))
                    }
                    maxLength={5000}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                  />
                </label>

                {bulkEmailModalError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                    {bulkEmailModalError}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBulkEmailModalOpen(false);
                    resetBulkEmailState();
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
                >
                  {copyText.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendBulkEmail()}
                  disabled={sendingBulkEmail || selectedOrganizerOfferEmailCooldownActive}
                  className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingBulkEmail
                    ? '...'
                    : (locale === 'ru' ? 'Отправить письма' : 'Send emails')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailsModalOpen ? (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">{copyText.detailsModalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingDetails || !applicationDetails ? (
                <div className="flex min-h-[18rem] items-center justify-center">
                  <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                </div>
              ) : (
                <div className="space-y-5 overflow-y-auto pr-1">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      {copyText.statusTitle}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-lg font-semibold text-[var(--foreground)]">
                        {getApplicationStatusLabel(applicationDetails.status)}
                      </span>
                      {applicationDetails.assignedParticipationType ? (
                        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                          {getParticipationTypeLabel(applicationDetails.assignedParticipationType)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{copyText.profileBlockTitle}</div>
                      <div className="space-y-2 text-sm text-[var(--foreground-soft)]">
                        <div><span className="text-[var(--foreground)]">{locale === 'ru' ? 'Почта:' : 'Email:'}</span> {applicationDetails.playerProfile?.email ?? '--'}</div>
                        <div><span className="text-[var(--foreground)]">{locale === 'ru' ? 'Имя:' : 'First name:'}</span> {applicationDetails.playerProfile?.firstName ?? '--'}</div>
                        <div><span className="text-[var(--foreground)]">{locale === 'ru' ? 'Фамилия:' : 'Last name:'}</span> {applicationDetails.playerProfile?.lastName ?? '--'}</div>
                        <div><span className="text-[var(--foreground)]">{locale === 'ru' ? 'Игровой никнейм:' : 'Game nickname:'}</span> {applicationDetails.playerProfile?.currentGameNickname ?? '--'}</div>
                        <div><span className="text-[var(--foreground)]">{locale === 'ru' ? 'Статус профиля:' : 'Profile status:'}</span> {applicationDetails.playerProfile?.status ?? '--'}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{copyText.contactsTitle}</div>
                      <div className="space-y-2 text-sm text-[var(--foreground-soft)]">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {locale === 'ru' ? 'Почта:' : 'Email:'} {applicationDetails.playerProfile?.email ?? '--'}</div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {locale === 'ru' ? 'Telegram:' : 'Telegram:'}{' '}
                          {buildTelegramHref(applicationDetails.playerProfile?.telegramUsername) ? (
                            <a
                              href={buildTelegramHref(applicationDetails.playerProfile?.telegramUsername) ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 transition hover:text-cyan-200"
                            >
                              @{normalizeText(applicationDetails.playerProfile?.telegramUsername).replace(/^@/, '')}
                            </a>
                          ) : (
                            applicationDetails.playerProfile?.telegramUsername ?? '--'
                          )}
                        </div>
                        <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> VK: {applicationDetails.playerProfile?.vkUsername ?? '--'}</div>
                        <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Discord: {applicationDetails.playerProfile?.discordUsername ?? '--'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{copyText.screenshotLabel}</div>
                    {applicationDetails.screenshotUrl ? (
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={applicationDetails.screenshotUrl}
                          alt={copyText.screenshotLabel}
                          className="max-h-[22rem] w-full rounded-2xl object-contain"
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
                        {copyText.noScreenshot}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {imagePreview ? (
        <div
          className="fixed inset-0 z-[90] bg-black/85 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div className="relative max-h-full max-w-6xl">
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute right-2 top-2 z-10 rounded-lg border border-white/20 bg-black/50 px-3 py-1 text-sm text-white transition hover:bg-black/70"
              >
                X
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview.url}
                alt={imagePreview.title}
                className="max-h-[90vh] max-w-full rounded-xl object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
