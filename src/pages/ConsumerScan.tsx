import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import jsQR from 'jsqr';

function extractCertId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const parts = trimmed.split('/');
  const last = parts[parts.length - 1].split('?')[0].trim();
  if (/^CERT-/i.test(last)) return last;
  if (/^[A-Za-z0-9-]{4,}$/.test(last)) return last;
  return trimmed;
}

export default function ConsumerScan() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [busy, setBusy] = useState(false);
  const [pastedCode, setPastedCode] = useState('');

  const stopCamera = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => {
    return () => { handledRef.current = true; stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code?.data && !handledRef.current) {
            handledRef.current = true;
            const certId = extractCertId(code.data);
            stopCamera();
            navigate(certId ? `/verify/${certId}` : '/verify/not-found');
            return;
          }
        } catch {
          /* frame too large or canvas issue — retry next frame */
        }
      }
    }
    if (cameraOn && !handledRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  const startCamera = async () => {
    setCameraError('');
    handledRef.current = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not available in this browser/context. Use “upload a QR image” or type the certificate ID instead (camera needs HTTPS/localhost).');
      return;
    }
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      const name = err?.name || '';
      setCameraError(
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Allow access, or use upload / manual entry.'
          : name === 'NotFoundError' || name === 'DevicesNotFoundError'
            ? 'No camera found on this device. Use upload or manual entry.'
            : 'Could not start the camera (this may need HTTPS/localhost). Use “upload a QR image” or type the certificate ID instead.'
      );
    } finally {
      setScanning(false);
    }
  };

  const decodeImageFile = (file: File) => {
    setBusy(true);
    setCameraError('');
    handledRef.current = false;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { setBusy(false); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      setBusy(false);
      if (code?.data) {
        const certId = extractCertId(code.data);
        navigate(certId ? `/verify/${certId}` : '/verify/not-found');
      } else {
        setCameraError('No QR code found in that image. Try a clearer photo or type the certificate ID manually.');
      }
    };
    img.onerror = () => { setBusy(false); setCameraError('Could not read that image file.'); };
    img.src = URL.createObjectURL(file);
  };

  const handleVerify = () => {
    const certId = extractCertId(manualId || pastedCode);
    if (!certId) { setCameraError('Enter a certificate ID (e.g. CERT-2026-XXXX) or paste a scanned link.'); return; }
    setCameraError('');
    navigate(`/verify/${certId}`);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.trim()) {
      setPastedCode(text.trim());
      const certId = extractCertId(text.trim());
      setTimeout(() => { if (certId) navigate(`/verify/${certId}`); }, 10);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center px-4 py-8 pb-24 font-body-md">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-full neu-recessed bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-[16px] font-bold text-primary leading-tight">Scan a Certificate QR</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Point your camera at the QR on any certificate, or upload its photo</p>
          </div>
        </div>

        {/* Camera viewfinder */}
        <div className="neu-flat rounded-2xl p-6 mb-5">
          <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-square max-h-80 mx-auto">
            <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${cameraOn ? 'block' : 'hidden'}`} />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90">
                <span className="material-symbols-outlined text-5xl text-white/70" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                <p className="font-label-sm text-label-sm opacity-80">Camera preview appears here</p>
              </div>
            )}
            {cameraOn && (
              <div className="pointer-events-none absolute inset-6 border-2 border-white/80 rounded-xl" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3 mt-4">
            {!cameraOn ? (
              <button onClick={startCamera} disabled={scanning} className="flex-1 py-3 rounded-xl font-label-lg text-label-lg text-primary font-bold neu-flat transition-all active:scale-95 hover:bg-primary-fixed/20 flex items-center justify-center gap-2 disabled:opacity-70">
                <span className="material-symbols-outlined">{scanning ? 'sync' : 'photo_camera'}</span>
                {scanning ? 'Starting camera...' : 'Start Camera Scan'}
              </button>
            ) : (
              <button onClick={stopCamera} className="flex-1 py-3 rounded-xl font-label-lg text-label-lg text-error font-bold neu-flat transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">stop_circle</span>
                Stop Camera
              </button>
            )}
            <label className="flex-1 py-3 rounded-xl font-label-lg text-label-lg text-secondary font-bold neu-flat transition-all active:scale-95 hover:bg-primary-fixed/20 flex items-center justify-center gap-2 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && decodeImageFile(e.target.files[0])} disabled={busy} />
              <span className="material-symbols-outlined">{busy ? 'sync' : 'image'}</span>
              Upload QR Image
            </label>
          </div>

          {cameraError && (
            <div className="mt-4 p-4 rounded-xl bg-error-container/40 flex gap-3 items-start">
              <span className="material-symbols-outlined text-error">info</span>
              <p className="font-body-md text-body-md text-on-surface">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual / pasted code */}
        <div className="neu-flat rounded-2xl p-6 mb-5">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">or enter the certificate ID</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="neu-input-container rounded-lg flex items-center px-4 h-12 flex-1">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">pin</span>
              <input
                className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none"
                placeholder="e.g. CERT-2026-7JZP (or paste a verify link)"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <button onClick={handleVerify} className="py-3 px-6 rounded-xl font-label-lg text-label-lg text-primary font-bold neu-flat transition-all active:scale-95 hover:bg-primary-fixed/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span> Verify
            </button>
          </div>
          {pastedCode && (
            <p className="font-label-sm text-label-sm text-primary mt-2">Detected paste: {pastedCode.split('/').pop()} — verifying…</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Prefer a shortcut?</p>
          <Link to="/login" className="font-label-sm text-label-sm text-primary font-bold hover:underline">Sign in as officer / business →</Link>
        </div>

        <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-8">
          Verification results are checked against the tamper-evident certificate ledger (Legal Metrology Act, 2009).
        </p>
      </div>
    </div>
  );
}