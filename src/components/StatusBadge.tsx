import { useLang } from '../i18n/LanguageContext';

const STATUS_KEY: Record<string, string> = {
  DRAFT: 'status.draft',
  SUBMITTED: 'status.submitted',
  ASSIGNED: 'status.assigned',
  ASSIGNED_LMO: 'status.assigned',
  APPROVED: 'status.approved',
  SCHEDULED: 'status.scheduled',
  IN_PROGRESS: 'status.inProgress',
  COMPLETED: 'status.completed',
  ISSUED: 'status.issued',
  CERTIFICATE_ISSUED: 'status.issued',
  REJECTED: 'status.rejected',
  CANCELLED: 'status.cancelled',
  ACTIVE: 'status.active',
  EXPIRED: 'status.expired',
  PENDING: 'status.pending',
  FAILED: 'status.failed',
  REGISTERED: 'status.registered',
  PENDING_VERIFICATION: 'status.pending',
  UNDER_INSPECTION: 'status.underInspection',
  UNDER_VERIFICATION: 'status.underInspection',
  VERIFIED: 'status.verified',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-surface-variant/10 text-on-surface-variant border border-surface-variant/20',
  SUBMITTED: 'bg-primary-fixed/40 text-primary border border-primary/20',
  ASSIGNED: 'bg-tertiary-fixed/50 text-tertiary border border-tertiary/20',
  ASSIGNED_LMO: 'bg-tertiary-fixed/50 text-tertiary border border-tertiary/20',
  APPROVED: 'bg-green-100 text-green-800 border border-green-200',
  SCHEDULED: 'bg-tertiary-fixed/50 text-tertiary border border-tertiary/20',
  IN_PROGRESS: 'bg-primary-container/20 text-on-primary-fixed border border-primary/20',
  COMPLETED: 'bg-green-100 text-green-800 border border-green-200',
  ISSUED: 'bg-green-100 text-green-800 border border-green-200',
  CERTIFICATE_ISSUED: 'bg-green-100 text-green-800 border border-green-200',
  REJECTED: 'bg-error-container/50 text-on-error-container border border-error/20',
  CANCELLED: 'bg-gray-100 text-gray-700 border border-gray-200',
  ACTIVE: 'bg-green-100 text-green-700 border border-green-200',
  EXPIRED: 'bg-error-container/50 text-on-error-container border border-error/20',
  PENDING: 'bg-tertiary-container/20 text-tertiary border border-tertiary/20',
  FAILED: 'bg-error-container/50 text-on-error-container border border-error/20',
  REGISTERED: 'bg-surface-variant/10 text-on-surface-variant border border-surface-variant/20',
  PENDING_VERIFICATION: 'bg-tertiary-container/20 text-tertiary border border-tertiary/20',
  UNDER_INSPECTION: 'bg-primary-container/20 text-on-primary-fixed border border-primary/20',
  UNDER_VERIFICATION: 'bg-primary-container/20 text-on-primary-fixed border border-primary/20',
  VERIFIED: 'bg-green-100 text-green-800 border border-green-200',
};

export function statusTranslationKey(status: string): string | undefined {
  return STATUS_KEY[status];
}

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const label = STATUS_KEY[status] ? t(STATUS_KEY[status]) : status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${STATUS_STYLE[status] ?? 'bg-surface-variant/10 text-on-surface-variant border border-surface-variant/20'}`}>
      {label}
    </span>
  );
}