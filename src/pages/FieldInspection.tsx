import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitInspectionFindings, scheduleVerification, fetchApplicationDetails, uploadFile, API_ORIGIN, mapsLink } from '../api';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';

const NOT_SCHEDULED = ['SUBMITTED', 'APPROVED', 'ASSIGNED_LMO'];
const TERMINAL = ['COMPLETED', 'CERTIFICATE_ISSUED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'];

export default function FieldInspection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [appliedLoad, setAppliedLoad] = useState('');
  const [loadReading, setLoadReading] = useState('');
  const [eccentricity, setEccentricity] = useState('');
  const [isWithinTolerance, setIsWithinTolerance] = useState(true);
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledLocation, setScheduledLocation] = useState('');
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchApplicationDetails(id).then(setAppData).catch(console.error);
    }
  }, [id]);

  const status = appData?.status;
  const isBusiness = user?.role === 'BUSINESS';
  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'LMO' || user?.role === 'GATC';
  const assignedToMe = appData?.assigned_to_me === true;
  const canPerform = isAdmin || (isOfficer && assignedToMe);
  const needsSchedule = NOT_SCHEDULED.includes(status);
  const isComplete = TERMINAL.includes(status);
  const inspectionOpen = !needsSchedule && !!appData && !isComplete;
  const statusLabel = needsSchedule ? 'Awaiting Schedule' : isComplete ? (status ?? 'Completed') : 'Scheduled';

  const instrument = appData?.instruments?.[0];

  // Scientific preview: deviation (g) + guide MPE from instrument class/interval e.
  const unitScale = (instrument?.unit_of_measurement || 'kg') === 'g' ? 1 : 1000;
  const appliedG = parseFloat(appliedLoad) * unitScale;
  const readingG = parseFloat(loadReading) * unitScale;
  const deviationG =
    Number.isFinite(appliedG) && Number.isFinite(readingG) ? Math.abs(readingG - appliedG) : NaN;
  const intervalE = instrument?.verification_interval_e
    ? parseFloat(instrument.verification_interval_e)
    : 0;
  const guideMpeDisplay = intervalE > 0 ? intervalE * 0.5 : 0;

  const handleSchedule = async () => {
    if (!scheduledDate) {
      showToast('Please pick a scheduled date.', 'error');
      return;
    }
    setScheduling(true);
    try {
      await scheduleVerification(id || '', {
        scheduled_date: scheduledDate,
        scheduled_location: scheduledLocation || undefined
      });
      showToast('Inspection scheduled.', 'success');
      fetchApplicationDetails(id || '').then(setAppData).catch(console.error);
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Failed to schedule inspection.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const res = await uploadFile(file);
        setUploadedFiles(prev => [...prev, { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, url: res.url || res.path }]);
      }
      showToast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded.`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitInspectionFindings(id || '', {
        appliedLoad: appliedLoad || undefined,
        loadTest: loadReading || undefined,
        eccentricity: eccentricity || undefined,
        isWithinTolerance,
        notes,
        photos: uploadedFiles.map(f => f.url).filter(Boolean)
      });
      navigate(`/applications/${id}`);
    } catch (e: any) {
      console.error(e);
      showToast(e?.response?.data?.detail || 'Failed to submit findings.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pt-4 pb-24">
      {/* Top App Bar inside main area */}
      <div className="flex items-center gap-4 mb-6 sticky top-16 bg-background/90 backdrop-blur-md z-10 py-2">
        <button 
          className="neu-btn w-10 h-10 flex items-center justify-center text-on-surface-variant rounded-full"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm font-extrabold text-primary">Inspection</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{id || 'LMO-2023-892A'}</span>
        </div>
      </div>

      <section className="neu-flat rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary font-bold mb-1">
              {instrument?.name || 'Weighing Scale X-400'}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">business</span>
              {appData?.business_name || 'Apex Retail Markets'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold neu-flat ${isComplete ? 'bg-green-100 text-green-700' : 'bg-tertiary-container/10 text-tertiary-container'}`}>
            {statusLabel}
          </div>
        </div>
        {appData?.scheduled_location && (
          <a href={mapsLink(appData.scheduled_location, appData?.location)} target="_blank" rel="noreferrer" className="neu-extruded p-3 flex items-center justify-between rounded-xl font-label-sm text-label-sm text-primary hover:bg-primary-fixed/20 transition-colors">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">map</span> {appData.scheduled_location}</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        )}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Serial No.</span>
            <span className="font-label-lg text-label-lg font-code">{instrument?.serial || 'SN-8839-KL'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Class / Type</span>
            <span className="font-label-lg text-label-lg">{instrument?.class || 'Class III'} / {instrument?.type || 'Routine'}</span>
          </div>
        </div>
      </section>

      {/* Non-officer viewers see a note instead of actions */}
      {isOfficer && !assignedToMe && (
        <section className="neu-flat rounded-xl p-4">
          <p className="font-body-md text-body-md text-on-surface-variant flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person_off</span>
            This request is assigned to {appData?.assigned_officer || 'another officer'} — only the assigned officer
            can schedule or perform this inspection. You are viewing in read-only mode.
          </p>
        </section>
      )}

      {/* Non-officer viewers see a note instead of actions */}
      {!canPerform && !(isOfficer && !assignedToMe) && (
        <section className="neu-flat rounded-xl p-4">
          <p className="font-body-md text-body-md text-on-surface-variant flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">lock</span>
            {isBusiness
              ? 'Only the assigned legal metrology officer can schedule and perform this inspection. Track progress from your applications list.'
              : 'Only legal metrology officers (LMO/GATC) can schedule and perform inspections. Viewing read-only mode.'}
          </p>
        </section>
      )}

      {/* Schedule Step (before inspection) */}
      {needsSchedule && canPerform && (
        <section className="flex flex-col gap-4">
          <h3 className="font-headline-sm text-headline-sm font-semibold px-1">Schedule Inspection</h3>
          <div className="neu-flat rounded-xl p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface pl-1">Scheduled Date</label>
              <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
                <input
                  className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface pl-1">Location (optional)</label>
              <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
                <input
                  className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none"
                  placeholder="Premises / site address"
                  value={scheduledLocation}
                  onChange={(e) => setScheduledLocation(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleSchedule}
              disabled={scheduling}
              className="py-4 rounded-xl font-label-lg text-label-lg text-primary font-bold neu-flat transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-primary-fixed/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">event_available</span>
              {scheduling ? 'Scheduling...' : 'Schedule Inspection'}
            </button>
          </div>
        </section>
      )}

      {/* Completed state */}
      {isComplete && (
        <section className={`neu-flat rounded-xl p-6 flex flex-col items-center text-center gap-3 ${status === 'REJECTED' ? 'border-2 border-error/30' : ''}`}>
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${status === 'REJECTED' ? 'bg-error-container text-error' : 'bg-green-100 text-green-700'}`}>
            <span className="material-symbols-outlined text-[28px]">{status === 'REJECTED' ? 'gpp_bad' : 'verified'}</span>
          </div>
          <h3 className={`font-headline-sm text-headline-sm font-semibold ${status === 'REJECTED' ? 'text-error' : 'text-primary'}`}>
            {status === 'REJECTED' ? 'Inspection Rejected' : 'Inspection Complete'}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            {status === 'REJECTED'
              ? 'This verification failed: the instrument did not meet the required metrology tolerances. No certificate was issued.'
              : `This verification has been completed${status === 'CERTIFICATE_ISSUED' ? ' and the certificate has been issued' : ''}. Further actions are handled from the application.`}
          </p>
          <button
            onClick={() => navigate(`/applications/${id}`)}
            className="mt-2 px-6 py-3 rounded-xl font-label-lg text-label-lg text-primary font-bold neu-flat transition-all active:scale-95 hover:bg-primary-fixed/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">description</span>
            Open Application
          </button>
        </section>
      )}

      {/* Measurement Inputs - officer only, while inspection is open */}
      {inspectionOpen && canPerform && (
        <>
      <section className="flex flex-col gap-4">
        <h3 className="font-headline-sm text-headline-sm font-semibold px-1">Precision Readings</h3>
        <div className="neu-flat rounded-xl p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface pl-1">Applied Test Load</label>
            <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
              <input 
                className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none" 
                placeholder={instrument ? `e.g. ${instrument.capacity_max || 150} kg` : 'Nominal load applied'}
                type="number" 
                value={appliedLoad}
                onChange={(e) => setAppliedLoad(e.target.value)}
              />
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">{instrument?.unit_of_measurement || 'kg'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface pl-1">Observed Reading</label>
            <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
              <input 
                className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none" 
                placeholder="Displayed value on the scale" 
                type="number" 
                value={loadReading}
                onChange={(e) => setLoadReading(e.target.value)}
              />
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">{instrument?.unit_of_measurement || 'kg'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface pl-1">Eccentricity Deviation</label>
            <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
              <input 
                className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none" 
                placeholder="Max off-centre deviation" 
                type="number" 
                value={eccentricity}
                onChange={(e) => setEccentricity(e.target.value)}
              />
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">g</span>
            </div>
          </div>

          {/* Live scientific preview (display only; authoritative verdict is computed server-side) */}
          <div className="neu-recessed rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <span className="font-label-sm text-label-sm text-outline">Deviation observed</span>
              <p className={`font-label-lg text-label-lg font-bold ${Number.isFinite(deviationG) && guideMpeDisplay > 0 && deviationG > guideMpeDisplay ? 'text-error' : 'text-on-surface'}`}>
                {Number.isFinite(deviationG) ? `${deviationG.toFixed(1)} g` : '—'}
              </p>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-outline">MPE guide (±0.5e)</span>
              <p className="font-label-lg text-label-lg font-bold text-on-surface">
                {guideMpeDisplay > 0 ? `± ${guideMpeDisplay.toFixed(1)} g` : '—'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="font-label-sm text-label-sm text-outline text-[11px]">Standard</span>
              <p className="font-body-md text-body-md text-on-surface-variant text-[11px]">
                {instrument?.accuracy_class ? `Class ${instrument.accuracy_class.replace('Class ', '')}` : 'Class III'} · IS 14625 / OIML R 76-1{intervalE > 0 ? ` · verification interval e = ${intervalE} g` : ' · MPE derived server-side from instrument capacity'}
                {!instrument?.accuracy_class && ' (default Class III for demo instruments)'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface">Within Tolerance</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Auto-flagged if deviation exceeds MPE</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input 
                checked={isWithinTolerance} 
                onChange={() => setIsWithinTolerance(!isWithinTolerance)}
                className="sr-only peer" 
                type="checkbox" 
              />
              <div className="w-14 h-8 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-primary after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all neu-recessed peer-checked:bg-primary-container/20"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Media Upload */}
      <section className="flex flex-col gap-4">
        <h3 className="font-headline-sm text-headline-sm font-semibold px-1">Evidence & Files</h3>
        <div className="neu-flat rounded-xl p-5 flex flex-col gap-4">
          <label className="border-2 border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-surface-container bg-surface-container-low">
            <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
            <div className="h-12 w-12 rounded-full neu-flat flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined">{uploading ? 'sync' : 'cloud_upload'}</span>
            </div>
            <span className="font-label-lg text-label-lg text-on-surface text-center">{uploading ? 'Uploading...' : 'Tap to upload photos or PDF'}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant text-center">Real uploads → stored evidence, attached to this inspection</span>
          </label>
          <div className="flex flex-col gap-3">
            {uploadedFiles.map((file: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 neu-flat rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md neu-recessed bg-white flex items-center justify-center text-primary overflow-hidden">
                    {file.url && /image/.test(file.name) ? (
                      <img src={API_ORIGIN + file.url} alt={file.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">description</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate w-40">{file.name}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px]">{file.size} · uploaded</span>
                  </div>
                </div>
                <button onClick={() => setUploadedFiles((f: any[]) => f.filter((_: any, x: number) => x !== i))} className="text-error p-2 rounded-full hover:bg-error-container/50 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 mb-4">
        <div className="neu-flat rounded-xl p-5 flex flex-col gap-2">
          <label className="font-label-lg text-label-lg text-on-surface pl-1">Inspector Notes</label>
          <div className="neu-input-container rounded-lg p-1">
            <textarea 
              className="neu-input w-full text-on-surface font-body-md placeholder-outline resize-none p-3 h-24 border-none outline-none focus:ring-0" 
              placeholder="Add optional remarks..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </section>
        </>
      )}

      {/* Action Bar - officer only, while inspection is open */}
      {inspectionOpen && canPerform && (
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-background/80 backdrop-blur-md p-4 shadow-[0_-4px_10px_rgba(220,225,235,0.5)] z-10 border-t border-surface-dim">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-4 rounded-xl font-label-lg text-label-lg text-primary font-bold neu-flat transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-primary-fixed/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">check_circle</span>
            {loading ? 'Submitting...' : 'Submit Findings'}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}