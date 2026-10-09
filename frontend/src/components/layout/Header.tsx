// components/layout/Header.tsx — Top application navigation bar.

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSimulation } from '../../context/SimulationContext';
import { StatusIndicator } from '../common/StatusIndicator';
import { Sun, Moon, Radio, Cpu, RefreshCw, Menu } from 'lucide-react';
import type { HealthStatus } from '../../types';

interface Props {
  health: HealthStatus | null;
  lastSyncTime: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleMobileNav: () => void;
}

export const Header: React.FC<Props> = ({
  health,
  lastSyncTime,
  isRefreshing,
  onRefresh,
  onToggleMobileNav,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { simulationActive } = useSimulation();

  const isOnline = health?.status === 'online';

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Connecting…';
    const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    return `${seconds}s ago`;
  };

  return (
    <header className="h-14 border-b border-soc-border bg-soc-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-1.5 rounded text-soc-text-secondary hover:text-soc-text hover:bg-soc-card-hover"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-soc-primary text-white flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-sm">
            NX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-soc-text">
                NEXUS NIDS
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-soc-border-subtle text-soc-text-muted border border-soc-border">
                v1.2-poc
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-soc-text-secondary leading-none">
              Hybrid Network Intrusion Detection
            </p>
          </div>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-soc-text-secondary font-mono">
        <div className="flex items-center gap-2">
          <StatusIndicator
            status={isOnline ? 'operational' : 'critical'}
            pulse={isOnline}
          />
          <span className={isOnline ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-red-600'}>
            {isOnline ? 'SYSTEM OPERATIONAL' : 'SYSTEM OFFLINE'}
          </span>
        </div>

        <span className="text-soc-border">|</span>

        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-soc-text-muted" />
          <span>Model:</span>
          <span className="font-medium text-soc-text">
            {health?.model_loaded ? 'Random Forest (Active)' : 'Not Trained'}
          </span>
        </div>

        {simulationActive && (
          <>
            <span className="text-soc-border">|</span>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>SIMULATION ACTIVE</span>
            </div>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-soc-text-muted mr-1">
          <span>Sync:</span>
          <span className="text-soc-text-secondary">{formatLastSync()}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded border border-soc-border hover:bg-soc-card-hover text-soc-text-secondary hover:text-soc-text transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded border border-soc-border hover:bg-soc-card-hover text-soc-text-secondary hover:text-soc-text transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
