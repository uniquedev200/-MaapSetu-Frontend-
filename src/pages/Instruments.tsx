import { useEffect, useState } from 'react';
import { fetchInstruments, createInstrument } from '../api';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import EmptyState from '../components/EmptyState';

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
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
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
      showToast('Please provide the instrument name and serial number.', 'error');
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
      showToast('Instrument Added Successfully.', 'success');
      setIsAddModalOpen(false);
      setForm({ ...EMPTY_FORM });
      loadInstruments();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to add instrument.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">Loading instruments...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-stack-gap relative">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">{isBusiness ? 'My Instruments' : 'Instrument Inventory'}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{isBusiness ? 'Manage and track the instruments registered to your business.' : 'Instruments linked to your assigned verifications and inspections.'}</p>
        </div>
        {isBusiness && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="neu-btn px-6 py-3 flex items-center gap-2 text-primary font-label-lg font-bold bg-primary-fixed/20 hover:bg-primary-fixed/30"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add New Instrument
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
            placeholder="Search by Serial Number or Type..." 
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
              <option value="">All Categories</option>
              <option value="Weighing Scale">Weighing Scale</option>
              <option value="Flow Meter">Flow Meter</option>
              <option value="Thermometer">Thermometer</option>
            </select>
          </div>
          
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">check_circle</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neu-btn appearance-none pl-10 pr-8 py-2 flex items-center gap-2 text-on-surface-variant font-label-lg text-label-lg outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="PENDING_VERIFICATION">Pending</option>
              <option value="UNDER_VERIFICATION">Under Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="FAILED">Failed</option>
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
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Serial Number</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Type/Category</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Capacity/Class</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Calibration Freq.</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Verification Status</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold text-right">Actions</th>
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
                      <InstrumentStatus status={instrument.status} />
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
                      title="No instruments found" 
                      description="Try adjusting your search query or filters."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-surface-dim/30 flex items-center justify-between">
          <span className="font-body-md text-body-md text-on-surface-variant">Showing 1-{filteredInstruments.length} of {instruments.length} instruments</span>
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
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Add New Instrument</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Instrument Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Platform Scale"
                />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Serial Number</label>
                <input
                  type="text"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. SN-998822"
                />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Instrument Type</label>
                <select
                  value={form.instrument_type}
                  onChange={(e) => setForm({ ...form, instrument_type: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                >
                  <option>Weighing Scale</option>
                  <option>Flow Meter</option>
                  <option>Thermometer</option>
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Model Number</label>
                <input
                  type="text"
                  value={form.model_number}
                  onChange={(e) => setForm({ ...form, model_number: e.target.value })}
                  className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. DS-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={form.capacity_max}
                    onChange={(e) => setForm({ ...form, capacity_max: e.target.value })}
                    className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Unit</label>
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
                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 neu-btn text-on-surface-variant font-label-lg rounded-lg">Cancel</button>
                <button
                  onClick={handleAddInstrument}
                  disabled={saving}
                  className="px-6 py-2 neu-flat text-primary !bg-primary !text-on-primary font-label-lg font-bold rounded-lg shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Add Instrument'}
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
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Instrument Actions</h3>
              <button onClick={() => setActionInstrumentId(null)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <button 
              onClick={() => {
                showToast('Opening Edit Dialog...', 'info');
                setActionInstrumentId(null);
              }}
              className="w-full text-left neu-btn px-4 py-3 rounded-lg text-on-surface flex items-center gap-3 hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-primary">edit</span> Edit Details
            </button>
            
            <button 
              onClick={() => {
                showToast('Fetching history logs...', 'info');
                setActionInstrumentId(null);
              }}
              className="w-full text-left neu-btn px-4 py-3 rounded-lg text-on-surface flex items-center gap-3 hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-primary">history</span> View History
            </button>

            <button 
              onClick={() => {
                showToast('Instrument deleted successfully.', 'error');
                setActionInstrumentId(null);
              }}
              className="w-full text-left neu-btn px-4 py-3 rounded-lg text-error flex items-center gap-3 hover:bg-error-container/20 mt-2"
            >
              <span className="material-symbols-outlined">delete</span> Delete Instrument
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InstrumentStatus({ status }: { status: string }) {
  switch (status) {
    case 'REGISTERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/20 text-primary">
          <span className="w-2 h-2 rounded-full bg-primary"></span> REGISTERED
        </span>
      );
    case 'PENDING_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-container/20 text-tertiary">
          <span className="w-2 h-2 rounded-full bg-tertiary"></span> PENDING_VERIFICATION
        </span>
      );
    case 'UNDER_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed/40 text-tertiary-container">
          <span className="material-symbols-outlined text-[14px] animate-spin">sync</span> UNDER_VERIFICATION
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <span className="material-symbols-outlined text-[14px]">check_circle</span> VERIFIED
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error-container/50 text-on-error-container">
          <span className="material-symbols-outlined text-[14px]">error</span> FAILED
        </span>
      );
    default:
      return <span>{status}</span>;
  }
}
