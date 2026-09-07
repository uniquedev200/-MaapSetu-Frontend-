import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchInspections } from '../api';
import { useAuth } from '../components/AuthContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n/LanguageContext';

export default function InspectionsList() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLang();
  const isOfficer = user?.role === 'LMO' || user?.role === 'GATC';

  useEffect(() => {
    fetchInspections().then(data => {
      setInspections(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center">{t('ins.loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('ins.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('ins.subtitle')}</p>
        </div>
      </div>

      <div className="neu-flat overflow-hidden flex-1 flex flex-col rounded-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-dim/50">
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('ins.id')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('ins.date')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('ins.location')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('ins.inspector')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">{t('ins.status')}</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold text-right">{t('ins.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim/30">
              {inspections.length > 0 ? (
                inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="py-4 px-6 font-code text-code text-on-surface font-medium">{insp.request_id || insp.id}</td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">{insp.date}</td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">{insp.location}</td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">{insp.inspector}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={insp.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/inspections/${insp.request_id || insp.id}`} className="neu-btn px-4 py-2 text-primary font-label-sm font-bold rounded-lg hover:bg-primary/5 transition-colors">
                        {isOfficer && (insp.status === 'PENDING' || insp.status === 'IN_PROGRESS') ? t('ins.start') : t('ins.view')}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState 
                      icon="event_busy" 
                      title={t('ins.emptyTitle')} 
                      description={t('ins.emptyDesc')}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
