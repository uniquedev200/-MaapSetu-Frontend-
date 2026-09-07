import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCertificates, downloadCertificatePdf, tamperCertificate, restoreCertificate } from '../api';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n/LanguageContext';

export default function CertificatesList() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLang();
  const isAdmin = user?.role === 'ADMIN';

  const load = () => {
    fetchCertificates().then(data => {
      setCertificates(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (cert: any) => {
    setDownloadingId(cert.id);
    try {
      const blob = await downloadCertificatePdf(cert.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_${cert.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('cert.failDownload'), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleTamper = async (cert: any) => {
    setBusyId(cert.id);
    try {
      await tamperCertificate(cert.id);
      showToast(t('cert.tamperToast', { cert: cert.certificate_number || cert.id }), 'info');
      load();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('cert.failTamper'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (cert: any) => {
    setBusyId(cert.id);
    try {
      await restoreCertificate(cert.id);
      showToast(t('cert.restoreToast', { cert: cert.certificate_number || cert.id }), 'success');
      load();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('cert.failRestore'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">{t('cert.loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('cert.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('cert.subtitle')}</p>
        </div>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="neu-flat rounded-2xl p-6 flex flex-col gap-4 group hover:shadow-[8px_8px_16px_#dce1eb,-8px_-8px_16px_#ffffff] transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full neu-extruded bg-surface-container flex items-center justify-center text-primary">
                   <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <StatusBadge status={cert.status} />
              </div>
              
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                  {cert.instrument}
                  {cert.is_tampered && (
                    <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold tracking-wide">{t('cert.tamperedDemo')}</span>
                  )}
                </h3>
                <p className="font-code text-code text-on-surface-variant mt-1">{cert.certificate_number || cert.id}</p>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('cert.issued')}</span>
                  <span className="font-body-md text-body-md text-on-surface font-medium">{cert.issue_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('cert.validUntil')}</span>
                  <span className="font-body-md text-body-md text-primary font-bold">{cert.expiry}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-surface-dim/50 flex justify-between">
                <button onClick={() => handleDownload(cert)} disabled={downloadingId === cert.id} className="neu-btn px-4 py-2 text-on-surface-variant font-label-sm flex items-center gap-2 rounded-lg hover:text-primary transition-colors disabled:opacity-60">
                  <span className="material-symbols-outlined text-[18px]">{downloadingId === cert.id ? 'sync' : 'download'}</span> {downloadingId === cert.id ? '…' : t('cert.pdf')}
                </button>
                <Link to={`/certificates/${cert.id}`} className="neu-btn px-4 py-2 text-primary font-label-sm font-bold bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  {t('cert.view')}
                </Link>
              </div>
              {isAdmin && (
                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span> {t('cert.qrVerifyDemo')}
                  </span>
                  {cert.is_tampered ? (
                    <button onClick={() => handleRestore(cert)} disabled={busyId === cert.id} className="neu-btn px-3 py-1.5 text-on-primary font-label-sm font-bold rounded-lg bg-green-600/90 hover:bg-green-600 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                      <span className="material-symbols-outlined text-[16px]">{busyId === cert.id ? 'sync' : 'restore'}</span> {t('cert.restore')}
                    </button>
                  ) : (
                    <button onClick={() => handleTamper(cert)} disabled={busyId === cert.id} className="neu-btn px-3 py-1.5 text-on-primary font-label-sm font-bold rounded-lg bg-error/90 hover:bg-error transition-colors flex items-center gap-1.5 disabled:opacity-60">
                      <span className="material-symbols-outlined text-[16px]">{busyId === cert.id ? 'sync' : 'policy'}</span> {t('cert.simulateTamper')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon="workspace_premium" 
          title={t('cert.emptyTitle')} 
          description={t('cert.emptyDesc')}
        />
      )}
    </div>
  );
}
