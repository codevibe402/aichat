import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface AiChatScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, tone: string) => Promise<void>;
  onRefineDraft: (action: string, tone: string) => Promise<void>;
  isLoading: boolean;
  activeDraft: { subject: string; body: string } | null;
  setActiveDraft: React.Dispatch<React.SetStateAction<{ subject: string; body: string } | null>>;
}

export const AiChatScreen: React.FC<AiChatScreenProps> = ({
  messages,
  onSendMessage,
  onRefineDraft,
  isLoading,
  activeDraft,
  setActiveDraft,
}) => {
  const [inputText, setInputText] = useState('');
  const [toneValue, setToneValue] = useState(50); // 0=Casual, 50=Balanced, 100=Professional
  const [attachment, setAttachment] = useState<string | null>('PLAN.PDF');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getToneLabel = (val: number) => {
    if (val < 35) return 'Casual';
    if (val > 65) return 'Professional';
    return 'Balanced';
  };

  const currentTone = getToneLabel(toneValue);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeDraft, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const textToSend = inputText.trim();
    setInputText('');
    await onSendMessage(textToSend, currentTone);
  };

  const handleCopyDraft = () => {
    if (!activeDraft) return;
    const fullText = `${activeDraft.subject}\n\n${activeDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleQuickRefine = async (action: string) => {
    if (isLoading) return;
    await onRefineDraft(action, currentTone);
  };

  return (
    <main className="pt-20 pb-36 px-4 max-w-md mx-auto space-y-4 min-h-screen">
      {/* Chat History */}
      <div className="space-y-4">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] bg-[#0058bd] text-white px-3.5 py-3 rounded-2xl rounded-tr-none shadow-sm text-sm font-normal">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[95%] rounded-2xl rounded-tl-none border border-[#e5e7eb] bg-white px-3.5 py-3 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#851ad8] text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base fill-1">
                    auto_awesome
                  </span>
                  <span>AI WRITER</span>
                </div>

                <p className="text-sm text-[#191c1d] leading-relaxed">
                  {msg.text}
                </p>

                {/* Draft Box if available */}
                {activeDraft && (
                  <div className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3 italic space-y-1">
                    {isEditingDraft ? (
                      <div className="space-y-2 not-italic">
                        <input
                          type="text"
                          value={activeDraft.subject}
                          onChange={(e) =>
                            setActiveDraft({ ...activeDraft, subject: e.target.value })
                          }
                          className="w-full text-xs font-semibold p-2 border border-[#c2c6d5] rounded-lg bg-white"
                        />
                        <textarea
                          rows={4}
                          value={activeDraft.body}
                          onChange={(e) =>
                            setActiveDraft({ ...activeDraft, body: e.target.value })
                          }
                          className="w-full text-xs p-2 border border-[#c2c6d5] rounded-lg bg-white"
                        />
                        <button
                          onClick={() => setIsEditingDraft(false)}
                          className="text-xs bg-[#0058bd] text-white px-3 py-1 rounded-lg font-medium"
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-[#191c1d] not-italic">
                          {activeDraft.subject}
                        </p>
                        <p className="text-xs text-[#191c1d] leading-normal">
                          {activeDraft.body}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Draft Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleCopyDraft}
                    className="h-8 px-3 rounded-full bg-[#0058bd]/10 text-[#0058bd] text-xs font-medium hover:bg-[#0058bd]/20 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedSuccess ? 'check' : 'content_copy'}
                    </span>
                    {copiedSuccess ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setIsEditingDraft(!isEditingDraft)}
                    className="h-8 px-3 rounded-full bg-[#0058bd]/10 text-[#0058bd] text-xs font-medium hover:bg-[#0058bd]/20 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {isEditingDraft ? 'Done Editing' : 'Edit'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-surface ai-accent-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-[#851ad8] font-semibold">
              <span className="material-symbols-outlined text-base animate-spin">
                sync
              </span>
              <span>Gemini is generating response...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Writing Controls Section */}
      <section className="rounded-2xl border border-[#dbeafe] bg-white p-3.5 shadow-sm space-y-3">
        {/* Tone Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold text-[#424753] uppercase tracking-wider">
              Tone Control
            </span>
            <span
              className={`text-xs font-bold ${
                currentTone === 'Casual'
                  ? 'text-[#8f4a00]'
                  : currentTone === 'Professional'
                  ? 'text-[#0058bd]'
                  : 'text-[#851ad8]'
              }`}
            >
              {currentTone}
            </span>
          </div>

          <div className="relative flex items-center px-1">
            <input
              type="range"
              min="0"
              max="100"
              value={toneValue}
              onChange={(e) => setToneValue(Number(e.target.value))}
              className="w-full h-1.5 bg-[#c2c6d5] rounded-lg appearance-none cursor-pointer custom-slider"
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#727785] font-bold px-1">
            <span>CASUAL</span>
            <span>PROFESSIONAL</span>
          </div>
        </div>

        {/* Quick Refine Chips */}
        <div className="pt-2 space-y-2">
          <span className="text-[11px] font-bold text-[#424753] uppercase tracking-wider block px-1">
            Quick Refine
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={isLoading}
              onClick={() => handleQuickRefine('expand')}
              className="h-8 px-3 rounded-full border border-[#0058bd]/20 bg-[#0058bd]/5 text-[#0058bd] text-xs font-semibold hover:bg-[#0058bd]/10 active:scale-95 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">expand</span>
              Expand
            </button>

            <button
              disabled={isLoading}
              onClick={() => handleQuickRefine('shorten')}
              className="h-8 px-3 rounded-full border border-[#0058bd]/20 bg-[#0058bd]/5 text-[#0058bd] text-xs font-semibold hover:bg-[#0058bd]/10 active:scale-95 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">compress</span>
              Shorten
            </button>

            <button
              disabled={isLoading}
              onClick={() => handleQuickRefine('formal')}
              className="h-8 px-3 rounded-full border border-[#0058bd]/20 bg-[#0058bd]/5 text-[#0058bd] text-xs font-semibold hover:bg-[#0058bd]/10 active:scale-95 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">
                business_center
              </span>
              Formal
            </button>

            <button
              disabled={isLoading}
              onClick={() => handleQuickRefine('confident')}
              className="h-8 px-3 rounded-full border border-[#0058bd]/20 bg-[#0058bd]/5 text-[#0058bd] text-xs font-semibold hover:bg-[#0058bd]/10 active:scale-95 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              Confident
            </button>
          </div>
        </div>
      </section>

      {/* Bento Suggestion Highlights */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setInputText('Summarize the key points and deliverables from PLAN.PDF');
          }}
          className="glass-surface p-3.5 rounded-2xl flex flex-col justify-between text-left border border-white/30 hover:bg-white/60 transition-colors"
        >
          <span className="material-symbols-outlined text-[#8f4a00] text-xl mb-1">
            summarize
          </span>
          <div>
            <h3 className="font-semibold text-xs text-[#191c1d]">Summarize</h3>
            <p className="text-[10px] text-[#727785]">
              Condense long PDF files instantly
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setInputText('Translate the draft response into Spanish and French');
          }}
          className="glass-surface p-3.5 rounded-2xl flex flex-col justify-between text-left border border-white/30 hover:bg-white/60 transition-colors"
        >
          <span className="material-symbols-outlined text-[#851ad8] text-xl mb-1">
            translate
          </span>
          <div>
            <h3 className="font-semibold text-xs text-[#191c1d]">Translate</h3>
            <p className="text-[10px] text-[#727785]">
              Convert to 12+ languages
            </p>
          </div>
        </button>
      </div>

      {/* Bottom Task-Focused Input Bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
        <div className="glass-surface rounded-2xl p-2.5 shadow-xl flex flex-col gap-2 border border-white/60">
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => {
                if (attachment) setAttachment(null);
                else setAttachment('PLAN.PDF');
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#727785] hover:text-[#0058bd] transition-colors"
              title={attachment ? 'Remove file' : 'Attach file'}
            >
              <span className="material-symbols-outlined text-xl">
                {attachment ? 'remove_circle' : 'add_circle'}
              </span>
            </button>

            <div className="flex-1 flex items-center gap-2">
              {attachment && (
                <div className="h-7 px-2.5 bg-[#e7e8e9] rounded-lg flex items-center gap-1.5 border border-[#c2c6d5]/50">
                  <span className="material-symbols-outlined text-sm text-[#ba1a1a]">
                    picture_as_pdf
                  </span>
                  <span className="text-[10px] font-bold text-[#424753]">
                    {attachment}
                  </span>
                  <button
                    onClick={() => setAttachment(null)}
                    className="material-symbols-outlined text-xs text-[#727785] hover:text-[#191c1d]"
                  >
                    close
                  </button>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSend} className="flex items-end gap-2 px-1 pb-0.5">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AI to write or summarize..."
              className="flex-1 bg-transparent border-none focus:outline-none font-normal text-xs py-1.5 resize-none max-h-24 text-[#191c1d] placeholder:text-[#727785]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className={`w-9 h-9 rounded-full pill-gradient text-white flex items-center justify-center shadow-md active:scale-90 transition-transform ${
                isLoading || !inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="material-symbols-outlined text-lg fill-1">send</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
