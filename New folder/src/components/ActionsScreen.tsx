import React from 'react';
import { ActionTask, NavTab } from '../types';

interface ActionsScreenProps {
  tasks: ActionTask[];
  onToggleTask: (taskId: string) => void;
  onChangeTab: (tab: NavTab) => void;
}

export const ActionsScreen: React.FC<ActionsScreenProps> = ({
  tasks,
  onToggleTask,
  onChangeTab,
}) => {
  const pendingTasks = tasks.filter((task) => !task.completed);

  return (
    <main className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
      <section className="rounded-2xl border border-[#d9e4ff] bg-white/90 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0058bd]">
              Actions
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#111827]">
              Clear next steps
            </h2>
          </div>
          <span className="rounded-full bg-[#0058bd]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0058bd]">
            {pendingTasks.length} pending
          </span>
        </div>
        <p className="mt-2 text-sm text-[#4b5563]">
          AI-surfaced follow-ups are kept compact so the next best action is obvious.
        </p>
      </section>

      <section className="space-y-2.5">
        {pendingTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white/70 p-4 text-center text-sm text-[#64748b]">
            Everything is up to date. You are clear for now.
          </div>
        ) : (
          pendingTasks.map((task) => (
            <article key={task.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-sm">
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    task.completed
                      ? 'border-[#0058bd] bg-[#0058bd] text-white'
                      : 'border-[#cbd5e1] bg-[#f8fafc] text-[#64748b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#111827]">{task.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      task.priority === 'high'
                        ? 'bg-[#fee2e2] text-[#b91c1c]'
                        : task.priority === 'medium'
                        ? 'bg-[#fef3c7] text-[#92400e]'
                        : 'bg-[#dbeafe] text-[#1d4ed8]'
                    }`}>
                      {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2 py-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {task.dueText}
                    </span>
                    {task.sourceText && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2 py-1">
                        <span className="material-symbols-outlined text-[12px]">forum</span>
                        {task.sourceText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => onChangeTab('important')}
                  className="inline-flex items-center gap-1 rounded-full border border-[#cbd5e1] px-3 py-1.5 text-[11px] font-semibold text-[#334155]"
                >
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  Open context
                </button>
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="rounded-full bg-[#0058bd] px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  Complete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
};
