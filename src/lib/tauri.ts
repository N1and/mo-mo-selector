declare global {
  interface Window {
    __TAURI_INTERNALS__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>;
    };
  }
}

function getInvoke(): ((cmd: string, args?: Record<string, unknown>) => Promise<any>) | null {
  try {
    return window.__TAURI_INTERNALS__?.invoke ?? null;
  } catch {
    return null;
  }
}

async function invoke<T = any>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const fn = getInvoke();
  if (!fn) {
    throw new Error('Tauri API not available');
  }
  return fn(cmd, args) as Promise<T>;
}

export async function greet(name: string): Promise<string> {
  return invoke<string>('greet', { name });
}

export async function loadSettings(): Promise<any> {
  return invoke('load_settings');
}

export async function saveSettings(settings: any): Promise<void> {
  return invoke('save_settings', { settings });
}

export async function getClipboardText(): Promise<string> {
  return invoke<string>('get_clipboard_text');
}

export async function checkVocabulary(spelling: string, token: string): Promise<any> {
  return invoke('check_vocabulary', { spelling, token });
}

export async function createNotepad(title: string, brief: string, tags: string[], content: string, token: string): Promise<any> {
  return invoke('create_notepad', { title, brief, tags, content, token });
}

export async function getNotepads(token: string): Promise<any> {
  return invoke('get_notepads', { token });
}

export async function addWordsToNotepad(notepadId: string, vocIds: string[], token: string): Promise<any> {
  return invoke('add_words_to_notepad', { notepadId, vocIds, token });
}

export async function deleteNotepad(notepadId: string, token: string): Promise<any> {
  return invoke('delete_notepad', { notepadId, token });
}

export async function updateNotepad(notepadId: string, title: string, brief: string, tags: string[], content: string, token: string): Promise<any> {
  return invoke('update_notepad', { notepadId, title, brief, tags, content, token });
}

export async function getNotepadDetail(notepadId: string, token: string): Promise<any> {
  return invoke('get_notepad_detail', { notepadId, token });
}

export async function getWordDetails(spellings: string[], token: string): Promise<any> {
  return invoke('get_word_details', { spellings, token });
}

export async function addWordsToStudy(vocIds: string[], advance: boolean, token: string): Promise<any> {
  return invoke('add_words_to_study', { vocIds, advance, token });
}

export async function showPopupWindow(x: number, y: number, word: string, definitions: string[], phonetic: string, ukPhonetic: string, vocId: string, token: string): Promise<void> {
  return invoke('show_popup_window', { x, y, word, definitions, phonetic, ukPhonetic, vocId, token });
}

export async function closePopupWindow(): Promise<void> {
  return invoke('close_popup_window');
}

export async function lookupDictionary(word: string): Promise<any> {
  return invoke('lookup_dictionary', { word });
}

export async function getCursorPosition(): Promise<{ x: number; y: number }> {
  return invoke('get_cursor_position');
}
