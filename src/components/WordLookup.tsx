import { useState, useEffect, useCallback, useRef } from 'react';
import { getClipboardText, checkVocabulary, addWordsToNotepad, lookupDictionary, showPopupWindow, closePopupWindow, getCursorPosition, listenGlobalShortcut, registerHotkey } from '../lib/tauri';
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
  const lastTriggerRef = useRef(0);

  const lookupWord = useCallback(async (mouseX?: number, mouseY?: number) => {
    const token = useSettingsStore.getState().settings.maimemoToken;
    if (!token) {
      showToast('请先配置 API Token', 'error');
      addLog('请先配置 API Token', 'error');
      return;
    }

    try {
      await closePopupWindow();
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
      
      const dictResult = await lookupDictionary(word.toLowerCase()).catch(() => null);
      const dictData = dictResult?.data;
      
      let vocabResult = await checkVocabulary(word, token).catch(() => null);
      let vocData = vocabResult?.data?.voc;
      let lookupWord = word;
      
      if (!vocData) {
        const lowerWord = word.toLowerCase();
        if (lowerWord !== word) {
          const lowerResult = await checkVocabulary(lowerWord, token).catch(() => null);
          if (lowerResult?.data?.voc) {
            vocData = lowerResult.data.voc;
            addLog(`大小写匹配: ${word} → ${lowerWord}`, 'info');
          }
        }
      }
      
      if (!vocData && dictData?.word_forms?.length > 0) {
        for (const wf of dictData.word_forms) {
          const baseForm = wf.value.toLowerCase();
          if (baseForm !== word.toLowerCase()) {
            const altResult = await checkVocabulary(baseForm, token).catch(() => null);
            if (altResult?.data?.voc) {
              vocData = altResult.data.voc;
              addLog(`词形还原: ${word} → ${baseForm}`, 'info');
              break;
            }
          }
        }
      }
      
      console.log('Vocabulary result:', vocData);
      console.log('Dictionary result:', dictData);
      
      if (vocData || dictData) {
        const x = mouseX ?? 400;
        const y = mouseY ?? 300;
        
        await showPopupWindow(
          x,
          y,
          lookupWord,
          dictData?.definitions || [],
          dictData?.examples || [],
          dictData?.phonetic || '',
          dictData?.uk_phonetic || '',
          vocData?.id || '',
          token,
          dictData?.word_forms || [],
          dictData?.web_translations || [],
          dictData?.synonyms || [],
          dictData?.antonyms || []
        );
        
        setPopup({
          visible: true,
          x: x,
          y: y,
          word: lookupWord,
          data: {
            id: vocData?.id,
            spelling: lookupWord,
          },
        });

        setCurrentWord({
          id: Date.now().toString(),
          spelling: lookupWord,
          vocId: vocData?.id,
          definitions: (dictData?.definitions || []).slice(0, 5),
          addedAt: new Date(),
        });

        addRecentWord({
          id: Date.now().toString(),
          spelling: lookupWord,
          vocId: vocData?.id,
          definitions: (dictData?.definitions || []).slice(0, 5),
          addedAt: new Date(),
        });

        addLog(`查词成功: ${lookupWord}`, 'success');
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
  }, []);

  useEffect(() => {
    let lastMouseX = 400;
    let lastMouseY = 300;
    
    const handleMouseMove = (e: MouseEvent) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
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

    const handleGlobalShortcut = async () => {
      const now = Date.now();
      if (now - lastTriggerRef.current < 1000) return;
      lastTriggerRef.current = now;
      try {
        const pos = await getCursorPosition();
        lookupWord(pos.x, pos.y);
      } catch {
        lookupWord(lastMouseX, lastMouseY);
      }
    };

    registerHotkey(settings.hotkey).catch(() => {});

    let cleanupListener: (() => void) | null = null;
    listenGlobalShortcut(handleGlobalShortcut).then((cleanup) => {
      cleanupListener = cleanup;
    });

    window.addEventListener('mousemove', handleMouseMove);
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
      if (cleanupListener) cleanupListener();
      window.removeEventListener('mousemove', handleMouseMove);
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
