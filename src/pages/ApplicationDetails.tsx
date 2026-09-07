import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchApplicationDetails, cancelVerification, approveVerification, fetchAssignOptions, mapsLink } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { statusTranslationKey } from '../components/StatusBadge';
import { useLang } from '../i18n/LanguageContext';

const OFFICER_ROLES = ['LMO', 'GATC'];

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLang();
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [assignOptions, setAssignOptions] = useState<any>(null);

  const role = user?.role || '';
  const isAdmin = role === 'ADMIN';
  const isOfficer = OFFICER_ROLES.includes(role);
  const isOwner = role === 'BUSINESS';

  const load = () => {
    if (id) {
      fetchApplicationDetails(id).then(data => {
        setAppData(data);
        setLoading(false);
      });
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelVerification(id || '');
      showToast(t('ad.cancelled'), 'success');
      setIsCancelModalOpen(false);
      load();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('ad.failCancel'), 'error');
      setIsCancelModalOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      const updated = await approveVerification(id || '');
      showToast(t('ad.approvedMsg', { name: updated.assigned_officer || '—' }), 'success');
      setAssignModal(false);
      load();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('ad.failApprove'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const openAssignModal = async () => {
    setAssignModal(true);
    setAssignOptions(null);
    try {
      const opts = await fetchAssignOptions(id || '');
      setAssignOptions(opts);
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('ad.failAssignOptions'), 'error');
      setAssignModal(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">{t('ad.loading')}</div>;
  }

  const statusList = [
    { label: t('status.draft'), status: 'DRAFT', icon: 'edit_document' },
    { label: t('status.submitted'), status: 'SUBMITTED', icon: 'send' },
    { label: t('status.approved'), status: 'APPROVED', icon: 'thumb_up' },
    { label: t('status.assigned'), status: 'ASSIGNED_LMO', icon: 'person_outline' },
    { label: t('status.scheduled'), status: 'SCHEDULED', icon: 'calendar_today' },
    { label: t('status.inProgress'), status: 'IN_PROGRESS', icon: 'assignment' },
    { label: t('status.issued'), status: 'CERTIFICATE_ISSUED', icon: 'verified' },
    { label: t('status.rejected'), status: 'REJECTED', icon: 'cancel', danger: true },
    { label: t('status.cancelled'), status: 'CANCELLED', icon: 'close', danger: true },
  ];

  const statusIndex = statusList.findIndex(s => s.status === appData?.status);
  const activeIndex = statusIndex >= 0 ? statusIndex : 0;
  const isRejected = appData?.status === 'REJECTED';
  const isCancelled = appData?.status === 'CANCELLED';
  const assignedToMe = isOfficer && appData?.assigned_to_me === true;
  const otherOfficer = isOfficer && !assignedToMe;
  const canInspect = isOfficer && assignedToMe && ['ASSIGNED_LMO', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'].includes(appData?.status);
  const canApprove = isAdmin && ['SUBMITTED', 'APPROVED'].includes(appData?.status);
  const canCancel = (isOwner || isAdmin) && !['CANCELLED', 'REJECTED', 'CERTIFICATE_ISSUED'].includes(appData?.status);

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-stack-gap relative">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-3">
            <button className="neu-btn p-2 text-on-surface-variant inline-flex rounded-full" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            {appData?.id}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 ml-14">{appData?.type} - {appData?.business_name}</p>
        </div>
        <div className="flex gap-3">
          <span className={`px-4 py-1.5 rounded-full neu-extruded font-label-sm text-label-sm flex items-center gap-2 ${isRejected || isCancelled ? 'text-error' : 'text-primary'}`}>
            <span className={`w-2 h-2 rounded-full ${isRejected || isCancelled ? 'bg-error' : 'bg-primary'}`}></span> {statusTranslationKey(appData?.status) ? t(statusTranslationKey(appData?.status)!) : appData?.status}
          </span>
        </div>
      </div>

      {/* Top Workflow Stepper */}
      <section className="neu-flat p-padding-card w-full overflow-x-auto">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">{t('ad.workflow')}</h3>
        <div className="min-w-[800px] flex items-center justify-between relative px-4 py-4">
          <div className="absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 neu-recessed z-0"></div>
          <div
            className="absolute top-1/2 left-8 h-1 -translate-y-1/2 bg-primary z-0 rounded-full transition-all duration-500"
            style={{ width: `${(activeIndex / (statusList.length - 1)) * 100}%` }}
          ></div>

          {statusList.map((step, index) => (
            <Step
              key={step.status}
              active={index === activeIndex}
              completed={index < activeIndex}
              danger={step.danger}
              label={step.label}
              icon={step.icon}
            />
          ))}
        </div>
      </section>

      {(isRejected || isCancelled) && (
        <section className={`rounded-2xl p-5 flex gap-4 items-start ${isCancelled ? 'neu-flat' : 'border-2 border-error/30 bg-error-container/20'}`}>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isCancelled ? 'neu-recessed text-on-surface-variant' : 'bg-error text-on-error'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{isCancelled ? 'block' : 'gpp_bad'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className={`font-headline-sm text-headline-sm font-bold ${isCancelled ? 'text-on-surface' : 'text-error'}`}>
              {isCancelled ? t('ad.cancelledTitle') : t('ad.rejectedTitle')}
            </h3>
            {isRejected ? (
              <p className="font-body-md text-body-md text-on-surface">{appData?.rejection_reason || t('ad.rejectedMsg')}</p>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">{t('ad.cancelledMsg')}</p>
            )}
          </div>
        </section>
      )}

      {/* Details Grid (printable) */}
      <div className="print-area grid grid-cols-1 lg:grid-cols-3 gap-stack-gap mb-20">
        <section className="neu-flat p-padding-card lg:col-span-1 h-full">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">storefront</span> {t('ad.businessInfo')}
          </h3>
          <div className="flex flex-col gap-4">
            <InfoItem label={t('ad.businessName')} value={appData?.business_name} />
            <InfoItem label={t('ad.regNumber')} value={appData?.registration_number} isCode />
            <InfoItem label={t('ad.location')} value={appData?.location} />
            {isOfficer && appData?.location && (
              <a href={mapsLink(appData.location)} target="_blank" rel="noreferrer" className="neu-extruded p-3 flex items-center justify-between rounded-lg font-label-sm text-label-sm text-primary hover:bg-primary-fixed/20 transition-colors">
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">map</span> {t('ad.navigateMaps')}</span>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
            )}
            <InfoItem label={t('ad.requestType')} value={appData?.type} />
            <InfoItem label={t('ad.prefDate')} value={appData?.preferred_date} />
            <InfoItem label={t('ad.schedDate')} value={appData?.scheduled_date} />
            <InfoItem label={t('ad.assignedOfficer')} value={appData?.assigned_officer} />
            {otherOfficer && (
              <div className="rounded-xl p-4 border-2 border-outline-variant bg-surface-container-low flex gap-3 items-start">
                <span className="material-symbols-outlined text-on-surface-variant">person_off</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {t('ad.otherOfficerMsg', { name: appData?.assigned_officer || '—' })}
                </p>
              </div>
            )}
            <div className="neu-recessed p-4 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline">{t('ad.contactLabel')}</span>
              <span className="font-body-md text-body-md text-on-surface">{appData?.contact_person}</span>
              <span className="font-body-md text-body-md text-primary">{appData?.contact_phone}</span>
            </div>
          </div>
        </section>

        <section className="neu-flat p-padding-card lg:col-span-2 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">scale</span> {t('ad.instrumentsFor')}
            </h3>
            <span className="neu-recessed px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">{t('ad.items', { count: appData?.instruments?.length || 0 })}</span>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {appData?.instruments.map((inst: any, idx: number) => (
              <InstrumentItem
                key={idx}
                name={inst.name}
                serial={inst.serial}
                icon={inst.icon}
                type={inst.type}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-background/80 backdrop-blur-md p-4 shadow-[0_-4px_10px_rgba(220,225,235,0.5)] flex justify-end gap-4 z-10 border-t border-surface-dim">
        <button onClick={() => window.print()} className="neu-btn px-6 py-2.5 font-label-lg text-label-lg text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">print</span> {t('ad.print')}
        </button>
        {canCancel && (
          <button onClick={() => setIsCancelModalOpen(true)} className="neu-btn px-6 py-2.5 font-label-lg text-label-lg text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">cancel</span> {t('ad.cancelApp')}
          </button>
        )}
        {canApprove && (
          <button onClick={openAssignModal} disabled={busy} className="neu-btn px-6 py-2.5 font-label-lg text-label-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">thumb_up</span> {busy ? t('ad.approving') : t('ad.approveAssign')}
          </button>
        )}
        {canInspect && (
          <Link to={`/inspections/${id}`} className="neu-btn px-8 py-2.5 font-label-lg text-label-lg flex items-center gap-2 ml-4 text-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-lg">
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span> {t('ad.beginInspection')}
          </Link>
        )}
      </div>

      <ConfirmModal
        isOpen={isCancelModalOpen}
        title={t('ad.cancelTitle')}
        message={t('ad.cancelMsg')}
        confirmLabel={t('ad.confirmCancel')}
        isDestructive={true}
        onConfirm={handleCancel}
        onCancel={() => setIsCancelModalOpen(false)}
      />

      {/* Approve & Assign preview modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setAssignModal(false)}>
          <div className="neu-flat rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('ad.assignTitle')}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('ad.assignSubtitle')}</p>
              </div>
              <button onClick={() => setAssignModal(false)} className="neu-btn p-2 rounded-full"><span className="material-symbols-outlined">close</span></button>
            </div>

            {!assignOptions ? (
              <div className="flex items-center gap-3 py-6 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">sync</span> {t('ad.computing')}
              </div>
            ) : (
              <>
                <div className="neu-recessed rounded-xl p-4 mb-3 font-label-sm text-label-sm text-on-surface">
                  <span className="text-outline block mb-1.5">{t('ad.instrumentDistrict')}</span>
                  <span className="font-bold text-primary">{assignOptions.district || '—'}</span>
                  <span className="text-outline block mt-2 mb-1.5">{t('ad.policyChosen')}</span>
                  <span className="font-bold text-secondary">{t('ad.recommended', { value: `${assignOptions.entity_type || 'LMO'} · ${assignOptions.officers?.find((o: any) => o.public_id === assignOptions.recommended)?.name || '—'}` })}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto mb-4">
                  {(assignOptions.officers || []).map((o: any) => {
                    const rec = o.recommended;
                    return (
                      <div key={o.public_id || o.id} className={`rounded-xl p-4 flex items-center justify-between ${rec ? 'neu-extruded border-2 border-primary' : 'neu-flat'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full neu-recessed flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">person</span>
                          </div>
                          <div>
                            <p className="font-label-sm text-label-sm text-on-surface font-bold flex items-center gap-2">
                              {o.name}
                              {rec && <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">{t('ad.recBadge')}</span>}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {o.in_district ? t('ad.sameDistrict') : t('ad.district', { value: o.district || '—' })} · {o.role} · {t('ad.workload', { value: o.workload })}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full neu-recessed font-label-sm text-label-sm text-secondary font-bold">{t('ad.active', { value: o.workload })}</span>
                      </div>
                    );
                  })}
                  {!assignOptions.officers?.length && (
                    <p className="font-body-md text-body-md text-on-surface-variant">{t('ad.noOfficer')}</p>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setAssignModal(false)} className="neu-btn px-6 py-2.5 font-label-lg text-label-lg text-on-surface-variant">{t('common.cancel')}</button>
                  <button onClick={handleApprove} disabled={busy} className="neu-btn px-6 py-2.5 font-label-lg text-label-lg text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">thumb_up</span> {busy ? t('ad.approving') : t('ad.approveAuto')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ active, completed, danger, label, icon }: any) {
  if (completed) {
    return (
      <div className="relative z-10 flex flex-col items-center gap-2 w-24 text-center">
        <div className="w-10 h-10 rounded-full bg-primary text-on-primary shadow-md flex items-center justify-center">
          <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface font-bold">{label}</span>
      </div>
    );
  }

  if (active) {
    return (
      <div className="relative z-10 flex flex-col items-center gap-2 w-24 text-center">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${danger ? 'neu-extruded border-error text-error' : 'neu-extruded border-primary text-primary'}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`font-label-sm text-label-sm font-bold ${danger ? 'text-error' : 'text-primary'}`}>{label}</span>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col items-center gap-2 w-24 text-center opacity-50">
      <div className="w-10 h-10 rounded-full neu-flat text-on-surface-variant flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
    </div>
  );
}

function InfoItem({ label, value, isCode }: { label: string, value: string, isCode?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="neu-recessed p-4 flex flex-col gap-1 rounded-lg">
      <span className="font-label-sm text-label-sm text-outline">{label}</span>
      <span className={isCode ? "font-code text-code text-on-surface" : "font-body-md text-body-md text-on-surface font-medium"}>{value}</span>
    </div>
  );
}

function InstrumentItem({ name, serial, icon, type }: any) {
  const { t } = useLang();
  return (
    <div className="neu-extruded p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg neu-recessed flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="font-label-lg text-label-lg text-on-surface">{name}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('ad.serialPrefix', { serial })}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="px-3 py-1 rounded-md neu-recessed font-label-sm text-label-sm text-on-surface-variant">Class III</span>
        <span className="px-3 py-1 rounded-md font-label-sm text-label-sm neu-recessed text-secondary">{type}</span>
      </div>
    </div>
  );
}