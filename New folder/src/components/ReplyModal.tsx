import React, { useState } from 'react';
import { PrioritizedConversation, NavTab } from '../types';

interface ReplyModalProps {
  conversation: PrioritizedConversation | null;
  onClose: () => void;
  onSendToChat: (prompt: string) => void;
  onChangeTab: (tab: NavTab) => void;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
  conversation,
  onClose,
  onSendToChat,
  onChangeTab,
}) => {
  const [tone, setTone] = useState<'Casual' | 'Balanced' | 'Professional'>('Balanced');
  const [customNote, setCustomNote] = useState('');

  if (!conversation) return null;

  const handleGenerateReply = () => {
    const prompt = `Draft a ${tone.toLowerCase()} response to ${conversation.sender} regarding: "${conversation.summary}". ${
      customNote ? `Additional instruction: ${customNote}` : ''
    }`;
    onSendToChat(prompt);
    onClose();
    onChangeTab('aichat');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex justify-between items-start border-b border-[#c2c6d5]/30 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#851ad8] fill-1">
                auto_awesome
              </span>
              <h3 className="text-base font-bold text-[#191c1d]">
                Reply with AI
              </h3>
            </div>
            <p className="text-xs text-[#727785] font-medium mt-0.5">
              To: {conversation.sender} ({conversation.badgeType})
            </p>
          </div>
          <button onClick={onClose} className="text-[#727785] hover:text-[#191c1d]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="bg-[#0058bd]/5 p-3 rounded-2xl border-l-2 border-[#0058bd]">
          <p className="text-xs text-[#424753] line-clamp-3">
            "{conversation.summary}"
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#424753] block mb-1">
              Select Desired Tone
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Casual', 'Balanced', 'Professional'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                    tone === t
                      ? 'bg-[#0058bd] text-white border-[#0058bd]'
                      : 'bg-[#f8f9fa] text-[#424753] border-[#c2c6d5]/50 hover:bg-[#e7e8e9]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#424753] block mb-1">
              Specific Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Accept 1:1 on Thursday or ask for 2 days extension"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[#c2c6d5] text-xs font-semibold text-[#424753]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerateReply}
            className="flex-1 h-10 rounded-xl pill-gradient text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Open in AI Chat
          </button>
        </div>
      </div>
    </div>
  );
};
