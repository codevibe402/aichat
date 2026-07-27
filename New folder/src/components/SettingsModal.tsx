import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[#c2c6d5]/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0058bd]">settings</span>
            <h3 className="text-lg font-bold text-[#191c1d]">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#727785] hover:text-[#191c1d]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#424753]">
          <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#c2c6d5]/30 flex justify-between items-center">
            <div>
              <p className="font-semibold text-[#191c1d]">AI Model</p>
              <p className="text-[11px] text-[#727785]">Gemini 3.6 Flash</p>
            </div>
            <span className="text-[10px] bg-[#0058bd]/10 text-[#0058bd] font-bold px-2 py-0.5 rounded-full">
              Connected
            </span>
          </div>

          <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#c2c6d5]/30 flex justify-between items-center">
            <div>
              <p className="font-semibold text-[#191c1d]">Connected Accounts</p>
              <p className="text-[11px] text-[#727785]">Gmail, Slack, Teams, Calendar</p>
            </div>
            <span className="material-symbols-outlined text-[#0058bd] text-lg">
              check_circle
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="w-full h-10 rounded-xl border border-[#ba1a1a]/40 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Reset Application Demo Data
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full h-10 pill-gradient text-white font-semibold rounded-xl text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
