import {
  PrioritizedConversation,
  Person,
  Project,
  ExtractedFact,
  RecentInteraction,
  ActionTask,
  MeetingSlot,
  ChatMessage,
} from '../types';

export const initialConversations: PrioritizedConversation[] = [
  {
    id: 'conv-1',
    sender: 'Sarah Mitchell',
    badgeType: 'Urgent Request',
    badgeColor: 'error',
    score: 98,
    summary: 'Sarah needs the quarterly budget projections finalized by 2 PM. She mentioned a potential blocker in the marketing spend.',
    fullContent: 'Hi! Could you review the Q4 marketing spend projections? We need this signed off by 2 PM before executive approval. Let me know if there are any blockers.',
    iconName: 'chat',
    appIcon: 'chat',
    unread: true,
  },
  {
    id: 'conv-2',
    sender: 'David Chen',
    badgeType: 'Manager Feedback',
    badgeColor: 'tertiary',
    score: 92,
    summary: 'Shared positive feedback on your last presentation. Suggested a 1:1 on Thursday to discuss your career progression roadmap.',
    fullContent: 'Great job on yesterday\'s presentation! The board was very impressed with the clear metrics. Let\'s do a 1:1 Thursday at 10 AM to discuss roadmap and next steps.',
    iconName: 'mail',
    appIcon: 'mail',
    unread: true,
  },
  {
    id: 'conv-3',
    sender: 'Jessica Walters',
    badgeType: 'Recruiter Opportunity',
    badgeColor: 'primary',
    score: 85,
    summary: 'Inquiry about your availability for a Senior Design Architect role at NeoTech. High salary range and remote options highlighted.',
    fullContent: 'Hello! I came across your impressive profile. NeoTech is seeking a Senior Design Architect to lead our platform overhaul. Would you be open to a quick call?',
    iconName: 'work',
    appIcon: 'work',
    unread: false,
  },
  {
    id: 'conv-4',
    sender: 'Design Team',
    badgeType: 'Project Sync',
    badgeColor: 'secondary',
    score: 78,
    summary: 'The v2 design system audit results are in. Several high-impact accessibility issues were flagged for immediate review.',
    fullContent: 'Hey team, the accessibility audit results for v2 design system were published. 4 high priority contrast items need fixing before sprint end.',
    iconName: 'groups',
    appIcon: 'groups',
    unread: false,
  },
];

export const initialPeople: Person[] = [
  {
    id: 'p-1',
    name: 'Sarah Chen',
    title: 'Lead Designer',
    note: 'Direct, visual-first',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAlHnRj6IalUoN-1YgKHNWVU9FBltLmPjBczjaDD64-rBEycBMItWv5hROHYAKp3fWPFUhSCfC7X2R-12fgbog3yienSdSgip47Jhd-iJOSGNYDfXnGQ-gXxWSf5RNaXG40GqlonBVoFsqGHhF8Y8i6dEDaEUuO9HxRHx7F74BLITStIOK09Q_PO_A1P2CWUK4RNFPlimWbK0GMQU1jLlQuWgIFEhR29eX4ZQqrIXwZDF_q4-ViEn3H_NKXKPOw850xiuDgaeX2Us',
    accentColor: 'secondary',
  },
  {
    id: 'p-2',
    name: 'Marcus Thorne',
    title: 'CTO',
    note: 'Technical, concise',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7wm1ybOQrRIwj1FRyxN4AFf0eVS_s2drjrSYSj_N4a_YuIuLO6hohdBK4yWB00RMJsWwrHURYiTIvvFCWzZF8Mt11L5t0cLAfADRqDneZ04E88FVqhSXRMlvKTdRjEPxhWl-p3P5O02fc39XKEut5o-wy0_FWdYjgERYub2-EAeOfoCObMy2IRmNPFEA1LcX_RKALQMUt093M6blKld2LW4Hp75nAtCYfQg2NfzAU7UjSeEdBBS8Ot2j-WO1wGeZ1MQklNkJQSyY',
    accentColor: 'primary',
  },
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Project Phoenix',
    subtitle: 'Q3 Infrastructure Migration',
    progress: 85,
    statusText: '85% Done',
    statusBadge: '85% Done',
    statusType: 'primary',
    dateLabel: 'Oct 24, 2023',
    teamAvatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA89KwNiPXgZ9sm3sifY_ROEbWbQb0eJkXLweZQgeK852aSGqY1B21y9GjZoTn2wDe3yqtMIc4qvlZRkrmswEb2dXK_GH3fbHU29NAlRhVUpdIyyoTBVgkNVMqvSAuidPGgEBYy244aKonRkRBsqHhZ4qZde-4X1yC5KbmKeLjXQEFEo_YQK5NoxRvX-sDUFvtnqp4ZqZ0n_89lsvHqRvMzgskXSoLuC5-AziruSTDLt3nHuD4MEf9R2avRJi367k9xXjTk_j9mpG8',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDy6R-GyMhwAwGtlJwbZRW38BJLBnUX1sINfMx8NHZzdxbT1bxkCMG3Tufc2XB-pOSB6w8fZcppclzZQrvjQrpOO3R0GZeCj6U73fabpMSFI1kk4UntkW8I9qqzcgKe6QXrsExFdwGm-4vYqI7JIfhpjZrce5uBugSLErVcGR0CZqsYGrShOlEp_Ku4nqLq3jUAhdGE7dGYhxFO9mS0FUtLW52AEfROz0ucmI6FkiKqU1rGDYkG_sYsdhZoj94KnJQRIE_VH6H6SHQ',
    ],
  },
  {
    id: 'proj-2',
    name: 'Vanguard Redesign',
    subtitle: 'Brand Identity Refresh',
    progress: 30,
    statusText: 'Delayed',
    statusBadge: 'Delayed',
    statusType: 'tertiary',
    dateLabel: 'Next Monday',
    teamAvatars: [],
  },
];

export const initialFacts: ExtractedFact[] = [
  {
    id: 'fact-1',
    type: 'phone',
    title: '+1 (555) 012-9934',
    subtitle: "Sarah's Direct Line",
    value: '+1 (555) 012-9934',
    icon: 'call',
    iconBg: 'bg-blue-100',
    iconColor: 'text-[#0058bd]',
  },
  {
    id: 'fact-2',
    type: 'address',
    title: '88 Market St, SF',
    subtitle: 'Client HQ Office',
    value: '88 Market St, SF',
    icon: 'location_on',
    iconBg: 'bg-purple-100',
    iconColor: 'text-[#851ad8]',
  },
  {
    id: 'fact-3',
    type: 'wifi',
    title: 'Guest_Vanguard_5G',
    subtitle: 'Wi-Fi Password: Vngrd2024!',
    value: 'Vngrd2024!',
    icon: 'wifi',
    iconBg: 'bg-orange-100',
    iconColor: 'text-[#8f4a00]',
  },
];

export const initialInteractions: RecentInteraction[] = [
  {
    id: 'inter-1',
    timeAgo: '2 HOURS AGO',
    icon: 'chat',
    content: 'Discussed Project Phoenix migration steps with Sarah. Knowledge updated.',
    accentColor: 'primary',
  },
  {
    id: 'inter-2',
    timeAgo: 'YESTERDAY',
    icon: 'mail',
    content: 'Summary of Vanguard Redesign feedback shared via Slack channel.',
    accentColor: 'secondary',
  },
];

export const initialTasks: ActionTask[] = [
  {
    id: 'task-1',
    title: 'Finalize slide deck for CEO',
    dueText: '2h left',
    completed: false,
    priority: 'high',
  },
  {
    id: 'task-2',
    title: 'Follow up with Recruitment',
    dueText: 'Today',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Summarize product feedback',
    dueText: 'Due in 2h',
    sourceText: 'Slack: #product-ops',
    completed: false,
    type: 'slack',
    actionButtonText: 'Generate Reply',
    actionButtonIcon: 'auto_awesome',
  },
  {
    id: 'task-4',
    title: 'Review Q3 Budget Proposal',
    dueText: 'Due 17:00',
    sourceText: 'Teams: Sarah Miller',
    completed: false,
    type: 'teams',
    actionButtonText: 'Review Draft',
    actionButtonIcon: 'visibility',
  },
  {
    id: 'task-5',
    title: 'Monthly Security Audit',
    dueText: 'Tomorrow • Morning',
    sourceText: 'Internal Portal',
    completed: false,
  },
  {
    id: 'task-6',
    title: 'Project Alpha Handover',
    dueText: 'Friday, 10 Oct',
    completed: false,
  },
  {
    id: 'task-7',
    title: 'Archive completed Jira tickets',
    dueText: 'Sunday, 12 Oct',
    completed: false,
  },
];

export const initialSlots: MeetingSlot[] = [
  { id: 'slot-1', time: '14:00', duration: '30 min' },
  { id: 'slot-2', time: '15:30', duration: '45 min' },
  { id: 'slot-3', time: '16:45', duration: '15 min' },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: "Can you help me draft a professional email to my manager about the upcoming project deadline? I'm worried we might need an extension.",
    timestamp: '10:14 AM',
  },
  {
    id: 'msg-2',
    sender: 'ai',
    text: "Certainly! I've prepared a draft for you. You can use the controls below to adjust the tone or length.",
    timestamp: '10:15 AM',
    isDraft: true,
    draftSubject: 'Subject: Discussion regarding Project [Name] Timeline',
    draftBody: 'Dear [Manager\'s Name], I am writing to provide an update on our progress and to suggest a brief extension to ensure the highest quality of deliverables.',
  },
];
