import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardMetrics, fetchApplications } from '../api';
import { useAuth } from '../components/AuthContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n/LanguageContext';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLang();
  const isBusiness = user?.role === 'BUSINESS';

  useEffect(() => {
    Promise.all([fetchDashboardMetrics(), fetchApplications()]).then(([m, apps]) => {
      setMetrics(m);
      setApplications(apps);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center">{t('dash.loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">{t('dash.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('dash.subtitle')}</p>
        </div>
        {isBusiness && (
          <Link to="/applications" className="neu-btn !bg-primary !text-on-primary px-6 py-2.5 rounded-lg font-label-lg text-label-lg flex items-center gap-2 hover:opacity-90">
            <span className="material-symbols-outlined">add_circle</span>
            {t('dash.newApplication')}
          </Link>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="neu-flat p-padding-card flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl neu-recessed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">architecture</span>
            </div>
            <span className="text-secondary font-label-sm text-label-sm flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> 12%
            </span>
          </div>
          <p className="font-label-lg text-label-lg text-on-surface-variant mb-1">{t('dash.registeredInstruments')}</p>
          <h3 className="font-headline-md text-headline-md text-on-surface">{metrics?.registered_instruments}</h3>
        </div>
        
        {/* Metric 2 */}
        <div className="neu-flat p-padding-card flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl neu-recessed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">sync</span> {t('dash.active')}
            </span>
          </div>
          <p className="font-label-lg text-label-lg text-on-surface-variant mb-1">{t('dash.activeApplications')}</p>
          <h3 className="font-headline-md text-headline-md text-on-surface">{metrics?.active_applications}</h3>
        </div>
        
        {/* Metric 3 */}
        <div className="neu-flat p-padding-card flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl neu-recessed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <p className="font-label-lg text-label-lg text-on-surface-variant mb-1">{t('dash.validCertificates')}</p>
          <h3 className="font-headline-md text-headline-md text-on-surface">{metrics?.valid_certificates}</h3>
        </div>
        
        {/* Metric 4 (Warning) */}
        <div className="neu-flat p-padding-card flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-fixed-dim/20 rounded-bl-full -mr-4 -mt-4"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl neu-recessed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <p className="font-label-lg text-label-lg text-on-surface-variant mb-1 relative z-10">{t('dash.expiringSoon')}</p>
          <h3 className="font-headline-md text-headline-md text-tertiary relative z-10">{metrics?.expiring_soon}</h3>
        </div>
      </div>

      {/* Recent Applications Table Section */}
      <div className="neu-flat p-padding-card mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('dash.recentApplications')}</h3>
          <Link to="/applications" className="text-primary font-label-lg text-label-lg hover:underline decoration-primary underline-offset-4">{t('dash.viewAll')}</Link>
        </div>
        
        {applications.length > 0 ? (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-on-surface-variant font-label-sm text-label-sm border-b border-surface-container-high">
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">{t('dash.appId')}</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">{t('dash.type')}</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">{t('dash.status')}</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-right">{t('dash.action')}</th>
                </tr>
              </thead>
              <tbody className="text-body-md text-on-surface">
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-surface-container-highest/50 hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4 font-code text-primary">{app.id}</td>
                    <td className="py-4 px-4">{app.type}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link to={`/applications/${app.id}`} className="neu-btn p-2 text-on-surface-variant rounded-md inline-flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">
                          {app.status === 'DRAFT' ? 'edit' : 'visibility'}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState 
            icon="description" 
            title={t('dash.noRecentTitle')} 
            description={t('dash.noRecentDesc')}
            actionLabel={t('dash.newApplication')}
            actionTo="/applications"
          />
        )}
      </div>
    </div>
  );
}
