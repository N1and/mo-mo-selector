import { useState, useEffect, useCallback } from 'react';
import { getClipboardText, checkVocabulary, addWordsToNotepad, lookupDictionary, showPopupWindow, closePopupWindow } from '../lib/tauri';
import { useSettingsStore, useNotepadStore, useWordStore, useToastStore } from '../stores';

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
  const { addRecentWord, setCurrentWord, addLog } = useWordStore();
  const showToast = useToastStore((s) => s.show);
  
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

  const lookupWord = useCallback(async (mouseX?: number, mouseY?: number) => {
    if (!settings.maimemoToken) {
      showToast('请先配置 API Token', 'error');
      addLog('请先配置 API Token', 'error');
      return;
    }

    try {
      // 先关闭已存在的弹窗
      await closePopupWindow();
      // 等待窗口完全关闭
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const text = await getClipboardText();
      console.log('Clipboard text:', text);
      
      if (!text || !text.trim()) {
        showToast('剪贴板为空', 'error');
        addLog('剪贴板为空', 'error');
        return;
      }
      
      const word = text.trim();
      if (!/^[a-zA-Z]+$/.test(word)) {
        showToast('剪贴板内容不是英文单词', 'error');
        addLog(`剪贴板内容不是英文单词: "${word}"`, 'error');
        return;
      }

      setIsLoading(true);
      
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
          dictData?.examples?.map((e: any) => e.sentence) || [],
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

        setCurrentWord({
          id: Date.now().toString(),
          spelling: word,
          vocId: vocData?.id,
          definitions: (dictData?.definitions || []).slice(0, 5),
          addedAt: new Date(),
        });

        addRecentWord({
          id: Date.now().toString(),
          spelling: word,
          vocId: vocData?.id,
          definitions: (dictData?.definitions || []).slice(0, 5),
          addedAt: new Date(),
        });

        addLog(`查词成功: ${word}`, 'success');
      } else {
        showToast('查询失败', 'error');
        addLog(`查询失败: ${word}`, 'error');
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      showToast('查询失败', 'error');
      addLog(`查询异常: ${err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [settings.maimemoToken]);

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

    const handleRefreshLookup = () => {
      lookupWord(lastMouseX, lastMouseY);
    };

    const handleRefreshCurrentWord = async () => {
      try {
        const text = await getClipboardText();
        if (text && text.trim() && /^[a-zA-Z]+$/.test(text.trim())) {
          setCurrentWord({
            id: Date.now().toString(),
            spelling: text.trim(),
            addedAt: new Date(),
          });
          showToast('刷新成功', 'success');
          addLog(`刷新当前单词: ${text.trim()}`, 'info');
        } else {
          showToast('刷新失败: 剪贴板内容不是英文单词', 'error');
          addLog('刷新失败: 剪贴板内容不是英文单词', 'error');
        }
      } catch (err) {
        console.error('Failed to refresh current word:', err);
        showToast('刷新失败', 'error');
        addLog(`刷新当前单词失败: ${err}`, 'error');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('app:refresh-lookup', handleRefreshLookup);
    window.addEventListener('app:refresh-current-word', handleRefreshCurrentWord);
    
    const handleAddLog = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        addLog(detail.message, detail.type || 'info');
      }
    };
    window.addEventListener('app:add-log', handleAddLog);
    
    const handleShowToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        showToast(detail.message, detail.type || 'info');
      }
    };
    window.addEventListener('app:show-toast', handleShowToast);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('app:refresh-lookup', handleRefreshLookup);
      window.removeEventListener('app:refresh-current-word', handleRefreshCurrentWord);
      window.removeEventListener('app:add-log', handleAddLog);
      window.removeEventListener('app:show-toast', handleShowToast);
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
      showToast('添加单词成功', 'success');
      addLog(`添加单词到词本成功: ${popup.word}`, 'success');
      setPopup(prev => ({ ...prev, visible: false }));
      setShowNotepadPicker(false);
    } catch (err) {
      showToast('添加单词失败', 'error');
      addLog(`添加单词到词本失败: ${popup.word}`, 'error');
    }
  };

  if (!popup.visible && !showNotepadPicker) return null;

  return (
    <>
      {showNotepadPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-96">
            <h3 className="text-lg font-bold mb-4">添加到词本</h3>
            <p className="text-gray-600 mb-4">
              将 <span className="font-bold text-ink">{popup.word}</span> 添加到：
            </p>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input mb-4"
            >
              <option value="">请选择词本</option>
              {notepads.map((notepad) => (
                <option key={notepad.id} value={notepad.id}>
                  {notepad.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNotepadPicker(false);
                  setPopup(prev => ({ ...prev, visible: false }));
                }}
                className="btn-text"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={!selectedId || isLoading}
                className="btn-primary"
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
