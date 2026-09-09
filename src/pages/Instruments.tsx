import { useEffect, useState } from 'react';
import { fetchInstruments, createInstrument, archiveInstrument, fetchInstrumentPassport } from '../api';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n/LanguageContext';

const EMPTY_FORM = {
  name: '',
  serial_number: '',
  instrument_type: 'Weighing Scale',
  model_number: '',
  capacity_max: '',
  unit_of_measurement: 'kg',
};

export default function Instruments() {
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionInstrumentId, setActionInstrumentId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [passport, setPassport] = useState<any | null>(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLang();
  const isBusiness = user?.role === 'BUSINESS';

  const loadInstruments = () => {
    fetchInstruments().then(data => {
      setInstruments(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadInstruments();
  }, []);

  const filteredInstruments = instruments.filter(inst => {
    const matchesSearch = inst.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inst.instrument_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? inst.instrument_type === categoryFilter : true;
    const matchesStatus = statusFilter ? inst.status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddInstrument = async () => {
    if (!form.name.trim() || !form.serial_number.trim()) {
      showToast(t('inst.requireName'), 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        serial_number: form.serial_number.trim(),
        instrument_type: form.instrument_type,
        model_number: form.model_number.trim() || undefined,
        capacity_max: form.capacity_max ? Number(form.capacity_max) : undefined,
        unit_of_measurement: form.unit_of_measurement,
      };
      const session = localStorage.getItem('lm_session');
      if (session) {
        try {
          const district = JSON.parse(session).user?.district;
          if (district) payload.district = district;
        } catch { /* ignore malformed session */ }
      }
      await createInstrument(payload);
      showToast(t('inst.added'), 'success');
      setIsAddModalOpen(false);
      setForm({ ...EMPTY_FORM });
      loadInstruments();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('inst.failAdd'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openPassport = async (id: string) => {
    setActionInstrumentId(null);
    setPassport(null);
    setPassportLoading(true);
    try {
      const data = await fetchInstrumentPassport(id);
      setPassport(data);
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('inst.failPassport'), 'error');
    } finally {
      setPassportLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveId) return;
    setArchiving(true);
    try {
      await archiveInstrument(archiveId);
      showToast(t('inst.archived'), 'success');
      setArchiveId(null);
      loadInstruments();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('inst.failArchive'), 'error');
    } finally {
      setArchiving(false);
    }
  };

  const eventIcon = (type: string) => {
    const map: Record<string, string> = {
      REGISTERED: 'precision_manufacturing',
      VERIFICATION_REQUESTED: 'description',
      REQUEST_APPROVED: 'task_alt',
      ASSIGNED: 'assignment_ind',
      INSPECTION_SCHEDULED: 'event',
      INSPECTION_PASSED: 'check_circle',
      INSPECTION_FAILED: 'cancel',
      CERTIFICATE_ISSUED: 'verified_user',
      COMPLAINT: 'report',
    };
    return map[type] || 'schedule';
  };

  const healthTint = (category?: string) => {
    const c = (category || '').toUpperCase();
    if (c === 'GOOD' || c === 'EXCELLENT') return 'text-success';
    if (c === 'POOR' || c === 'CRITICAL') return 'text-error';
    return 'text-warning';
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">{t('inst.loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-stack-gap relative">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">{isBusiness ? t('inst.titleBusiness') : t('inst.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{isBusiness ? t('inst.subtitleBusiness') : t('inst.subtitle')}</p>
        </div>
        {isBusiness && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="neu-btn px-6 py-3 flex items-center gap-2 text-primary font-label-lg font-bold bg-primary-fixed/20 hover:bg-primary-fixed/30"
            data-help="add-instrument"
          >
            <span className="material-symbols-outlined">add_circle</span>
            {t('inst.addNew')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="neu-recessed p-4 flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-input w-full pl-12 pr-4 py-3 text-body-md font-body-md placeholder-on-surface-variant/70 text-on-surface bg-transparent focus:ring-0 outline-none" 
            placeholder={t('inst.searchPlaceholder')} 
            type="text" 
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">filter_list</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="neu-btn appearance-none pl-10 pr-8 py-2 flex items-center gap-2 text-on-surface-variant font-label-lg text-label-lg outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
            >
              <option value="">{t('inst.allCategories')}</option>
              <option value="Weighing Scale">{t('inst.catWeigh')}</option>
              <option value="Flow Meter">{t('inst.catFlow')}</option>
              <option value="Thermometer">{t('inst.catThermo')}</option>
            </select>
          </div>
          
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">check_circle</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neu-btn appearance-none pl-10 pr-8 py-2 flex items-center gap-2 text-on-surface-variant font-label-lg text-label-lg outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
            >
              <option value="">{t('inst.allStatuses')}</option>
              <option value="REGISTERED">{t('inst.statRegistered')}</option>
              <option value="PENDING_VERIFICATION">{t('inst.statPending')}</option>
              <option value="UNDER_VERIFICATION">{t('inst.statUnder')}</option>
              <option value="VERIFIED">{t('inst.statVerified')}</option>
              <option value="FAILED">{t('inst.statFailed')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="neu-flat overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-dim/50">
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('inst.colSerial')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('inst.colType')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('inst.colCapacity')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('inst.colCalib')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('inst.colStatus')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold text-right">{t('inst.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim/30">
              {filteredInstruments.length > 0 ? (
                filteredInstruments.map((instrument) => (
                  <tr key={instrument.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="py-4 px-6 font-code text-code text-on-surface font-medium">{instrument.serial_number}</td>
                    <td className="py-4 px-6">
                      <div className="font-body-md text-body-md text-on-surface font-medium">{instrument.instrument_type}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{instrument.model_number}</div>
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">{instrument.capacity_max}{instrument.unit_of_measurement} / Class III</td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">{instrument.verification_frequency_months} mos</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={instrument.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isBusiness && (
                        <button onClick={() => setActionInstrumentId(instrument.id)} className="w-8 h-8 rounded-full neu-btn flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState 
                      icon="search_off" 
                      title={t('inst.noResultsTitle')} 
                      description={t('inst.noResultsDesc')}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-surface-dim/30 flex items-center justify-between">
          <span className="font-body-md text-body-md text-on-surface-variant">{t('inst.showing', { current: '1', total: filteredInstruments.length, all: instruments.length })}</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 neu-btn flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-full bg-primary text-on-primary shadow-sm flex items-center justify-center font-label-sm font-bold">
                1
            </button>
            <button className="w-8 h-8 neu-btn flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add New Instrument Modal */}
      {isAddModalOpen && isBusiness && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="neu-flat rounded-2xl w-full max-w-lg p-6 bg-background max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('inst.addTitle')}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('inst.instrumentName')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={t('inst.namePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('inst.serialLabel')}</label>
                <input
                  type="text"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. SN-998822"
                />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('inst.instrumentType')}</label>
                <select
                  value={form.instrument_type}
                  onChange={(e) => setForm({ ...form, instrument_type: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                >
                  <option>{t('inst.catWeigh')}</option>
                  <option>{t('inst.catFlow')}</option>
                  <option>{t('inst.catThermo')}</option>
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('inst.modelLabel')}</label>
                <input
                  type="text"
                  value={form.model_number}
                  onChange={(e) => setForm({ ...form, model_number: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={t('inst.modelPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('inst.maxCapacity')}</label>
                  <input
                    type="number"
                    value={form.capacity_max}
                    onChange={(e) => setForm({ ...form, capacity_max: e.target.value })}
                    className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('inst.unit')}</label>
                  <select
                    value={form.unit_of_measurement}
                    onChange={(e) => setForm({ ...form, unit_of_measurement: e.target.value })}
                    className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none bg-transparent"
                  >
                    <option>kg</option>
                    <option>liters</option>
                    <option>meters</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 neu-btn text-on-surface-variant font-label-lg rounded-lg">{t('common.cancel')}</button>
                <button
                  onClick={handleAddInstrument}
                  disabled={saving}
                  className="px-6 py-2 neu-flat text-primary !bg-primary !text-on-primary font-label-lg font-bold rounded-lg shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff] disabled:opacity-60"
                >
                  {saving ? t('common.saving') : t('inst.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionInstrumentId && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-slide-up sm:animate-none" onClick={() => setActionInstrumentId(null)}>
          <div className="neu-flat rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 bg-background flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('inst.actionsTitle')}</h3>
              <button onClick={() => setActionInstrumentId(null)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <button 
              onClick={() => {
                showToast(t('inst.editToast'), 'info');
                setActionInstrumentId(null);
              }}
              className="w-full text-left neu-btn px-4 py-3 rounded-lg text-on-surface flex items-center gap-3 hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-primary">edit</span> {t('inst.editDetails')}
            </button>
            
            <button 
              onClick={() => {
                if (actionInstrumentId) openPassport(actionInstrumentId);
              }}
              className="w-full text-left neu-btn px-4 py-3 rounded-lg text-on-surface flex items-center gap-3 hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-primary">history</span> {t('inst.viewHistory')}
            </button>

            <button 
              onClick={() => {
                const id = actionInstrumentId;
                setActionInstrumentId(null);
                if (id) setArchiveId(id);
              }}
              className="w-full text-left neu-btn px-4 py-3 rounded-lg text-error flex items-center gap-3 hover:bg-error-container/20 mt-2"
            >
              <span className="material-symbols-outlined">delete</span> {t('inst.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Archive confirmation */}
      <ConfirmModal
        isOpen={!!archiveId}
        title={t('inst.archiveTitle')}
        message={t('inst.archiveMessage')}
        confirmLabel={archiving ? t('inst.archiving') : t('inst.archive')}
        cancelLabel={t('common.cancel')}
        isDestructive
        onConfirm={handleArchive}
        onCancel={() => setArchiveId(null)}
      />

      {/* Instrument passport / history modal */}
      {(passport || passportLoading) && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-slide-up sm:animate-none" onClick={() => setPassport(null)}>
          <div className="neu-flat rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto p-6 bg-background flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                {t('inst.passportTitle')}
              </h3>
              <button onClick={() => setPassport(null)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {passportLoading && (
              <div className="flex items-center justify-center py-10 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              </div>
            )}

            {passport && (
              <>
                <div className="neu-flat rounded-xl p-4 bg-surface-container-low">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-label-lg text-on-surface font-bold">{passport.instrument?.name}</p>
                      <p className="font-body-sm text-on-surface-variant inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">qr_code_2</span>{passport.instrument?.serial_number}
                      </p>
                    </div>
                    <StatusBadge status={passport.instrument?.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="neu-recessed rounded-lg p-3">
                      <p className="font-label-sm text-on-surface-variant">{t('inst.healthScore')}</p>
                      <p className={`font-headline-sm text-headline-sm font-bold ${healthTint(passport.health_category)}`}>
                        {passport.health_score ?? '-'}/100
                      </p>
                    </div>
                    <div className="neu-recessed rounded-lg p-3">
                      <p className="font-label-sm text-on-surface-variant">{t('inst.healthCategory')}</p>
                      <p className="font-label-lg text-on-surface font-bold">{passport.health_category ?? '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="neu-recessed rounded-xl p-4">
                  <p className="font-label-md text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">fact_check</span>{t('inst.verificationSummary')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="neu-btn rounded-lg p-3 text-center">
                      <p className="font-title-lg text-on-surface font-bold">{(passport.verification_summary?.total_verifications) ?? 0}</p>
                      <p className="font-label-sm text-on-surface-variant">{t('inst.totalVerifications')}</p>
                    </div>
                    <div className="neu-btn rounded-lg p-3 text-center">
                      <p className="font-title-lg text-success font-bold">{passport.verification_summary?.passed ?? 0}</p>
                      <p className="font-label-sm text-on-surface-variant">{t('inst.passCount')}</p>
                    </div>
                    <div className="neu-btn rounded-lg p-3 text-center">
                      <p className="font-title-lg text-error font-bold">{passport.verification_summary?.failed ?? 0}</p>
                      <p className="font-label-sm text-on-surface-variant">{t('inst.failCount')}</p>
                    </div>
                    <div className="neu-btn rounded-lg p-3 text-center">
                      <p className="font-title-lg text-primary font-bold">{passport.verification_summary?.total_certificates ?? 0}</p>
                      <p className="font-label-sm text-on-surface-variant">{t('inst.certificatesLabel')}</p>
                    </div>
                  </div>
                  {passport.verification_summary?.active_certificate && (
                    <div className="neu-btn mt-3 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-success">verified</span>
                        <div>
                          <p className="font-label-sm text-on-surface-variant">{t('inst.activeCertificate')}</p>
                          <p className="font-label-md text-on-surface font-bold">{passport.verification_summary.active_certificate.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-label-sm text-on-surface-variant">{t('inst.validUntil')}</p>
                        <p className="font-label-sm text-on-surface font-semibold">{passport.verification_summary.active_certificate.expiry_date}</p>
                        <p className="font-label-xs text-on-surface-variant">
                          {t('inst.block')} #{passport.verification_summary.active_certificate.block_index}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {passport.health_history && passport.health_history.length > 0 && (
                  <div className="neu-recessed rounded-xl p-4">
                    <p className="font-label-md text-primary mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined">monitor_heart</span>{t('inst.healthHistory')}
                    </p>
                    <div className="flex flex-col gap-2">
                      {passport.health_history.map((h: any, i: number) => (
                        <div key={i} className="neu-btn rounded-lg p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className={`font-label-lg font-bold ${healthTint(h.category)}`}>{h.score}/100 · {h.category}</p>
                            <p className="font-body-sm text-on-surface-variant">{h.reason || '-'}</p>
                          </div>
                          <span className="font-label-xs text-on-surface-variant shrink-0">{h.computed_at?.slice(0, 10)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="neu-recessed rounded-xl p-4">
                  <p className="font-label-md text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">timeline</span>{t('inst.timeline')}
                  </p>
                  {!passport.timeline || passport.timeline.length === 0 ? (
                    <p className="text-on-surface-variant font-body-sm">{t('inst.noEvents')}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {passport.timeline.map((ev: any) => (
                        <div key={ev.id} className="neu-btn rounded-lg p-3 flex gap-3 items-start">
                          <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">{eventIcon(ev.event_type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-label-md text-on-surface font-bold truncate">{ev.title}</p>
                              <span className="font-label-xs text-on-surface-variant shrink-0">{ev.created_at?.slice(0, 10)}</span>
                            </div>
                            {ev.description && <p className="font-body-sm text-on-surface-variant">{ev.description}</p>}
                            {ev.actor && <p className="font-label-xs text-on-surface-variant mt-1">— {ev.actor}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setPassport(null)} className="neu-btn rounded-lg px-6 py-3 font-label-lg text-on-surface font-bold self-center">
                  {t('inst.passportClose')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
