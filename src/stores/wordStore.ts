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

const STORAGE_KEY = 'momoselector_recent_words';

function loadRecentWords(): Word[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const words = JSON.parse(data);
      return words.map((w: any) => ({
        ...w,
        addedAt: new Date(w.addedAt),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveRecentWords(words: Word[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {
    // ignore
  }
}

export const useWordStore = create<WordState>((set, get) => ({
  currentWord: null,
  recentWords: loadRecentWords(),
  logs: [],
  setCurrentWord: (word) => set({ currentWord: word }),
  addRecentWord: (word) =>
    set((state) => {
      let newWords: Word[];
      const exists = state.recentWords.find(w => w.spelling === word.spelling);
      if (exists) {
        newWords = [
          { ...word, addedAt: new Date() },
          ...state.recentWords.filter(w => w.spelling !== word.spelling)
        ].slice(0, 50);
      } else {
        newWords = [word, ...state.recentWords].slice(0, 50);
      }
      saveRecentWords(newWords);
      return { recentWords: newWords };
    }),
  clearRecentWords: () => {
    saveRecentWords([]);
    set({ recentWords: [] });
  },
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
    return get().recentWords;
  },
}));