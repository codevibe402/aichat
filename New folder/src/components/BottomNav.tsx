import React from 'react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: NavTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Inbox', icon: 'inbox' },
    { id: 'important', label: 'Important', icon: 'priority_high' },
    { id: 'memory', label: 'Memory', icon: 'memory' },
    { id: 'actions', label: 'Actions', icon: 'task_alt' },
    { id: 'aichat', label: 'AI', icon: 'auto_awesome' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-[#f8f9fa]/85 backdrop-blur-md border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-20 pb-safe px-2 flex justify-around items-center rounded-t-xl max-w-2xl left-1/2 -translate-x-1/2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
              isActive
                ? 'bg-[#a040f3] text-white rounded-full px-4 py-1.5 shadow-sm'
                : 'text-[#424753] hover:text-[#0058bd] py-1 px-3'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isActive ? 'fill-1' : ''
              }`}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-medium leading-none mt-1">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
