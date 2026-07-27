import React, { useState } from 'react';
import { Person, Project, ExtractedFact, RecentInteraction } from '../types';

interface MemoryScreenProps {
  people: Person[];
  projects: Project[];
  facts: ExtractedFact[];
  interactions: RecentInteraction[];
  onAddFact: (title: string, subtitle: string, type: ExtractedFact['type']) => void;
  onAddPerson: (name: string, title: string, note: string) => void;
}

export const MemoryScreen: React.FC<MemoryScreenProps> = ({
  people,
  projects,
  facts,
  interactions,
  onAddFact,
  onAddPerson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddFactModal, setShowAddFactModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  // Form states
  const [newFactTitle, setNewFactTitle] = useState('');
  const [newFactSubtitle, setNewFactSubtitle] = useState('');
  const [newFactType, setNewFactType] = useState<ExtractedFact['type']>('general');

  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonTitle, setNewPersonTitle] = useState('');
  const [newPersonNote, setNewPersonNote] = useState('');

  // Search filtering
  const q = searchQuery.toLowerCase().trim();

  const filteredPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.note.toLowerCase().includes(q)
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q)
  );

  const filteredFacts = facts.filter(
    (f) =>
      f.title.toLowerCase().includes(q) ||
      f.subtitle.toLowerCase().includes(q) ||
      f.value.toLowerCase().includes(q)
  );

  const filteredInteractions = interactions.filter((i) =>
    i.content.toLowerCase().includes(q)
  );

  const handleCopy = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleAddFactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFactTitle) {
      onAddFact(newFactTitle, newFactSubtitle || 'Extracted Info', newFactType);
      setNewFactTitle('');
      setNewFactSubtitle('');
      setShowAddFactModal(false);
    }
  };

  const handleAddPersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName) {
      onAddPerson(newPersonName, newPersonTitle || 'Colleague', newPersonNote || 'Professional contact');
      setNewPersonName('');
      setNewPersonTitle('');
      setNewPersonNote('');
      setShowAddPersonModal(false);
    }
  };

  return (
    <main className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
      {/* Global Search */}
      <section className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#727785]">
          <span className="material-symbols-outlined text-xl">search</span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge, people, or facts..."
          className="w-full h-11 pl-11 pr-10 rounded-2xl border border-[#dbeafe] bg-white/90 shadow-sm text-sm text-[#111827] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0058bd] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-[#727785] hover:text-[#191c1d]"
          >
            <span className="material-symbols-outlined text-lg">cancel</span>
          </button>
        )}
      </section>

      {/* People (Bento Style) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">People</h2>
          <button
            onClick={() => setShowAddPersonModal(true)}
            className="text-xs font-semibold text-[#0058bd] hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Person
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className={`rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-sm flex flex-col items-center text-center space-y-2 border-l-4 ${
                person.accentColor === 'secondary'
                  ? 'border-l-[#851ad8]'
                  : 'border-l-[#0058bd]'
              } active:scale-95 transition-transform cursor-pointer`}
            >
              <div
                className={`w-16 h-16 rounded-full overflow-hidden mb-1 ring-2 ${
                  person.accentColor === 'secondary'
                    ? 'ring-[#851ad8]/20'
                    : 'ring-[#0058bd]/20'
                }`}
              >
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-sm text-[#111827] block leading-tight">
                {person.name}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  person.accentColor === 'secondary'
                    ? 'bg-[#851ad8]/10 text-[#851ad8]'
                    : 'bg-[#0058bd]/10 text-[#0058bd]'
                }`}
              >
                {person.title}
              </span>
              <p className="text-xs text-[#64748b] line-clamp-1">{person.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Projects */}
      <section className="space-y-2.5">
        <h2 className="text-[15px] font-semibold text-[#111827]">Projects</h2>
        <div className="flex flex-col gap-3">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className={`rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-sm border-l-4 ${
                proj.statusType === 'tertiary'
                  ? 'border-l-[#b35e00]'
                  : 'border-l-[#0058bd]'
              } space-y-3`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-[#111827]">
                    {proj.name}
                  </h3>
                  <span className="text-xs text-[#64748b]">{proj.subtitle}</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    proj.statusType === 'tertiary'
                      ? 'bg-[#ffdcc4] text-[#2f1400]'
                      : 'bg-[#d8e2ff] text-[#001a41]'
                  }`}
                >
                  {proj.statusBadge}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#edeeef] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    proj.statusType === 'tertiary' ? 'bg-[#b35e00]' : 'bg-[#0058bd]'
                  }`}
                  style={{ width: `${proj.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#64748b]">
                    calendar_today
                  </span>
                  <span>{proj.dateLabel}</span>
                </div>

                {proj.teamAvatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {proj.teamAvatars.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Team avatar"
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Extracted Facts */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">Facts</h2>
          <button
            onClick={() => setShowAddFactModal(true)}
            className="text-xs font-semibold text-[#0058bd] hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Fact
          </button>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden shadow-sm divide-y divide-[#e5e7eb]">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              onClick={() => handleCopy(fact.id, fact.value)}
              className="p-4 flex items-center justify-between hover:bg-[#0058bd]/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${fact.iconBg} flex items-center justify-center ${fact.iconColor} shrink-0`}
                >
                  <span className="material-symbols-outlined">{fact.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111827]">{fact.title}</p>
                  <p className="text-xs text-[#64748b]">{fact.subtitle}</p>
                </div>
              </div>
              <button className="p-1 text-[#64748b] hover:text-[#0058bd]">
                <span className="material-symbols-outlined text-lg">
                  {copiedId === fact.id
                    ? 'check_circle'
                    : fact.type === 'address'
                    ? 'map'
                    : fact.type === 'wifi'
                    ? 'key'
                    : 'content_copy'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Interactions Timeline */}
      <section className="space-y-2.5">
        <h2 className="text-[15px] font-semibold text-[#111827]">Recent interactions</h2>
        <div className="relative pl-6 space-y-4 border-l-2 border-[#0058bd]/20 ml-2">
          {filteredInteractions.map((inter) => (
            <div key={inter.id} className="relative">
              <div
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ring-4 ring-[#f8fafc] ${
                  inter.accentColor === 'secondary' ? 'bg-[#851ad8]' : 'bg-[#0058bd]'
                }`}
              />
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[11px] font-bold ${
                      inter.accentColor === 'secondary'
                        ? 'text-[#851ad8]'
                        : 'text-[#0058bd]'
                    }`}
                  >
                    {inter.timeAgo}
                  </span>
                  <span className="material-symbols-outlined text-[#424753] text-base">
                    {inter.icon}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {inter.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Fact Modal */}
      {showAddFactModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#191c1d]">Add Extracted Fact</h3>
              <button
                onClick={() => setShowAddFactModal(false)}
                className="text-[#727785] hover:text-[#191c1d]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddFactSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#424753] block mb-1">
                  Title / Content
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 (555) 012-9934 or Office Pass"
                  value={newFactTitle}
                  onChange={(e) => setNewFactTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#424753] block mb-1">
                  Subtitle / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah's direct line"
                  value={newFactSubtitle}
                  onChange={(e) => setNewFactSubtitle(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#424753] block mb-1">
                  Type
                </label>
                <select
                  value={newFactType}
                  onChange={(e) => setNewFactType(e.target.value as ExtractedFact['type'])}
                  className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                >
                  <option value="general">General Note</option>
                  <option value="phone">Phone Number</option>
                  <option value="address">Address / Location</option>
                  <option value="wifi">Wi-Fi / Credentials</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFactModal(false)}
                  className="flex-1 h-10 rounded-xl border border-[#c2c6d5] text-xs font-semibold text-[#424753]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl pill-gradient text-white text-xs font-semibold"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#191c1d]">Add Person</h3>
              <button
                onClick={() => setShowAddPersonModal(false)}
                className="text-[#727785] hover:text-[#191c1d]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddPersonSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#424753] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#424753] block mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Lead"
                  value={newPersonTitle}
                  onChange={(e) => setNewPersonTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#424753] block mb-1">
                  Communication Preference / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Async feedback preferred"
                  value={newPersonNote}
                  onChange={(e) => setNewPersonNote(e.target.value)}
                  className="w-full h-10 px-3 border border-[#c2c6d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                  className="flex-1 h-10 rounded-xl border border-[#c2c6d5] text-xs font-semibold text-[#424753]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl pill-gradient text-white text-xs font-semibold"
                >
                  Save Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
