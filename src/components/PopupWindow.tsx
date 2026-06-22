import { useEffect, useState, useRef } from 'react';
import { addWordsToStudy, addWordsToNotepad, getNotepads, closePopupWindow } from '../lib/tauri';

interface WordData {
  word: string;
  definitions: string[];
  examples: { sentence: string; translation: string; pos: string }[];
  phonetic: string;
  uk_phonetic: string;
  voc_id: string;
  token: string;
  word_forms: { form: string; value: string }[];
  web_translations: string[];
  synonyms: string[];
  antonyms: string[];
}

interface Notepad {
  id: string;
  title: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('app:add-log', { detail: { message, type } }));
}

export function PopupWindow() {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [notepads, setNotepads] = useState<Notepad[]>([]);
  const [showNotepadPicker, setShowNotepadPicker] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopupWindow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

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
          word_forms: JSON.parse(params.get('word_forms') || '[]'),
          web_translations: JSON.parse(params.get('web_translations') || '[]'),
          synonyms: JSON.parse(params.get('synonyms') || '[]'),
          antonyms: JSON.parse(params.get('antonyms') || '[]'),
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
    };
  }, []);

  const handleAddToStudy = async () => {
    if (!wordData?.voc_id || !wordData?.token) return;
    try {
      await addWordsToStudy([wordData.voc_id], false, wordData.token);
      showToast('加入学习成功', 'success');
      addLog(`加入学习成功: ${wordData.word}`, 'success');
    } catch {
      showToast('加入学习失败', 'error');
      addLog(`加入学习失败: ${wordData.word}`, 'error');
    }
  };

  const handleAddToNotepad = async (notepadId: string) => {
    if (!wordData?.voc_id || !wordData?.token) return;
    try {
      const result = await addWordsToNotepad(notepadId, [wordData.voc_id], wordData.token);
      const addedCount = result?.data?.added_count || 0;
      const existCount = result?.data?.exist_count || 0;
      
      if (addedCount > 0) {
        showToast('添加到词本成功', 'success');
        addLog(`添加到词本成功: ${wordData.word}`, 'success');
      } else if (existCount > 0) {
        showToast('该单词已存在于词本中', 'info');
        addLog(`单词已存在: ${wordData.word}`, 'info');
      }
    } catch {
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

      {/* 内容区 - 可滚动 */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {/* 词形变化 */}
        {wordData.word_forms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {wordData.word_forms.map((wf, idx) => (
              <span key={idx} className="text-xs text-ink-600 bg-ink-50 px-2 py-1 rounded">
                {wf.form} <span className="font-medium">{wf.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* 释义 */}
        <div className="space-y-2">
          {wordData.definitions.length > 0 ? (
            wordData.definitions.map((def, idx) => (
              <div key={idx} className="bg-ink-50 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-700 leading-relaxed">{def}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">暂无释义</p>
          )}
        </div>

        {/* 例句（双语） */}
        {wordData.examples.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">例句</p>
            <div className="space-y-2">
              {wordData.examples.map((ex, idx) => (
                <div key={idx} className="border-l-2 border-ink-200 pl-3 py-1">
                  <p className="text-sm text-gray-700">{ex.sentence}</p>
                  <p className="text-xs text-gray-500 mt-1">{ex.translation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 网络释义 */}
        {wordData.web_translations.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">网络释义</p>
            <div className="flex flex-wrap gap-2">
              {wordData.web_translations.map((trans, idx) => (
                <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {trans}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 同反义词 */}
        {(wordData.synonyms.length > 0 || wordData.antonyms.length > 0) && (
          <div className="space-y-2">
            {wordData.synonyms.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">同义词</p>
                <p className="text-sm text-gray-600">{wordData.synonyms.join(', ')}</p>
              </div>
            )}
            {wordData.antonyms.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">反义词</p>
                <p className="text-sm text-gray-600">{wordData.antonyms.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Toast 提示 */}
      {toast.visible && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white pointer-events-none transition-opacity duration-300 ${
          toast.type === 'success' ? 'bg-ink-700' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        } ${toast.visible ? 'opacity-100' : 'opacity-0'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
