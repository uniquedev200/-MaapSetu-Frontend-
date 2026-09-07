import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { publicCertificateVerify, resolveFileUrl } from '../api';
import { useLang } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const EMPTY = {
  certificate: null as any,
  authenticity: null as any,
  notFound: false,
  networkError: '',
};

export default function PublicVerify() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [data, setData] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    if (!certId) return;
    setLoading(true);
    publicCertificateVerify(certId)
      .then((res) => setData({ certificate: res.data?.certificate, authenticity: res.data?.authenticity, notFound: false, networkError: '' }))
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 404) {
          setData({ ...EMPTY, notFound: true, networkError: '' });
        } else {
          setData({ ...EMPTY, notFound: false, networkError: err?.response?.data?.detail || err?.message || '' });
        }
      })
      .finally(() => setLoading(false));
  }, [certId]);

  const cert = data.certificate;
  const auth = data.authenticity || {};
  const authentic = auth.isAuthentic === true;
  const tampered = cert?.is_tampered === true;
  const blockNo = auth.blockNumber ?? '-';
  const qrUrl = resolveFileUrl(cert?.qr_code_url);

  const handleScan = () => {
    const value = scanInput.trim();
    if (!value) return;
    const id = value.split('/').pop()?.trim();
    if (id) navigate(`/verify/${id}`);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center px-4 py-8 pb-24 font-body-md">
      <div className="w-full max-w-2xl">
        {/* Brand */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-full neu-recessed bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          </div>
          <div className="flex-1">
            <h1 className="font-headline-sm text-[16px] font-bold text-primary leading-tight">{t('pv.brand')}</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{t('pv.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Hero status */}
        {loading ? (
          <div className="neu-flat rounded-2xl p-10 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <p className="font-label-lg text-label-lg text-on-surface-variant">{t('pv.checking')}</p>
          </div>
        ) : data.notFound ? (
          <div className="neu-flat rounded-2xl p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">question_mark</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-error mb-2">{t('pv.notFound')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('pv.notFoundMsg', { id: certId ?? '' })}
            </p>
          </div>
        ) : data.networkError ? (
          <div className="neu-flat rounded-2xl p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">link_off</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-error mb-2">{t('pv.networkError')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {data.networkError} {t('pv.networkErrorMsg', { host: '192.168.1.6:8010' })}
            </p>
          </div>
        ) : authentic ? (
          <div className="rounded-2xl p-8 text-center text-white mb-5" style={{ background: 'linear-gradient(135deg,#0f7b3d,#1c9e56)' }}>
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold tracking-widest mt-3">{t('pv.authentic')}</h2>
            <p className="font-body-md text-body-md mt-1 opacity-90">{t('pv.authenticMsg')}</p>
            <div className="flex justify-center gap-3 mt-5">
              <span className="px-4 py-1.5 rounded-full bg-white/20 font-label-sm text-label-sm font-bold cursor-default">{t('pv.verifiedBadge')}</span>
              <span className="px-4 py-1.5 rounded-full bg-white/20 font-label-sm text-label-sm font-bold cursor-default">{t('pv.chainIntact')}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center text-white mb-5" style={{ background: 'linear-gradient(135deg,#b32020,#d63c3c)' }}>
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_bad</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold tracking-widest mt-3">{tampered ? t('pv.tampered') : t('pv.authFailed')}</h2>
            <p className="font-body-md text-body-md mt-1 opacity-90">
              {tampered
                ? t('pv.tamperedMsg')
                : t('pv.authFailedMsg')}
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <span className="px-4 py-1.5 rounded-full bg-white/20 font-label-sm text-label-sm font-bold cursor-default">{t('pv.rejectedBadge')}</span>
              <span className="px-4 py-1.5 rounded-full bg-white/20 font-label-sm text-label-sm font-bold cursor-default">{t('pv.hashMismatch')}</span>
            </div>
          </div>
        )}

        {!loading && !data.notFound && cert && (
          <>
            {/* Certificate details */}
            <div className="neu-flat rounded-2xl p-6 mb-5">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{t('pv.certNo')}</p>
                  <p className="font-code text-code text-on-surface font-bold">{cert.certificate_number}</p>
                </div>
                {tampered ? (
                  <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">{t('pv.tamperedCopy')}</span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-label-sm text-label-sm font-bold">{t('pv.verifiedBadge2')}</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Detail label={t('pv.instrument')} value={cert.instrument_name} />
                <Detail label={t('pv.serialNumber')} value={cert.serial_number} code />
                <Detail label={t('pv.registeredBusiness')} value={cert.business_name} />
                <Detail label={t('pv.inspector')} value={cert.inspector_name} />
                <Detail label={t('pv.issuedOn')} value={cert.issued_date} />
                <Detail label={t('pv.validUntil')} value={cert.valid_until} colored />
              </div>

              {tampered ? (
                <div className="flex gap-3 items-start mt-6 p-4 rounded-xl bg-error-container/40">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <p className="font-body-md text-body-md text-on-surface">
                    <b>{t('pv.simForgeryTitle')}</b> {t('pv.simForgeryMsg')}
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 items-start mt-6 p-4 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  <p className="font-body-md text-body-md text-on-surface">
                    {t('pv.authNoteMsg')}
                  </p>
                </div>
              )}
            </div>

            {/* Blockchain anchoring */}
            <div className="neu-flat rounded-2xl p-6 mb-5">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">{t('pv.blockchainAnchoring')}</p>
              <div className="neu-recessed rounded-xl p-4 font-code text-code text-on-surface-variant overflow-x-auto">
                <p><span className="text-on-surface">{t('pv.blockIndex')}</span> {blockNo}</p>
                <p><span className="text-on-surface">{t('pv.storedHash')}</span> <span className={authentic ? 'text-green-700' : 'text-error'}>{auth.certificateHash || cert.certificate_hash || '-'}</span></p>
                <p><span className="text-on-surface">{t('pv.anchoredHash')}</span> <span className={authentic ? 'text-green-700' : 'text-error'}>{auth.blockchainHash || '-'}</span></p>
                <p><span className="text-on-surface">{t('pv.blockHash')}</span> {auth.blockHash || '-'}</p>
              </div>
            </div>

            {/* QR re-scan (when a stored QR exists) */}
            {qrUrl && (
              <div className="neu-flat rounded-2xl p-6 mb-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="neu-recessed p-4 rounded-xl bg-white">
                  <img src={qrUrl} alt={t('pv.scanAnywhere')} className="w-32 h-32 object-contain" />
                </div>
                <div>
                  <p className="font-headline-sm text-headline-sm font-semibold text-primary">{t('pv.scanAnywhere')}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    {t('pv.scanAnywhereMsg')}
                  </p>
                </div>
              </div>
            )}

            {/* Scan another */}
            <div className="neu-flat rounded-2xl p-6">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">{t('pv.verifyAnother')}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="neu-input-container rounded-lg flex items-center px-4 h-12 flex-1">
                  <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">qr_code_scanner</span>
                  <input
                    className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none"
                    placeholder={t('pv.inputPlaceholder')}
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  />
                </div>
                <button
                  onClick={handleScan}
                  className="py-3 px-6 rounded-xl font-label-lg text-label-lg text-primary font-bold neu-flat transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-primary-fixed/20"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span> {t('pv.verify')}
                </button>
              </div>
              <Link
                to="/scan"
                className="mt-3 w-full py-3 rounded-xl font-label-lg text-label-lg text-secondary font-bold neu-flat transition-all active:scale-95 hover:bg-primary-fixed/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                {t('pv.scanCamera')}
              </Link>
            </div>
          </>
        )}

        <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-8">
          {t('pv.footer')} · {t('pv.devFooter')}
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value, code, colored }: { label: string, value?: string | null, code?: boolean, colored?: boolean }) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`font-body-md text-body-md font-medium break-words ${code ? 'font-code' : ''} ${colored ? 'text-primary font-bold' : 'text-on-surface'}`}>{value || '—'}</p>
    </div>
  );
}