import { useState, useEffect } from 'react';
import { fetchApplications, createVerification, fetchInstruments } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import EmptyState from '../components/EmptyState';

type Instrument = { id: string; name: string; serial_number: string; status: string };

export default function Applications() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isBusiness = user?.role === 'BUSINESS';
    const [applications, setApplications] = useState<any[]>([]);
    const [instruments, setInstruments] = useState<Instrument[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<any>({
        request_type: 'NEW_VERIFICATION',
        instrument_public_id: '',
        preferred_date: '',
        remarks: '',
    });

    useEffect(() => {
        fetchApplications().then(setApplications).catch(console.error);
    }, []);

    const openModal = () => {
        fetchInstruments()
            .then((insts: Instrument[]) => {
                setInstruments(insts);
                const available = insts.filter(i => ['REGISTERED', 'VERIFIED', 'PENDING_VERIFICATION'].includes(i.status));
                if (available.length > 0) {
                    setForm((f: any) => ({ ...f, instrument_public_id: available[0].id }));
                }
                setIsAddModalOpen(true);
            })
            .catch(() => setIsAddModalOpen(true));
    };

    const handleCreate = async () => {
        if (!form.instrument_public_id) {
            showToast('Please select an instrument first.', 'error');
            return;
        }
        setCreating(true);
        try {
            const data: any = {
                instrument_public_id: form.instrument_public_id,
                request_type: form.request_type,
            };
            if (form.preferred_date) data.preferred_date = form.preferred_date;
            if (form.remarks) data.remarks = form.remarks;
            const created = await createVerification(data);
            showToast('Application created.', 'success');
            setIsAddModalOpen(false);
            navigate(`/applications/${created.id}`);
        } catch (error: any) {
            showToast(error?.response?.data?.detail || 'Failed to create application.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (app.type && app.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              app.status.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter ? app.type === typeFilter : true;
        const matchesStatus = statusFilter ? app.status === statusFilter : true;
        return matchesSearch && matchesType && matchesStatus;
    });

    const selectableInstruments = instruments.filter(i => ['REGISTERED', 'VERIFIED', 'PENDING_VERIFICATION'].includes(i.status));

    return (
        <div className="max-w-7xl mx-auto space-y-8 w-full relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Applications</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{isBusiness ? 'Manage your verification applications.' : 'All verification applications across the jurisdiction.'}</p>
                </div>
                {isBusiness && (
                  <button
                    onClick={openModal}
                    className="neu-btn !bg-primary !text-on-primary px-6 py-2.5 rounded-lg font-label-lg text-label-lg flex items-center gap-2 hover:opacity-90"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    New Application
                  </button>
                )}
            </div>

            {/* Filters */}
            <div className="neu-recessed p-4 flex flex-col lg:flex-row gap-4 items-center justify-between w-full mb-4">
              <div className="relative w-full lg:w-96 flex-shrink-0">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="neu-input w-full pl-12 pr-4 py-3 text-body-md font-body-md placeholder-on-surface-variant/70 text-on-surface bg-transparent focus:ring-0 outline-none"
                  placeholder="Search by App ID or Status..."
                  type="text"
                />
              </div>
              <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">filter_list</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="neu-btn appearance-none pl-10 pr-8 py-2 flex items-center gap-2 text-on-surface-variant font-label-lg text-label-lg outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="New Verification">New Verification</option>
                    <option value="Renewal">Renewal</option>
                    <option value="Re-verification">Re-verification</option>
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
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ASSIGNED_LMO">Assigned</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="neu-flat p-padding-card">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="text-on-surface-variant font-label-sm text-label-sm border-b border-surface-container-high">
                                <th className="pb-3 px-4 font-semibold uppercase tracking-wider">App ID</th>
                                <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Type</th>
                                <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                                <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-body-md text-on-surface">
                            {filteredApplications.length > 0 ? (
                                filteredApplications.map((app) => (
                                    <tr key={app.id} className="border-b border-surface-container-highest/50 hover:bg-surface-container-low/50 transition-colors">
                                        <td className="py-4 px-4 font-code text-primary">{app.id}</td>
                                        <td className="py-4 px-4">{app.type || 'New Verification'}</td>
                                        <td className="py-4 px-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-surface-variant/10 text-on-surface-variant border border-surface-variant/20">
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <Link to={`/applications/${app.id}`} className="neu-btn p-2 text-on-surface-variant rounded-md inline-flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                  <tr>
                                    <td colSpan={4} className="p-0">
                                      <EmptyState
                                        icon="search_off"
                                        title="No applications found"
                                        description="We couldn't find any applications matching your current filters."
                                      />
                                    </td>
                                  </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Application Modal */}
            {isAddModalOpen && isBusiness && (
              <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="neu-flat rounded-2xl w-full max-w-lg p-6 bg-background max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Start New Application</h2>
                    <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Application Type</label>
                      <select
                        value={form.request_type}
                        onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                        className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                      >
                        <option value="NEW_VERIFICATION">New Verification</option>
                        <option value="RENEWAL">Renewal</option>
                        <option value="RE_VERIFICATION">Re-verification (Post Repair)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Select Instrument</label>
                      {selectableInstruments.length > 0 ? (
                        <select
                          value={form.instrument_public_id}
                          onChange={(e) => setForm({ ...form, instrument_public_id: e.target.value })}
                          className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                        >
                          {selectableInstruments.map((inst) => (
                            <option key={inst.id} value={inst.id}>{inst.serial_number} ({inst.name})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-red-500 text-body-md">
                          No registered instruments available. Register one under Instruments first.
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={form.preferred_date}
                        onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                        className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Remarks (optional)</label>
                      <textarea
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
                        placeholder="Any additional details..."
                      />
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 neu-btn text-on-surface-variant font-label-lg rounded-lg">Cancel</button>
                      <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="px-6 py-2 neu-btn !text-on-primary !bg-primary font-label-lg font-bold rounded-lg hover:opacity-90 disabled:opacity-60"
                      >
                        {creating ? 'Creating...' : 'Create Application'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
}