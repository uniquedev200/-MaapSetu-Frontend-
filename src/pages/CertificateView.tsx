import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCertificateDetails, downloadCertificatePdf, verifyCertificate, API_ORIGIN } from '../api';
import { useToast } from '../components/ToastContext';

export default function CertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [certData, setCertData] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [authenticity, setAuthenticity] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCertificateDetails(id).then((data) => {
        setCertData(data);
        if (data.qr_code_url) setQrUrl(API_ORIGIN + data.qr_code_url);
        setLoading(false);
      });
      verifyCertificate(id).then(setAuthenticity).catch(() => {});
    }
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadCertificatePdf(id || '');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to download certificate.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">Loading certificate...</div>;
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center pb-24">
      {/* Breadcrumbs & Header */}
      <div className="w-full max-w-4xl mb-8 flex justify-between items-end mt-4 print:hidden">
        <div>
          <nav className="flex text-sm text-on-surface-variant mb-2">
            <ol className="flex items-center space-x-2">
              <li><button onClick={() => navigate(-1)} className="hover:text-primary transition-colors">Back</button></li>
              <li><span className="material-symbols-outlined text-sm">chevron_right</span></li>
              <li className="text-primary font-medium">View Certificate</li>
            </ol>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Digital Verification Certificate</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="neu-btn px-6 py-3 rounded-full flex items-center gap-2 text-primary font-label-lg text-label-lg hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined">print</span> Print
          </button>
          <button onClick={handleDownload} disabled={downloading} className="neu-btn px-6 py-3 rounded-full flex items-center gap-2 bg-primary/5 text-primary font-label-lg text-label-lg hover:bg-primary/10 transition-colors disabled:opacity-60">
            <span className="material-symbols-outlined">{downloading ? 'sync' : 'download'}</span> {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Certificate Card */}
      <div className="neu-flat w-full max-w-4xl rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col items-center bg-white border border-surface-dim/20 mb-8 print:shadow-none print:border-0 print:max-w-full print:w-full print:m-0 print:p-6">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary print:hidden"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full border-[12px] border-primary/5 print:hidden"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full border-[16px] border-primary/5 print:hidden"></div>

        {/* Certificate Header */}
        <div className="text-center mb-12 relative z-10 w-full border-b border-surface-dim/50 pb-8">
          <div className="w-20 h-20 mx-auto neu-extruded rounded-full flex items-center justify-center mb-6 bg-surface-container-low text-primary">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest mb-2">Certificate of Verification</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Metrology Authority of Standards & Measures</p>
        </div>

        {/* Main Details */}
        <div className="w-full flex flex-col md:flex-row gap-12 mb-12 relative z-10">
          <div className="flex-1 space-y-8">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Instrument Detail</p>
              <p className="font-headline-md text-headline-md text-on-surface border-b-2 border-surface-dim pb-2 inline-block">{certData?.instrument_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Serial Number</p>
                <p className="font-body-lg text-body-lg text-on-surface font-code bg-surface-container-low px-3 py-1 rounded neu-recessed inline-block">{certData?.serial_number}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Owner / Business</p>
                <p className="font-body-lg text-body-lg text-on-surface font-medium">{certData?.business_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Issued Date</p>
                <p className="font-body-lg text-body-lg text-on-surface">{certData?.issued_date}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Valid Until</p>
                <p className="font-body-lg text-body-lg text-primary font-bold">{certData?.valid_until}</p>
              </div>
            </div>
            {authenticity && (
              <div className="neu-recessed p-4 rounded-xl">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={authenticity.isAuthentic ? {} : undefined}>verified</span>
                  Blockchain Authenticity
                </p>
                <p className={`font-body-md text-body-md font-medium ${authenticity.isAuthentic ? 'text-primary' : 'text-error'}`}>
                  {authenticity.message}
                </p>
                <p className="font-code text-code text-on-surface-variant mt-1">Block #{authenticity.blockNumber} · hash {authenticity.blockHash ? authenticity.blockHash.slice(0, 16) + '…' : 'n/a'}</p>
              </div>
            )}
          </div>

          {/* QR Code & Stamp Area */}
          <div className="w-full md:w-64 flex flex-col items-center justify-center space-y-8">
            <div className="neu-recessed p-4 rounded-xl bg-white">
              <div className="w-40 h-40 bg-white rounded flex items-center justify-center overflow-hidden">
                {qrUrl ? (
                  <img src={qrUrl} alt="Verification QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-code">QR CODE</div>
                )}
              </div>
              <p className="text-center mt-2 font-code text-label-sm text-on-surface-variant">ID: {certData?.id}</p>
            </div>
          </div>
        </div>

        {/* Footer / Signature */}
        <div className="w-full flex justify-between items-end mt-8 relative z-10 pt-8 border-t border-surface-dim/50">
          <div className="w-1/3">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Authorized Signature</p>
            <div className="border-b-2 border-on-surface-variant/50 w-full h-12 flex items-end justify-center pb-2">
              <span className="font-headline-sm text-headline-sm italic text-primary/80" style={{ fontFamily: "'Times New Roman', serif" }}>{certData?.inspector_name}</span>
            </div>
            <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-2">Chief Inspector, Metrology</p>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <span className="font-label-sm text-label-sm">Official Metrology Document</span>
          </div>
        </div>
      </div>
    </div>
  );
}