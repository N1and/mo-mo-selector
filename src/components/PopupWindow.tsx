import { useEffect, useState, useRef } from 'react';
import { addWordsToStudy, addWordsToNotepad, getNotepads, closePopupWindow } from '../lib/tauri';

interface WordData {
  word: string;
  definitions: string[];
  examples: string[];
  phonetic: string;
  uk_phonetic: string;
  voc_id: string;
  token: string;
}

interface Notepad {
  id: string;
  title: string;
}

function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('app:add-log', { detail: { message, type } }));
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  window.dispatchEvent(new CustomEvent('app:show-toast', { detail: { message, type } }));
}

export function PopupWindow() {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [message, setMessage] = useState('');
  const [notepads, setNotepads] = useState<Notepad[]>([]);
  const [showNotepadPicker, setShowNotepadPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopupWindow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleBlur = () => {
      setTimeout(() => closePopupWindow(), 150);
    };
    window.addEventListener('blur', handleBlur);

    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      const wordParam = params.get('word');
      if (wordParam) {
        const data: WordData = {
          word: wordParam,
          definitions: JSON.parse(params.get('definitions') || '[]'),
          examples: JSON.parse(params.get('examples') || '[]'),
          phonetic: params.get('phonetic') || '',
          uk_phonetic: params.get('uk_phonetic') || '',
          voc_id: params.get('voc_id') || '',
          token: params.get('token') || '',
        };
        setWordData(data);
        if (data.token) {
          getNotepads(data.token).then((res) => {
            const list = res?.data?.notepads || [];
            setNotepads(list.map((n: any) => ({ id: n.id, title: n.title })));
          }).catch(() => {});
        }
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleAddToStudy = async () => {
    if (!wordData?.voc_id || !wordData?.token) return;
    try {
      await addWordsToStudy([wordData.voc_id], false, wordData.token);
      setMessage('已加入学习');
      showToast('加入学习成功', 'success');
      addLog(`加入学习成功: ${wordData.word}`, 'success');
    } catch {
      setMessage('添加失败');
      showToast('加入学习失败', 'error');
      addLog(`加入学习失败: ${wordData.word}`, 'error');
    }
  };

  const handleAddToNotepad = async (notepadId: string) => {
    if (!wordData?.voc_id || !wordData?.token) return;
    try {
      await addWordsToNotepad(notepadId, [wordData.voc_id], wordData.token);
      setMessage('已添加到词本');
      showToast('添加到词本成功', 'success');
      addLog(`添加到词本成功: ${wordData.word}`, 'success');
    } catch {
      setMessage('添加失败');
      showToast('添加到词本失败', 'error');
      addLog(`添加到词本失败: ${wordData.word}`, 'error');
    }
  };

  if (!wordData) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <p className="text-xs text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full bg-white select-none flex flex-col">
      {/* 顶部横条 - 词本身、按钮 */}
      <div
        className="shrink-0 bg-ink px-4 py-3 flex items-center justify-between"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <span className="text-lg font-bold text-white shrink-0">{wordData.word}</span>
        <div className="flex items-center gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {message ? (
            <span className="text-sm text-white">{message}</span>
          ) : (
            <>
              {wordData.voc_id && (
                <button
                  onClick={handleAddToStudy}
                  className="px-4 py-1.5 bg-white text-ink text-sm font-medium rounded hover:bg-gray-100 transition-colors"
                >
                  加入学习
                </button>
              )}
              {wordData.voc_id && notepads.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotepadPicker(!showNotepadPicker)}
                    className="px-4 py-1.5 border border-white text-white text-sm font-medium rounded hover:bg-white/20 transition-colors"
                  >
                    添加到词本 ▾
                  </button>
                  {showNotepadPicker && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-full max-h-40 overflow-y-auto z-50">
                      {notepads.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            handleAddToNotepad(n.id);
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
              )}
            </>
          )}
          <button
            onClick={() => closePopupWindow()}
            className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* 发音区 */}
      {(wordData.uk_phonetic || wordData.phonetic) && (
        <div className="shrink-0 px-4 py-2 border-b border-gray-100 flex items-center gap-3 text-sm text-gray-500">
          {wordData.uk_phonetic && <span>英 [{wordData.uk_phonetic}]</span>}
          {wordData.phonetic && <span>美 [{wordData.phonetic}]</span>}
        </div>
      )}

      {/* 释义内容区 - 浅绿色卡片 */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {wordData.definitions.length > 0 ? (
          wordData.definitions.map((def, idx) => (
            <div key={idx} className="bg-ink-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">{def}</p>
              {wordData.examples[idx] && (
                <p className="text-sm text-gray-500 mt-2 italic">"{wordData.examples[idx]}"</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">暂无释义</p>
        )}
      </div>
    </div>
  );
}
