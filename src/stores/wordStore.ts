import { create } from 'zustand';

interface Word {
  id: string;
  spelling: string;
  vocId?: string;
  definition?: string;
  translation?: string;
  addedAt: Date;
  notepadId?: string;
}

interface WordState {
  currentWord: Word | null;
  recentWords: Word[];
  setCurrentWord: (word: Word | null) => void;
  addRecentWord: (word: Word) => void;
  clearRecentWords: () => void;
}

export const useWordStore = create<WordState>((set) => ({
  currentWord: null,
  recentWords: [],
  setCurrentWord: (word) => set({ currentWord: word }),
  addRecentWord: (word) =>
    set((state) => ({
      recentWords: [word, ...state.recentWords].slice(0, 50),
    })),
  clearRecentWords: () => set({ recentWords: [] }),
}));