export type NavTab = 'home' | 'important' | 'memory' | 'actions' | 'aichat';

export interface PrioritizedConversation {
  id: string;
  sender: string;
  badgeType: 'Urgent Request' | 'Manager Feedback' | 'Recruiter Opportunity' | 'Project Sync' | 'Normal';
  badgeColor: 'error' | 'tertiary' | 'primary' | 'secondary' | 'outline';
  score: number; // e.g. 98, 92, 85, 78
  summary: string;
  fullContent?: string;
  iconName: string;
  avatarUrl?: string;
  appIcon?: string; // 'chat' | 'mail' | 'work' | 'groups' | 'slack' | 'teams'
  channelText?: string;
  unread?: boolean;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  note: string;
  avatarUrl: string;
  accentColor: 'primary' | 'secondary' | 'tertiary';
}

export interface Project {
  id: string;
  name: string;
  subtitle: string;
  progress: number; // 0 to 100
  statusText: string;
  statusBadge: string;
  statusType: 'primary' | 'tertiary' | 'error';
  dateLabel: string;
  teamAvatars: string[];
}

export interface ExtractedFact {
  id: string;
  type: 'phone' | 'address' | 'wifi' | 'general';
  title: string;
  subtitle: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface RecentInteraction {
  id: string;
  timeAgo: string;
  icon: string;
  content: string;
  accentColor: 'primary' | 'secondary' | 'tertiary';
}

export interface ActionTask {
  id: string;
  title: string;
  dueText: string;
  sourceText?: string;
  completed: boolean;
  type?: 'slack' | 'teams' | 'email' | 'general';
  actionButtonText?: string;
  actionButtonIcon?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface MeetingSlot {
  id: string;
  time: string;
  duration: string;
  selected?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  attachments?: string[];
  isDraft?: boolean;
  draftSubject?: string;
  draftBody?: string;
}
