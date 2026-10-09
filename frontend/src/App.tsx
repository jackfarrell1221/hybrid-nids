import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';
import { PageId, Statistics, HealthStatus } from './types';

// Pages
import OverviewPage from './pages/OverviewPage';
import AlertsPage from './pages/AlertsPage';
import TrafficPage from './pages/TrafficPage';
import DatasetPage from './pages/DatasetPage';
import RulesPage from './pages/RulesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EvaluationPage from './pages/EvaluationPage';
import ModelPage from './pages/ModelPage';
import SystemHealthPage from './pages/SystemHealthPage';
import SettingsPage from './pages/SettingsPage';

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case 'overview': return <OverviewPage />;
    case 'alerts': return <AlertsPage />;
    case 'traffic': return <TrafficPage />;
    case 'dataset': return <DatasetPage />;
    case 'rules': return <RulesPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'evaluation': return <EvaluationPage />;
    case 'model': return <ModelPage />;
    case 'health': return <SystemHealthPage />;
    case 'settings': return <SettingsPage />;
    default: return <OverviewPage />;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [h, s] = await Promise.all([
        api.health().catch(() => null),
        api.statistics().catch(() => null),
      ]);
      if (h) setHealth(h);
      if (s) setStats(s);
      setLastSyncTime(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  // Apply dark class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const alertCount = stats?.intrusion_flows ?? 0;

  return (
    <div className="min-h-screen bg-soc-bg text-soc-text flex flex-col">
      {/* Top header */}
      <Header
        health={health}
        lastSyncTime={lastSyncTime}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop + mobile drawer) */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(page) => { setCurrentPage(page); }}
          isOpenMobile={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          alertCount={alertCount}
        />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          <PageContent page={currentPage} />
        </main>
      </div>

      {/* Toast notifications overlay */}
      <ToastContainer />
    </div>
  );
}
