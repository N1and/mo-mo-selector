import { create } from 'zustand';

interface Notepad {
  id: string;
  title: string;
  brief?: string;
  tags?: string[];
  status?: string;
  content?: string;
  created_time?: string;
  updated_time?: string;
}

interface NotepadState {
  notepads: Notepad[];
  selectedNotepad: Notepad | null;
  isLoading: boolean;
  setNotepads: (notepads: Notepad[]) => void;
  setSelectedNotepad: (notepad: Notepad | null) => void;
  addNotepad: (notepad: Notepad) => void;
  updateNotepad: (id: string, updates: Partial<Notepad>) => void;
  removeNotepad: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotepadStore = create<NotepadState>((set) => ({
  notepads: [],
  selectedNotepad: null,
  isLoading: false,
  setNotepads: (notepads) => set({ notepads: Array.isArray(notepads) ? notepads : [] }),
  setSelectedNotepad: (notepad) => set({ selectedNotepad: notepad }),
  addNotepad: (notepad) =>
    set((state) => ({
      notepads: [...state.notepads, notepad],
    })),
  updateNotepad: (id, updates) =>
    set((state) => ({
      notepads: state.notepads.map((notepad) =>
        notepad.id === id ? { ...notepad, ...updates } : notepad
      ),
    })),
  removeNotepad: (id) =>
    set((state) => ({
      notepads: state.notepads.filter((notepad) => notepad.id !== id),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}));