import { useState, useEffect, useCallback, useRef } from 'react';
import { getClipboardText, checkVocabulary, addWordsToNotepad } from '../lib/tauri';
import { useSettingsStore, useNotepadStore, useWordStore } from '../stores';

interface WordPopup {
  visible: boolean;
  x: number;
  y: number;
  word: string;
  data: any;
}

export function WordLookup() {
  const { settings } = useSettingsStore();
  const { notepads, selectedNotepad } = useNotepadStore();
  const { addRecentWord } = useWordStore();
  
  const [popup, setPopup] = useState<WordPopup>({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    data: null,
  });
  
  const [showNotepadPicker, setShowNotepadPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const popupRef = useRef<HTMLDivElement>(null);

  const lookupWord = useCallback(async () => {
    if (!settings.maimemoToken) {
      setError('请先配置 API Token');
      return;
    }

    try {
      const text = await getClipboardText();
      if (!text || !/^[a-zA-Z]+$/.test(text)) {
        return;
      }

      setIsLoading(true);
      setError('');
      
      const result = await checkVocabulary(text, settings.maimemoToken);
      
      if (result?.data) {
        // 获取鼠标位置
        const x = await import('@tauri-apps/api/core').then(m => m.invoke('get_cursor_position')).catch(() => ({ x: 400, y: 300 }));
        
        setPopup({
          visible: true,
          x: (x as any).x || 400,
          y: (x as any).y || 300,
          word: text,
          data: result.data,
        });
      }
    } catch (err) {
      console.error('Lookup failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settings.maimemoToken]);

  // 监听全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const hotkey = settings.hotkey.toLowerCase();
      const parts = hotkey.split('+').map(p => p.trim());
      
      const needCtrl = parts.includes('ctrl');
      const needShift = parts.includes('shift');
      const needAlt = parts.includes('alt');
      const key = parts.find(p => !['ctrl', 'shift', 'alt', 'meta'].includes(p));
      
      if (
        e.ctrlKey === needCtrl &&
        e.shiftKey === needShift &&
        e.altKey === needAlt &&
        e.key.toLowerCase() === key?.toLowerCase()
      ) {
        e.preventDefault();
        lookupWord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.hotkey, lookupWord]);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(prev => ({ ...prev, visible: false }));
        setShowNotepadPicker(false);
        setShowConfirm(false);
      }
    };

    if (popup.visible) {
      window.addEventListener('mousedown', handleClickOutside);
      return () => window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popup.visible]);

  const handleAddToNotepad = () => {
    if (selectedNotepad) {
      setSelectedId(selectedNotepad.id);
    }
    setShowNotepadPicker(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedId || !popup.data?.id) return;
    
    try {
      await addWordsToNotepad(selectedId, [popup.data.id], settings.maimemoToken);
      addRecentWord({
        id: Date.now().toString(),
        spelling: popup.word,
        vocId: popup.data.id,
        addedAt: new Date(),
        notepadId: selectedId,
      });
      setPopup(prev => ({ ...prev, visible: false }));
      setShowNotepadPicker(false);
      setShowConfirm(false);
    } catch (err) {
      setError('添加失败');
    }
  };

  if (!popup.visible) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        left: Math.min(popup.x, window.innerWidth - 320),
        top: Math.min(popup.y, window.innerHeight - 200),
        width: '300px',
      }}
    >
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-t-lg border-b">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">{popup.word}</span>
          {popup.data?.pronunciation && (
            <span className="text-gray-500 text-sm">{popup.data.pronunciation}</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleAddToNotepad}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            添加到词本
          </button>
          <button
            onClick={() => setPopup(prev => ({ ...prev, visible: false }))}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
          >
            ×
          </button>
        </div>
      </div>

      {/* 释义内容 */}
      <div className="p-4 max-h-40 overflow-y-auto">
        {popup.data?.definitions?.length > 0 ? (
          <div className="space-y-2">
            {popup.data.definitions.map((def: any, idx: number) => (
              <div key={idx} className="flex">
                <span className="text-green-700 font-medium w-12 flex-shrink-0">{def.type}</span>
                <span className="text-gray-700">{def.meaning}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">暂无释义</p>
        )}
      </div>

      {/* 词本选择弹窗 */}
      {showNotepadPicker && !showConfirm && (
        <div className="border-t p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">选择词本：</p>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">请选择词本</option>
            {notepads.map((notepad) => (
              <option key={notepad.id} value={notepad.id}>
                {notepad.title}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowNotepadPicker(false)}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (selectedId) setShowConfirm(true);
              }}
              disabled={!selectedId}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* 二次确认 */}
      {showConfirm && (
        <div className="border-t p-4">
          <p className="text-sm text-gray-700 mb-3">
            确定将 <span className="font-bold text-green-700">{popup.word}</span> 添加到词本？
          </p>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              返回
            </button>
            <button
              onClick={handleConfirmAdd}
              disabled={isLoading}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? '添加中...' : '确认添加'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
