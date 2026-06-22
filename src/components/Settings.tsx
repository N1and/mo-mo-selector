import { useEffect, useState } from 'react';
import { useSettingsStore, useNotepadStore } from '../stores';
import { useToastStore } from '../stores/toastStore';
import { HotkeyPicker } from './HotkeyPicker';

export function Settings() {
  const { settings, isLoaded, updateSettings, saveSettings } = useSettingsStore();
  const { notepads, setNotepads, setSelectedNotepad } = useNotepadStore();
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (isLoaded && settings.maimemoToken && notepads.length === 0) {
      loadNotepads();
    }
  }, [isLoaded]);

  const loadNotepads = async () => {
    try {
      if (!settings.maimemoToken) return;
      const result = await import('../lib/tauri').then(m => m.getNotepads(settings.maimemoToken));
      if (result?.data?.notepads) {
        setNotepads(result.data.notepads);
        if (settings.selectedNotepadId) {
          const selected = result.data.notepads.find((n: any) => n.id === settings.selectedNotepadId);
          if (selected) setSelectedNotepad(selected);
        }
      }
    } catch (error) {
      console.error('Failed to load notepads:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      if (settings.maimemoToken) {
        await loadNotepads();
      }
      showToast('设置已保存', 'success');
    } catch (error) {
      showToast('保存失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">设置</h2>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">API 配置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                墨墨背单词 API Token
              </label>
              <input
                type="password"
                value={settings.maimemoToken}
                onChange={(e) => updateSettings({ maimemoToken: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="从墨墨背单词 App 获取"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">词本设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                默认词本
              </label>
              <select
                value={settings.selectedNotepadId}
                onChange={(e) => updateSettings({ selectedNotepadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择词本</option>
                {notepads.map((notepad) => (
                  <option key={notepad.id} value={notepad.id}>
                    {notepad.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">应用设置</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">开机自启动</p>
                <p className="text-sm text-gray-500">开机时自动启动应用</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) => updateSettings({ autoStart: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                查询快捷键
              </label>
              <HotkeyPicker
                value={settings.hotkey}
                onChange={(hotkey) => updateSettings({ hotkey })}
              />
              <p className="text-xs text-gray-500 mt-1">
                复制单词后，按此快捷键查询并添加到词本
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
