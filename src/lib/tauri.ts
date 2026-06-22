import { invoke } from '@tauri-apps/api/core';

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

export async function getNotepads(token: string): Promise<any> {
  return invoke('get_notepads', { token });
}

export async function addWordsToNotepad(notepadId: string, vocIds: string[], token: string): Promise<any> {
  return invoke('add_words_to_notepad', { notepadId, vocIds, token });
}
