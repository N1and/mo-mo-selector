import { useEffect, useState, useRef } from 'react';
import { addWordsToStudy, addWordsToNotepad, getNotepads, closePopupWindow } from '../lib/tauri';

interface WordData {
  word: string;
  definitions: string[];
  phonetic: string;
  uk_phonetic: string;
  voc_id: string;
  token: string;
}

interface Notepad {
  id: string;
  title: string;
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

    // 点击外部关闭
    const handleBlur = () => {
      setTimeout(() => closePopupWindow(), 150);
    };
    window.addEventListener('blur', handleBlur);

    // 从 URL hash 解析数据
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      const wordParam = params.get('word');
      if (wordParam) {
        const data: WordData = {
          word: wordParam,
          definitions: JSON.parse(params.get('definitions') || '[]'),
          phonetic: params.get('phonetic') || '',
          uk_phonetic: params.get('uk_phonetic') || '',
          voc_id: params.get('voc_id') || '',
          token: params.get('token') || '',
        };
        setWordData(data);
        // 加载词本列表
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
    } catch {
      setMessage('添加失败');
    }
  };

  const handleAddToNotepad = async (notepadId: string) => {
    if (!wordData?.voc_id || !wordData?.token) return;
    try {
      await addWordsToNotepad(notepadId, [wordData.voc_id], wordData.token);
      setMessage('已添加到词本');
    } catch {
      setMessage('添加失败');
    }
  };

  if (!wordData) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full bg-white select-none flex flex-col">
      {/* 标题栏 - 可拖动 */}
      <div
        className="shrink-0 bg-gray-50 border-b px-4 py-2 flex items-center justify-between"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{wordData.word}</span>
          {wordData.uk_phonetic && (
            <span className="text-gray-500 text-sm">英 [{wordData.uk_phonetic}]</span>
          )}
          {wordData.phonetic && (
            <span className="text-gray-500 text-sm">美 [{wordData.phonetic}]</span>
          )}
        </div>
        <button
          onClick={() => closePopupWindow()}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
        >
          ×
        </button>
      </div>

      {/* 释义内容 - 可滚动 */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {wordData.definitions.length > 0 ? (
          <div className="space-y-2">
            {wordData.definitions.map((def, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm leading-relaxed">
                {def}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic">暂无释义</p>
        )}
      </div>

      {/* 底部按钮 */}
      <div
        className="shrink-0 border-t px-4 py-2 flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {message ? (
          <span className="text-green-600 text-sm">{message}</span>
        ) : (
          <>
            {wordData.voc_id && (
              <button
                onClick={handleAddToStudy}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
              >
                加入学习
              </button>
            )}
            {wordData.voc_id && notepads.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowNotepadPicker(!showNotepadPicker)}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                >
                  添加到词本
                </button>
                {showNotepadPicker && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg py-1 w-48 max-h-40 overflow-y-auto z-50">
                    {notepads.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          handleAddToNotepad(n.id);
                          setShowNotepadPicker(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
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
      </div>
    </div>
  );
}
