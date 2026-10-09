// components/layout/Sidebar.tsx — Compact SOC sidebar navigation.

import React from 'react';
import type { PageId } from '../../types';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Database,
  Cpu,
  Server,
  Settings,
  X,
} from 'lucide-react';

interface Props {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  alertCount?: number;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<Props> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
  alertCount,
}) => {
  const sections: NavSection[] = [
    {
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        {
          id: 'traffic',
          label: 'Live Traffic',
          icon: <Activity className="w-4 h-4" />,
        },
        {
          id: 'alerts',
          label: 'Alerts',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: alertCount && alertCount > 0 ? alertCount : undefined,
        },
        {
          id: 'rules',
          label: 'Detection Rules',
          icon: <BookOpen className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        {
          id: 'dataset',
          label: 'Dataset Studio',
          icon: <Database className="w-4 h-4" />,
        },
        {
          id: 'analytics',
          label: 'Detection Analytics',
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: 'evaluation',
          label: 'Evaluation',
          icon: <CheckCircle2 className="w-4 h-4" />,
        },
      ],
    },

    {
      title: 'SYSTEM',
      items: [
        {
          id: 'model',
          label: 'Model',
          icon: <Cpu className="w-4 h-4" />,
        },
        {
          id: 'health',
          label: 'API & Health',
          icon: <Server className="w-4 h-4" />,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  const handleNavClick = (id: PageId) => {
    onSelectPage(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full select-none">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-soc-border">
        <span className="font-semibold text-xs tracking-wider uppercase text-soc-text-secondary">
          Navigation
        </span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded text-soc-text-secondary hover:text-soc-text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-soc-text-muted font-mono uppercase">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    active
                      ? 'bg-soc-primary/10 text-soc-primary font-medium border border-soc-primary/30'
                      : 'text-soc-text-secondary hover:text-soc-text hover:bg-soc-card-hover border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-soc-primary' : 'text-soc-text-muted'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                        active
                          ? 'bg-soc-primary text-white'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer info box */}
      <div className="p-3 border-t border-soc-border bg-soc-bg/30 text-[11px] font-mono text-soc-text-muted space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="text-soc-text-secondary">Hybrid 2-Tier</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Rules:</span>
          <span className="text-soc-text-secondary">4 Active</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-52 shrink-0 border-r border-soc-border bg-soc-card h-[calc(100vh-3.5rem)] sticky top-14">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 transition-opacity"
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-soc-card border-r border-soc-border shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
