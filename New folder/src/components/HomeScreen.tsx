import React, { useState } from 'react';
import { PrioritizedConversation, Project, ActionTask, NavTab } from '../types';

interface HomeScreenProps {
  conversations: PrioritizedConversation[];
  projects: Project[];
  tasks: ActionTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, dueText?: string) => void;
  onChangeTab: (tab: NavTab) => void;
  onSelectConversation: (conv: PrioritizedConversation) => void;
  onSummarizeDay: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  conversations,
  projects,
  tasks,
  onToggleTask,
  onAddTask,
  onChangeTab,
  onSelectConversation,
  onSummarizeDay,
}) => {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Calculate dynamic productivity score
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length || 1;
  const baseScore = 75;
  const productivityScore = Math.min(99, Math.max(60, baseScore + Math.round((completedCount / totalCount) * 20)));

  const handleExtractFromGmail = async () => {
    setIsExtracting(true);
    // Simulate AI scanning and extracting tasks
    setTimeout(() => {
      onAddTask('Confirm marketing budget allocation with Sarah', 'Today');
      onAddTask('Schedule Q4 roadmap planning session', 'Tomorrow');
      setIsExtracting(false);
    }, 1200);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskInput.trim()) {
      onAddTask(newTaskInput.trim(), 'Today');
      setNewTaskInput('');
    }
  };

  return (
    <main className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
      <section className="rounded-2xl border border-[#dbeafe] bg-white/90 p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0058bd]">Today</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[#111827]">What needs attention first?</h2>
          </div>
          <div className="rounded-full bg-[#0058bd]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0058bd]">
            {tasks.filter((t) => !t.completed).length} pending
          </div>
        </div>
      </section>

      {/* Productivity Score Widget */}
      <section className="flex flex-col items-center justify-center pt-1">
        <div className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-sm bg-white border border-[#e5e7eb]">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#e1e3e4"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#0058bd"
              strokeWidth="10"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * productivityScore) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="text-center z-10">
            <span className="text-3xl font-bold text-[#0058bd] block leading-none">
              {productivityScore}
            </span>
            <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block mt-1">
              Score
            </span>
          </div>
        </div>
        <p className="text-sm text-center mt-2 text-[#475569]">
          Your productivity is <span className="text-[#0058bd] font-semibold">12% higher</span> than yesterday.
        </p>
      </section>

      {/* AI Assistant Quick Commands */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">AI shortcuts</h2>
          <span className="material-symbols-outlined text-[#0058bd] fill-1 text-xl">
            bolt
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onSummarizeDay}
            className="rounded-2xl border border-[#dbeafe] bg-white/90 p-3 text-left transition-all hover:bg-[#f8fbff] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[#851ad8] text-xl">summarize</span>
            <span className="mt-2 block text-xs font-semibold text-[#111827]">Summarize day</span>
          </button>
          <button
            onClick={() => onChangeTab('aichat')}
            className="rounded-2xl border border-[#dbeafe] bg-white/90 p-3 text-left transition-all hover:bg-[#f8fbff] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[#0058bd] text-xl">schedule_send</span>
            <span className="mt-2 block text-xs font-semibold text-[#111827]">Draft replies</span>
          </button>
        </div>
      </section>

      {/* Important (Ranked Messages Preview) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">Important</h2>
          <button
            onClick={() => onChangeTab('important')}
            className="rounded-full bg-[#fee2e2] px-2.5 py-1 text-[11px] font-semibold text-[#b91c1c]"
          >
            3 new
          </button>
        </div>
        <div className="space-y-2.5">
          {conversations.slice(0, 2).map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                onSelectConversation(conv);
                onChangeTab('important');
              }}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 flex items-center gap-3 cursor-pointer transition-all hover:border-[#0058bd]/40 active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-full bg-[#f3f4f6] flex items-center justify-center shadow-sm shrink-0">
                <span className={`material-symbols-outlined ${conv.badgeColor === 'error' ? 'text-[#25D366]' : 'text-[#4A154B]'} text-xl fill-1`}>
                  {conv.iconName}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-[#111827] truncate">
                  {conv.sender}
                </h3>
                <p className="text-xs text-[#64748b] truncate mt-0.5">
                  {conv.summary}
                </p>
              </div>
              {conv.badgeColor === 'error' ? (
                <span className="material-symbols-outlined text-[#b91c1c] text-lg shrink-0">
                  priority_high
                </span>
              ) : (
                <span className="material-symbols-outlined text-[#64748b] text-lg shrink-0">
                  chevron_right
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Memory (Horizontal Scroll) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">Memory</h2>
          <button
            onClick={() => onChangeTab('memory')}
            className="text-[11px] font-semibold text-[#0058bd]"
          >
            View all
          </button>
        </div>
        <div className="flex overflow-x-auto gap-2.5 scrollbar-hide pb-1 -mx-1 px-1">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onChangeTab('memory')}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 min-w-[220px] flex flex-col gap-2 cursor-pointer hover:border-[#0058bd]/40 transition-all shrink-0"
            >
              <div className="flex items-center gap-2">
                {proj.teamAvatars[0] ? (
                  <img
                    src={proj.teamAvatars[0]}
                    alt="Lead avatar"
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-[#851ad8]/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#a040f3]/20 flex items-center justify-center text-[#851ad8]">
                    <span className="material-symbols-outlined text-lg">groups</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm text-[#191c1d] leading-tight">
                    {proj.name}
                  </p>
                  <p className="text-[11px] text-[#727785]">{proj.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-[#64748b] line-clamp-2">
                Status: {proj.statusText} • Target: {proj.dateLabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions (Extracted Tasks) */}
      <section className="space-y-2.5 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">Actions</h2>
          <span className="text-[11px] font-semibold text-[#64748b]">
            {tasks.filter((t) => !t.completed).length} pending
          </span>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
          {tasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#f8fafc] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'border-[#0058bd] bg-[#0058bd] text-white'
                      : 'border-[#c2c6d5] bg-white'
                  }`}
                >
                  {task.completed && (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm text-[#111827] truncate ${
                    task.completed ? 'line-through text-[#64748b]' : ''
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#64748b] shrink-0 ml-2">
                {task.dueText}
              </span>
            </div>
          ))}

          {/* AI Extract Action */}
          <button
            onClick={handleExtractFromGmail}
            disabled={isExtracting}
            className="w-full p-3.5 flex items-center gap-3 bg-[#f8fbff] hover:bg-[#eff6ff] transition-colors text-left font-semibold text-sm text-[#0058bd]"
          >
            <span
              className={`material-symbols-outlined text-lg ${
                isExtracting ? 'animate-spin' : ''
              }`}
            >
              {isExtracting ? 'sync' : 'add_task'}
            </span>
            <span>
              {isExtracting
                ? 'Extracting new tasks with Gemini AI...'
                : 'Extract more from Gmail...'}
            </span>
          </button>
        </div>

        {/* Quick Task Input Form */}
        <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="Add a new action item..."
            className="flex-1 h-10 px-3 rounded-xl border border-[#dbeafe] bg-[#f8fbff] text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd] text-[#111827] placeholder:text-[#64748b]"
          />
          <button
            type="submit"
            className="h-10 px-3 rounded-xl bg-[#0058bd] text-white font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add
          </button>
        </form>
      </section>
    </main>
  );
};
