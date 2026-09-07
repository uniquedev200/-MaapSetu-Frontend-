import { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../api';
import EmptyState from '../components/EmptyState';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center">Loading audit logs...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">System Audit Logs</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Review detailed activity records and historical events.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const csvContent = "data:text/csv;charset=utf-8,ID,Action,User,Date\n" + logs.map(l => `${l.id},${l.action},${l.user},${l.timestamp}`).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "audit_logs.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
          }} className="neu-btn px-4 py-2 flex items-center gap-2 text-on-surface-variant font-label-sm">
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
        </div>
      </div>

      <div className="neu-flat overflow-hidden flex-1 flex flex-col rounded-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-dim/50">
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Timestamp</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">User</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Action</th>
                <th className="py-4 px-6 font-label-lg text-label-lg text-on-surface-variant font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim/30">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface font-medium">{log.user}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState 
                      icon="history_toggle_off" 
                      title="No Audit Logs" 
                      description="System activity history is currently empty."
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
