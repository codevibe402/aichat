/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavTab, PrioritizedConversation, Person, Project, ExtractedFact, RecentInteraction, ActionTask, MeetingSlot, ChatMessage } from './types';
import {
  initialConversations,
  initialPeople,
  initialProjects,
  initialFacts,
  initialInteractions,
  initialTasks,
  initialSlots,
  initialChatMessages,
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ImportantScreen } from './components/ImportantScreen';
import { MemoryScreen } from './components/MemoryScreen';
import { AiChatScreen } from './components/AiChatScreen';
import { ActionsScreen } from './components/ActionsScreen';
import { SettingsModal } from './components/SettingsModal';
import { CreateEventModal } from './components/CreateEventModal';
import { ReplyModal } from './components/ReplyModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Persistence State
  const [conversations, setConversations] = useState<PrioritizedConversation[]>(() => {
    const saved = localStorage.getItem('ai_assistant_convs');
    return saved ? JSON.parse(saved) : initialConversations;
  });

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('ai_assistant_people');
    return saved ? JSON.parse(saved) : initialPeople;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ai_assistant_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [facts, setFacts] = useState<ExtractedFact[]>(() => {
    const saved = localStorage.getItem('ai_assistant_facts');
    return saved ? JSON.parse(saved) : initialFacts;
  });

  const [interactions, setInteractions] = useState<RecentInteraction[]>(() => {
    const saved = localStorage.getItem('ai_assistant_interactions');
    return saved ? JSON.parse(saved) : initialInteractions;
  });

  const [tasks, setTasks] = useState<ActionTask[]>(() => {
    const saved = localStorage.getItem('ai_assistant_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [slots, setSlots] = useState<MeetingSlot[]>(() => {
    const saved = localStorage.getItem('ai_assistant_slots');
    return saved ? JSON.parse(saved) : initialSlots;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ai_assistant_messages');
    return saved ? JSON.parse(saved) : initialChatMessages;
  });

  const [activeDraft, setActiveDraft] = useState<{ subject: string; body: string } | null>({
    subject: 'Subject: Discussion regarding Project [Name] Timeline',
    body: 'Dear [Manager\'s Name], I am writing to provide an update on our progress and to suggest a brief extension to ensure the highest quality of deliverables.',
  });

  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedReplyConv, setSelectedReplyConv] = useState<PrioritizedConversation | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('ai_assistant_convs', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_facts', JSON.stringify(facts));
  }, [facts]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_interactions', JSON.stringify(interactions));
  }, [interactions]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_messages', JSON.stringify(messages));
  }, [messages]);

  // Handlers
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (title: string, dueText: string = 'Today') => {
    const newTask: ActionTask = {
      id: `task-${Date.now()}`,
      title,
      dueText,
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleAddFact = (title: string, subtitle: string, type: ExtractedFact['type']) => {
    const newFact: ExtractedFact = {
      id: `fact-${Date.now()}`,
      type,
      title,
      subtitle,
      value: title,
      icon: type === 'phone' ? 'call' : type === 'address' ? 'location_on' : type === 'wifi' ? 'wifi' : 'description',
      iconBg: type === 'phone' ? 'bg-blue-100' : type === 'address' ? 'bg-purple-100' : 'bg-orange-100',
      iconColor: type === 'phone' ? 'text-[#0058bd]' : type === 'address' ? 'text-[#851ad8]' : 'text-[#8f4a00]',
    };
    setFacts((prev) => [newFact, ...prev]);
  };

  const handleAddPerson = (name: string, title: string, note: string) => {
    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name,
      title,
      note,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA89KwNiPXgZ9sm3sifY_ROEbWbQb0eJkXLweZQgeK852aSGqY1B21y9GjZoTn2wDe3yqtMIc4qvlZRkrmswEb2dXK_GH3fbHU29NAlRhVUpdIyyoTBVgkNVMqvSAuidPGgEBYy244aKonRkRBsqHhZ4qZde-4X1yC5KbmKeLjXQEFEo_YQK5NoxRvX-sDUFvtnqp4ZqZ0n_89lsvHqRvMzgskXSoLuC5-AziruSTDLt3nHuD4MEf9R2avRJi367k9xXjTk_j9mpG8',
      accentColor: 'primary',
    };
    setPeople((prev) => [newPerson, ...prev]);
  };

  const handleAddEvent = (title: string, time: string, duration: string) => {
    const newSlot: MeetingSlot = {
      id: `slot-${Date.now()}`,
      time,
      duration,
      selected: true,
    };
    setSlots((prev) => [...prev, newSlot]);
    handleAddTask(`Meeting: ${title}`, `Today at ${time}`);
  };

  const handleSendMessageToAI = async (text: string, tone: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingAI(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          tone,
          history: messages,
        }),
      });

      const data = await res.json();

      let replyText = data.reply || 'Here is the response based on your request.';

      // Attempt to parse subject and body if it contains email draft format
      let parsedSubject = 'Subject: Follow up on discussion';
      let parsedBody = replyText;

      if (replyText.includes('Subject:')) {
        const parts = replyText.split(/Subject:\s*/i);
        if (parts[1]) {
          const lines = parts[1].split('\n');
          parsedSubject = `Subject: ${lines[0].trim()}`;
          parsedBody = lines.slice(1).join('\n').trim();
        }
      }

      setActiveDraft({
        subject: parsedSubject,
        body: parsedBody,
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: "I've drafted a response for you based on your request. You can adjust tone or refine length below.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDraft: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error sending message:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: 'I have prepared a draft based on your request. You can edit the content directly or use the quick refine buttons.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDraft: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleRefineDraft = async (action: string, tone: string) => {
    if (!activeDraft) return;

    setIsLoadingAI(true);
    try {
      const currentFullText = `${activeDraft.subject}\n\n${activeDraft.body}`;
      const res = await fetch('/api/gemini/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentFullText,
          action,
          tone,
        }),
      });

      const data = await res.json();
      const revised = data.refinedText || currentFullText;

      let newSubject = activeDraft.subject;
      let newBody = revised;

      if (revised.includes('Subject:')) {
        const parts = revised.split(/Subject:\s*/i);
        if (parts[1]) {
          const lines = parts[1].split('\n');
          newSubject = `Subject: ${lines[0].trim()}`;
          newBody = lines.slice(1).join('\n').trim();
        }
      }

      setActiveDraft({
        subject: newSubject,
        body: newBody,
      });
    } catch (err) {
      console.error('Refine draft error:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSummarizeDay = async () => {
    setActiveTab('aichat');
    setIsLoadingAI(true);

    try {
      const res = await fetch('/api/gemini/summarize-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          conversations,
          projects,
        }),
      });

      const data = await res.json();
      const summaryText = data.summary || 'Daily briefing prepared successfully.';

      const summaryMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `📊 Executive Daily Summary:\n\n${summaryText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, summaryMsg]);
    } catch (err) {
      console.error('Summarize day error:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    setConversations(initialConversations);
    setPeople(initialPeople);
    setProjects(initialProjects);
    setFacts(initialFacts);
    setInteractions(initialInteractions);
    setTasks(initialTasks);
    setSlots(initialSlots);
    setMessages(initialChatMessages);
    setActiveDraft({
      subject: 'Subject: Discussion regarding Project [Name] Timeline',
      body: 'Dear [Manager\'s Name], I am writing to provide an update on our progress and to suggest a brief extension to ensure the highest quality of deliverables.',
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] relative font-sans antialiased">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Tab Views */}
      {activeTab === 'home' && (
        <HomeScreen
          conversations={conversations}
          projects={projects}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onChangeTab={setActiveTab}
          onSelectConversation={(conv) => setSelectedReplyConv(conv)}
          onSummarizeDay={handleSummarizeDay}
        />
      )}

      {activeTab === 'important' && (
        <ImportantScreen
          conversations={conversations}
          slots={slots}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onOpenReplyModal={(conv) => setSelectedReplyConv(conv)}
          onOpenCreateEvent={() => setIsCreateEventOpen(true)}
          onChangeTab={setActiveTab}
        />
      )}

      {activeTab === 'memory' && (
        <MemoryScreen
          people={people}
          projects={projects}
          facts={facts}
          interactions={interactions}
          onAddFact={handleAddFact}
          onAddPerson={handleAddPerson}
        />
      )}

      {activeTab === 'actions' && (
        <ActionsScreen
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onChangeTab={setActiveTab}
        />
      )}

      {activeTab === 'aichat' && (
        <AiChatScreen
          messages={messages}
          onSendMessage={handleSendMessageToAI}
          onRefineDraft={handleRefineDraft}
          isLoading={isLoadingAI}
          activeDraft={activeDraft}
          setActiveDraft={setActiveDraft}
        />
      )}

      {/* Floating Glass Bottom Nav Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetData={handleResetData}
      />

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onAddEvent={handleAddEvent}
      />

      <ReplyModal
        conversation={selectedReplyConv}
        onClose={() => setSelectedReplyConv(null)}
        onSendToChat={(prompt) => handleSendMessageToAI(prompt, 'Balanced')}
        onChangeTab={setActiveTab}
      />
    </div>
  );
}
