import { useState, useEffect, useCallback } from 'react';
import { getClipboardText, checkVocabulary, addWordsToNotepad, lookupDictionary, showPopupWindow } from '../lib/tauri';
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
  const { notepads } = useNotepadStore();
  const { addRecentWord } = useWordStore();
  
  const [popup, setPopup] = useState<WordPopup>({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    data: null,
  });
  
  const [showNotepadPicker, setShowNotepadPicker] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupWord = useCallback(async (mouseX?: number, mouseY?: number) => {
    if (!settings.maimemoToken) {
      setError('请先配置 API Token');
      return;
    }

    try {
      const text = await getClipboardText();
      console.log('Clipboard text:', text);
      
      if (!text || !text.trim()) {
        setError('剪贴板为空');
        setTimeout(() => setError(''), 2000);
        return;
      }
      
      const word = text.trim();
      if (!/^[a-zA-Z]+$/.test(word)) {
        setError('剪贴板内容不是英文单词');
        setTimeout(() => setError(''), 2000);
        return;
      }

      setIsLoading(true);
      setError('');
      
      const [vocabResult, dictResult] = await Promise.all([
        checkVocabulary(word, settings.maimemoToken).catch(() => null),
        lookupDictionary(word).catch(() => null)
      ]);
      
      console.log('Vocabulary result:', vocabResult);
      console.log('Dictionary result:', dictResult);
      
      const vocData = vocabResult?.data?.voc;
      const dictData = dictResult?.data;
      
      if (vocData || dictData) {
        const x = mouseX ?? 400;
        const y = mouseY ?? 300;
        
        await showPopupWindow(
          x,
          y,
          word,
          dictData?.definitions || [],
          dictData?.phonetic || '',
          dictData?.uk_phonetic || '',
          vocData?.id || '',
          settings.maimemoToken
        );
        
        setPopup({
          visible: true,
          x: x,
          y: y,
          word: word,
          data: {
            id: vocData?.id,
            spelling: word,
          },
        });
      } else {
        setError('查询失败');
        setTimeout(() => setError(''), 2000);
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      setError('查询失败');
      setTimeout(() => setError(''), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [settings.maimemoToken]);

  // 监听全局快捷键
  useEffect(() => {
    let lastMouseX = 400;
    let lastMouseY = 300;
    
    const handleMouseMove = (e: MouseEvent) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const hotkey = settings.hotkey.toLowerCase();
      const parts = hotkey.split('+').map(p => p.trim());
      
      const needCtrl = parts.includes('ctrl');
      const needShift = parts.includes('shift');
      const needAlt = parts.includes('alt');
      const key = parts.find(p => !['ctrl', 'shift', 'alt', 'meta'].includes(p));
      
      const ctrlMatch = e.ctrlKey === needCtrl;
      const shiftMatch = e.shiftKey === needShift;
      const altMatch = e.altKey === needAlt;
      const keyMatch = e.key.toLowerCase() === key?.toLowerCase();
      
      console.log('Hotkey check:', {
        hotkey,
        needCtrl, needShift, needAlt, key,
        actualCtrl: e.ctrlKey, actualShift: e.shiftKey, actualAlt: e.altKey, actualKey: e.key,
        ctrlMatch, shiftMatch, altMatch, keyMatch
      });
      
      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hotkey matched, calling lookupWord at', lastMouseX, lastMouseY);
        lookupWord(lastMouseX, lastMouseY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [settings.hotkey, lookupWord]);

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
    } catch (err) {
      setError('添加失败');
    }
  };

  if (!popup.visible && !showNotepadPicker && !error) return null;

  return (
    <>
      {/* 错误提示 */}
      {error && (
        <div
          className="fixed z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          {error}
        </div>
      )}

      {/* 词本选择弹窗 */}
      {showNotepadPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">添加到词本</h3>
            <p className="text-gray-600 mb-4">
              将 <span className="font-bold text-green-700">{popup.word}</span> 添加到：
            </p>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                onClick={() => {
                  setShowNotepadPicker(false);
                  setPopup(prev => ({ ...prev, visible: false }));
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={!selectedId || isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
