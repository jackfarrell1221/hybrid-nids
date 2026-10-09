import { Moon, Sun, Clock, Server } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Settings</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">
          Interface preferences and system configuration
        </p>
      </div>

      {/* Theme */}
      <div className="bg-soc-card border border-soc-border rounded p-4 space-y-4">
        <h2 className="text-sm font-semibold text-soc-text">Appearance</h2>
        <div className="flex gap-3">
          {([
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'light', label: 'Light', icon: Sun },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded border text-sm transition-colors ${
                theme === id
                  ? 'border-soc-primary bg-soc-primary/10 text-soc-primary'
                  : 'border-soc-border text-soc-text-secondary hover:text-soc-text hover:bg-soc-card-hover'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-soc-text-muted">
          Theme preference is persisted in localStorage.
        </p>
      </div>

      {/* Refresh interval info */}
      <div className="bg-soc-card border border-soc-border rounded p-4 space-y-3">
        <h2 className="text-sm font-semibold text-soc-text">Data Refresh</h2>
        <div className="flex items-center gap-2 text-sm text-soc-text-secondary">
          <Clock size={14} />
          <span>Dashboard data refreshes every <span className="font-mono text-soc-text">30 seconds</span></span>
        </div>
        <p className="text-xs text-soc-text-muted">
          Overview and Analytics pages poll the backend on a 30-second interval.
          Use the manual refresh button in the header to force an immediate update.
        </p>
      </div>

      {/* API info */}
      <div className="bg-soc-card border border-soc-border rounded p-4 space-y-3">
        <h2 className="text-sm font-semibold text-soc-text">API Configuration</h2>
        <div className="flex items-center gap-2 text-sm text-soc-text-secondary">
          <Server size={14} />
          <span>Backend API</span>
          <span className="font-mono text-xs bg-soc-bg rounded border border-soc-border px-2 py-0.5 text-soc-text ml-auto">
            http://localhost:5000
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-soc-text-secondary">
          <Server size={14} />
          <span>Frontend Dev Server</span>
          <span className="font-mono text-xs bg-soc-bg rounded border border-soc-border px-2 py-0.5 text-soc-text ml-auto">
            http://localhost:5173
          </span>
        </div>
        <p className="text-xs text-soc-text-muted">
          Vite proxies all <code className="font-mono">/api/*</code> requests to the Flask backend.
          No CORS configuration required.
        </p>
      </div>

      {/* About */}
      <div className="bg-soc-card border border-soc-border rounded p-4 space-y-3">
        <h2 className="text-sm font-semibold text-soc-text">About NEXUS NIDS</h2>
        <div className="text-xs text-soc-text-secondary space-y-1">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-soc-text">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Detection Engine</span>
            <span className="font-mono text-soc-text">Rule + Random Forest</span>
          </div>
          <div className="flex justify-between">
            <span>ML Model</span>
            <span className="font-mono text-soc-text">scikit-learn RandomForest</span>
          </div>
          <div className="flex justify-between">
            <span>Backend</span>
            <span className="font-mono text-soc-text">Python / Flask</span>
          </div>
          <div className="flex justify-between">
            <span>Frontend</span>
            <span className="font-mono text-soc-text">React / TypeScript / Vite</span>
          </div>
          <div className="flex justify-between">
            <span>Storage</span>
            <span className="font-mono text-soc-text">SQLite (alerts) + joblib (model)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
