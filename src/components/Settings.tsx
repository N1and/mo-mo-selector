import { useEffect, useState } from 'react';
import { useSettingsStore, useNotepadStore, useWordStore } from '../stores';
import { useToastStore } from '../stores/toastStore';
import { HotkeyPicker } from './HotkeyPicker';
import { unregisterAllHotkeys } from '../lib/tauri';

export function Settings() {
  const { settings, isLoaded, updateSettings, saveSettings } = useSettingsStore();
  const { notepads, setNotepads, setSelectedNotepad } = useNotepadStore();
  const { addLog } = useWordStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showNotepadPicker, setShowNotepadPicker] = useState(false);
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
      // 先注销旧热键，WordLookup 的 useEffect 会自动重新注册新的
      await unregisterAllHotkeys();
      if (settings.maimemoToken) {
        await loadNotepads();
      }
      showToast('设置已保存', 'success');
      addLog('设置已保存', 'success');
    } catch (error) {
      showToast('保存失败', 'error');
      addLog(`保存设置失败: ${error}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNotepad = notepads.find((n) => n.id === settings.selectedNotepadId);

  return (
    <div className="space-y-6">
      <div className="banner flex items-center justify-between">
        <div>
          <h2 className="banner-title">设置</h2>
          <p className="banner-desc">配置 API Token、快捷键和应用选项</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="banner-info">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {settings.hotkey}
          </span>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">API 配置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-gray-700 mb-1">
                墨墨背单词 API Token
              </label>
              <input
                type="password"
                value={settings.maimemoToken}
                onChange={(e) => updateSettings({ maimemoToken: e.target.value })}
                className="input"
                placeholder="从墨墨背单词 App 获取"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">词本设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-gray-700 mb-1">
                默认词本
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowNotepadPicker(!showNotepadPicker)}
                  className="input text-left flex items-center justify-between"
                >
                  <span className={selectedNotepad ? '' : 'text-gray-400'}>
                    {selectedNotepad ? selectedNotepad.title : '请选择词本'}
                  </span>
                  <span className="text-gray-400">▾</span>
                </button>
                {showNotepadPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto z-50">
                    <button
                      onClick={() => {
                        updateSettings({ selectedNotepadId: '' });
                        setSelectedNotepad(null);
                        setShowNotepadPicker(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      请选择词本
                    </button>
                    {notepads.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          updateSettings({ selectedNotepadId: n.id });
                          setSelectedNotepad(n);
                          setShowNotepadPicker(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {n.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">应用设置</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">开机自启动</p>
                <p className="text-body text-gray-500">开机时自动启动应用</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) => updateSettings({ autoStart: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink"></div>
              </label>
            </div>

            <div>
              <label className="block text-body font-medium text-gray-700 mb-1">
                查询快捷键
              </label>
              <HotkeyPicker
                value={settings.hotkey}
                onChange={(hotkey) => updateSettings({ hotkey })}
              />
              <p className="text-caption text-gray-500 mt-1">
                复制单词后，按此快捷键查询并添加到词本
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-6"
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
