import { create } from 'zustand';
import { ChatMessage, UploadedData, DashboardConfig } from '../types/dashboard';

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  uploadedData: UploadedData | null;
  dashboardConfig: DashboardConfig | null;
  createdAt: Date;
  lastActive: Date;
}

const MAX_SESSIONS = 6;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const INITIAL_SESSION_ID = generateId();

function createWelcomeSession(): ChatSession {
  return {
    id: INITIAL_SESSION_ID,
    name: 'Chat 1',
    messages: [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `👋 Welcome to **Arjuna Speaks**!\n\n**Get started:**\n• Upload an Excel or CSV file (drag & drop or click)\n• Ask questions about your data\n• Say "generate dashboard" for visualizations\n• The AI will suggest KPIs, insights, and chart types`,
        timestamp: new Date(),
      },
    ],
    uploadedData: null,
    dashboardConfig: null,
    createdAt: new Date(),
    lastActive: new Date(),
  };
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;

  // Session management
  createSession: () => string;
  switchSession: (id: string) => void;
  closeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;

  // Message management
  addMessage: (sessionId: string, message: ChatMessage) => void;
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;

  // Data management
  setUploadedData: (sessionId: string, data: UploadedData | null) => void;
  setDashboardConfig: (sessionId: string, config: DashboardConfig | null) => void;

  // Getters
  activeSession: () => ChatSession | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: (() => {
    const initial = createWelcomeSession();
    return [initial];
  })(),
  activeSessionId: INITIAL_SESSION_ID,

  createSession: () => {
    const { sessions } = get();
    if (sessions.length >= MAX_SESSIONS) {
      // Remove oldest inactive session
      const sorted = [...sessions].sort(
        (a, b) => a.lastActive.getTime() - b.lastActive.getTime()
      );
      const oldest = sorted[0];
      if (oldest) {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== oldest.id),
        }));
      }
    }

    const sessionNum = sessions.length + 1;
    const newSession: ChatSession = {
      id: generateId(),
      name: `Chat ${sessionNum}`,
      messages: [
        {
          id: `welcome-${sessionNum}`,
          role: 'assistant',
          content: `👋 Welcome to Chat ${sessionNum}! Upload your data and ask me anything.`,
          timestamp: new Date(),
        },
      ],
      uploadedData: null,
      dashboardConfig: null,
      createdAt: new Date(),
      lastActive: new Date(),
    };

    set((state) => ({
      sessions: [...state.sessions, newSession],
      activeSessionId: newSession.id,
    }));

    return newSession.id;
  },

  switchSession: (id: string) => {
    set((state) => ({
      activeSessionId: id,
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, lastActive: new Date() } : s
      ),
    }));
  },

  closeSession: (id: string) => {
    const { sessions } = get();
    if (sessions.length <= 1) return; // Don't close last session

    const idx = sessions.findIndex((s) => s.id === id);
    set((state) => {
      const filtered = state.sessions.filter((s) => s.id !== id);
      let newActive = state.activeSessionId;
      if (state.activeSessionId === id) {
        newActive = filtered[Math.min(idx, filtered.length - 1)]?.id || filtered[0]?.id || null;
      }
      return { sessions: filtered, activeSessionId: newActive };
    });
  },

  renameSession: (id: string, name: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    }));
  },

  addMessage: (sessionId: string, message: ChatMessage) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message], lastActive: new Date() }
          : s
      ),
    }));
  },

  setMessages: (sessionId: string, messages: ChatMessage[]) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages, lastActive: new Date() } : s
      ),
    }));
  },

  setUploadedData: (sessionId: string, data: UploadedData | null) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, uploadedData: data, lastActive: new Date() } : s
      ),
    }));
  },

  setDashboardConfig: (sessionId: string, config: DashboardConfig | null) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, dashboardConfig: config, lastActive: new Date() } : s
      ),
    }));
  },

  activeSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId) || null;
  },
}));
