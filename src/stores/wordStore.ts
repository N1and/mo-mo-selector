import { create } from 'zustand';

interface Word {
  id: string;
  spelling: string;
  vocId?: string;
  definitions?: string[];
  addedAt: Date;
  notepadId?: string;
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error';
}

interface WordState {
  currentWord: Word | null;
  recentWords: Word[];
  logs: LogEntry[];
  setCurrentWord: (word: Word | null) => void;
  addRecentWord: (word: Word) => void;
  clearRecentWords: () => void;
  addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearLogs: () => void;
  getTodayWords: () => Word[];
}

export const useWordStore = create<WordState>((set, get) => ({
  currentWord: null,
  recentWords: [],
  logs: [],
  setCurrentWord: (word) => set({ currentWord: word }),
  addRecentWord: (word) =>
    set((state) => {
      const exists = state.recentWords.find(w => w.spelling === word.spelling);
      if (exists) {
        return {
          recentWords: [
            { ...word, addedAt: new Date() },
            ...state.recentWords.filter(w => w.spelling !== word.spelling)
          ].slice(0, 50),
        };
      }
      return {
        recentWords: [word, ...state.recentWords].slice(0, 50),
      };
    }),
  clearRecentWords: () => set({ recentWords: [] }),
  addLog: (message, type = 'info') =>
    set((state) => ({
      logs: [
        {
          id: Date.now().toString(),
          message,
          timestamp: new Date(),
          type,
        },
        ...state.logs,
      ].slice(0, 100),
    })),
  clearLogs: () => set({ logs: [] }),
  getTodayWords: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return get().recentWords.filter((word) => {
      const wordDate = new Date(word.addedAt);
      wordDate.setHours(0, 0, 0, 0);
      return wordDate.getTime() === today.getTime();
    });
  },
}));