import { useEffect, useState, useCallback } from 'react';
import { AlertTable } from '../components/alerts/AlertTable';
import { AlertDrawer } from '../components/alerts/AlertDrawer';
import { api } from '../services/api';
import { Alert } from '../types';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../context/ToastContext';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await api.alerts(100);
      setAlerts(data.alerts ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const handleTriageUpdate = async (alertId: number, status: string) => {
    try {
      await api.updateAlertTriage(alertId, status);
      addToast('success', 'Triage Updated', `Alert #${alertId} marked as ${status}`);
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => prev ? { ...prev, triage_status: status as any } : null);
      }
      await load();
    } catch (e: any) {
      addToast('error', 'Update Failed', e.message ?? 'Failed to update alert triage status.');
    }
  };

  if (loading) return <LoadingState message="Loading security alerts..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Alerts Log & Triage</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">
          All detected intrusions, filterable by severity and attack type with live triage status
        </p>
      </div>

      <AlertTable alerts={alerts} onSelectAlert={setSelectedAlert} />

      <AlertDrawer
        alert={selectedAlert}
        isOpen={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        onTriageUpdate={handleTriageUpdate}
      />
    </div>
  );
}
