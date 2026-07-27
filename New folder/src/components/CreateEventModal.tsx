import React, { useState } from 'react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (title: string, time: string, duration: string) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState('30 min');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title) {
      onAddEvent(title, time, duration);
      setTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-[#0058bd]">
            <span className="material-symbols-outlined">event</span>
            <h3 className="text-lg font-bold text-[#191c1d]">Create Event</h3>
          </div>
          <button onClick={onClose} className="text-[#727785] hover:text-[#191c1d]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#424753] block mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Budget Review Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[#424753] block mb-1">
                Time Slot
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-2 border border-[#c2c6d5] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
              >
                <option value="14:00">14:00</option>
                <option value="15:30">15:30</option>
                <option value="16:45">16:45</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#424753] block mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-10 px-2 border border-[#c2c6d5] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
              >
                <option value="15 min">15 min</option>
                <option value="30 min">30 min</option>
                <option value="45 min">45 min</option>
                <option value="60 min">60 min</option>
              </select>
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
              type="submit"
              className="flex-1 h-10 rounded-xl pill-gradient text-white text-xs font-semibold shadow-sm"
            >
              Schedule Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
