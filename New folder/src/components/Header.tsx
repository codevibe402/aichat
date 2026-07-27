import React from 'react';
import { NavTab } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenSettings }) => {
  const titles: Record<NavTab, string> = {
    home: 'Inbox',
    important: 'Important',
    memory: 'Memory',
    actions: 'Actions',
    aichat: 'AI Assistant',
  };

  const title = titles[activeTab];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f8f9fa]/80 backdrop-blur-md border-b border-white/10 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex justify-between items-center px-4 h-16 max-w-2xl left-1/2 -translate-x-1/2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0058bd] to-[#851ad8] flex items-center justify-center text-white shadow-sm overflow-hidden p-[1px]">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-[#0058bd] fill-1">
              auto_awesome
            </span>
          </div>
        </div>
        <h1 className="font-semibold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#0058bd] to-[#851ad8]">
          {title}
        </h1>
      </div>

      <button
        onClick={onOpenSettings}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#424753] hover:bg-[#0058bd]/10 transition-colors active:scale-95 duration-200"
        title="Settings & Preferences"
      >
        <span className="material-symbols-outlined">settings</span>
      </button>
    </header>
  );
};
