import React, { useState } from 'react';
import { PrioritizedConversation, MeetingSlot, ActionTask, NavTab } from '../types';

interface ImportantScreenProps {
  conversations: PrioritizedConversation[];
  slots: MeetingSlot[];
  tasks: ActionTask[];
  onToggleTask: (taskId: string) => void;
  onOpenReplyModal: (conv: PrioritizedConversation) => void;
  onOpenCreateEvent: () => void;
  onChangeTab: (tab: NavTab) => void;
}

export const ImportantScreen: React.FC<ImportantScreenProps> = ({
  conversations,
  slots,
  tasks,
  onToggleTask,
  onOpenReplyModal,
  onOpenCreateEvent,
  onChangeTab,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const filterOptions = ['All', 'Urgent Request', 'Manager Feedback', 'Recruiter Opportunity', 'Project Sync'];

  const filteredConversations = conversations.filter((c) => {
    if (filterType === 'All') return true;
    return c.badgeType === filterType;
  });

  const getBadgeStyle = (badgeType: string) => {
    switch (badgeType) {
      case 'Urgent Request':
        return {
          bgDot: 'bg-[#ba1a1a] animate-pulse',
          text: 'text-[#ba1a1a]',
          border: 'border-l-[#ba1a1a]',
          badgeBg: 'bg-[#ba1a1a]/10',
        };
      case 'Manager Feedback':
        return {
          bgDot: 'bg-[#b35e00]',
          text: 'text-[#b35e00]',
          border: 'border-l-[#b35e00]',
          badgeBg: 'bg-[#b35e00]/10',
        };
      case 'Recruiter Opportunity':
        return {
          bgDot: 'bg-[#0058bd]',
          text: 'text-[#0058bd]',
          border: 'border-l-[#0058bd]',
          badgeBg: 'bg-[#0058bd]/10',
        };
      case 'Project Sync':
      default:
        return {
          bgDot: 'bg-[#851ad8]',
          text: 'text-[#851ad8]',
          border: 'border-l-[#851ad8]',
          badgeBg: 'bg-[#851ad8]/10',
        };
    }
  };

  return (
    <main className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
      <div className="rounded-2xl border border-[#dbeafe] bg-white/90 p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0058bd]">Priority</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[#111827]">AI-ranked conversations</h2>
          </div>
          <div className="rounded-full bg-[#0058bd]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0058bd]">
            {filteredConversations.length} active
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Important</h2>
          <p className="text-xs text-[#64748b] font-medium">
            {filteredConversations.length} prioritized conversations
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1.5 rounded-full border border-[#dbeafe] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#475569]"
          >
            <span className="material-symbols-outlined text-base">filter_list</span>
            {filterType === 'All' ? 'Filtered' : filterType}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#c2c6d5]/40 py-2 z-20">
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setFilterType(opt);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#f3f4f5] transition-colors flex items-center justify-between ${
                    filterType === opt ? 'text-[#0058bd] font-semibold bg-[#0058bd]/5' : 'text-[#191c1d]'
                  }`}
                >
                  {opt}
                  {filterType === opt && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meeting Assistant Box */}
      <section className="rounded-2xl border border-[#dbeafe] bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0058bd] text-xl">
              event_available
            </span>
            <h3 className="font-semibold text-sm text-[#111827]">Meeting Assistant</h3>
          </div>
          <button
            onClick={onOpenCreateEvent}
            className="pill-gradient text-white font-semibold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Event
          </button>
        </div>

        <p className="text-xs text-[#64748b]">
          You have 3 open slots today before 5 PM.
        </p>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {slots.map((slot) => {
            const isSel = selectedSlot === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(isSel ? null : slot.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#0058bd] text-white border-[#0058bd] shadow-md'
                    : 'bg-[#edeeef] text-[#191c1d] border-[#c2c6d5]/30 hover:bg-[#d8e2ff]'
                }`}
              >
                <span className={`block font-bold text-xs ${isSel ? 'text-white' : 'text-[#0058bd]'}`}>
                  {slot.time}
                </span>
                <span className={`block text-[10px] ${isSel ? 'text-white/80' : 'text-[#727785]'}`}>
                  {slot.duration}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Conversations List */}
      <section className="space-y-2.5">
        {filteredConversations.map((conv) => {
          const style = getBadgeStyle(conv.badgeType);
          return (
            <div
              key={conv.id}
              className={`rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-sm relative group transition-all duration-200 space-y-3 ${style.border}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center p-2 shadow-sm shrink-0">
                    <span
                      className="material-symbols-outlined text-[#424753] text-xl fill-1"
                    >
                      {conv.iconName}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#111827]">
                      {conv.sender}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${style.bgDot}`} />
                      <span className={`text-[11px] font-semibold ${style.text}`}>
                        {conv.badgeType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-[#2771df] leading-none">
                    {conv.score}
                  </div>
                  <div className="text-[10px] text-[#727785] font-medium">/100</div>
                </div>
              </div>

              <div className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3">
                <p className="text-xs text-[#475569] leading-relaxed">
                  {conv.summary}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onOpenReplyModal(conv)}
                  className="flex-1 rounded-full bg-[#0058bd] px-3 py-2 text-xs font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  Reply with AI
                </button>
                <button
                  onClick={() => onChangeTab('aichat')}
                  title="Open AI Chat for full thread analysis"
                  className="w-10 h-10 rounded-full border border-[#dbeafe] flex items-center justify-center text-[#64748b] hover:bg-[#f8fbff] transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">more_vert</span>
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Action Tasks Grouped (Today) */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-[#111827]">Today tasks</h3>
          <span className="rounded-full bg-[#0058bd]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0058bd]">
            {tasks.filter((t) => !t.completed).length} Tasks
          </span>
        </div>

        <div className="space-y-2.5">
          {tasks
            .filter((t) => t.actionButtonText)
            .map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 flex flex-col gap-3 shadow-sm transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#851ad8] text-xl">
                        {task.type === 'slack' ? 'tag' : 'groups'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">
                        {task.title}
                      </h4>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#64748b]">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{task.dueText}</span>
                        {task.sourceText && (
                          <>
                            <span className="w-1 h-1 bg-[#c2c6d5] rounded-full" />
                            <span>{task.sourceText}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => onChangeTab('aichat')}
                    className="flex-1 h-9 rounded-full bg-[#0058bd] text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-base">
                      {task.actionButtonIcon || 'auto_awesome'}
                    </span>
                    {task.actionButtonText}
                  </button>
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`w-11 h-9 rounded-full border flex items-center justify-center transition-colors active:scale-95 ${
                      task.completed
                        ? 'border-[#0058bd] bg-[#0058bd] text-white'
                        : 'border-[#dbeafe] hover:bg-[#f8fbff] text-[#64748b]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
};
