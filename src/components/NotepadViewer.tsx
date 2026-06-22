import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores';
import { getNotepadDetail, getWordDetails, lookupDictionary, addWordsToStudy } from '../lib/tauri';

interface NotepadViewerProps {
  notepadId: string;
  onClose: () => void;
}

interface WordDetail {
  spelling: string;
  voc_id: string;
  interpretations: any[];
  notes: any[];
  phrases: any[];
}

interface DictionaryData {
  word: string;
  phonetic: string;
  uk_phonetic: string;
  definitions: string[];
  examples: { sentence: string; translation: string }[];
  word_forms: { form: string; value: string }[];
}

export function NotepadViewer({ notepadId, onClose }: NotepadViewerProps) {
  const { settings } = useSettingsStore();
  const [notepad, setNotepad] = useState<any>(null);
  const [words, setWords] = useState<string[]>([]);
  const [wordDetails, setWordDetails] = useState<WordDetail[]>([]);
  const [dictData, setDictData] = useState<DictionaryData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingDict, setIsLoadingDict] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  useEffect(() => {
    loadNotepad();
  }, [notepadId]);

  useEffect(() => {
    if (words.length > 0) {
      loadWordDetails();
    }
  }, [words]);

  useEffect(() => {
    if (currentWord?.spelling) {
      loadDictionary(currentWord.spelling);
    }
  }, [selectedIndex, wordDetails]);

  const loadNotepad = async () => {
    if (!settings.maimemoToken) return;
    
    setIsLoading(true);
    try {
      const result = await getNotepadDetail(notepadId, settings.maimemoToken);
      if (result?.data?.notepad) {
        setNotepad(result.data.notepad);
        const content = result.data.notepad.content || '';
        const wordList = content.split('\n').filter((w: string) => w.trim());
        setWords(wordList);
      }
    } catch (error) {
      console.error('Failed to load notepad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWordDetails = async () => {
    if (!settings.maimemoToken || words.length === 0) return;
    
    setIsLoadingDetails(true);
    try {
      const result = await getWordDetails(words, settings.maimemoToken);
      if (result?.data?.words) {
        setWordDetails(result.data.words);
      }
    } catch (error) {
      console.error('Failed to load word details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadDictionary = async (word: string) => {
    setIsLoadingDict(true);
    setDictData(null);
    try {
      const result = await lookupDictionary(word);
      if (result?.data) {
        setDictData(result.data);
      }
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    } finally {
      setIsLoadingDict(false);
    }
  };

  const handleAddToStudy = async () => {
    if (!currentWord?.voc_id) return;
    
    setIsAdding(true);
    setAddMessage('');
    try {
      await addWordsToStudy([currentWord.voc_id], false, settings.maimemoToken);
      setAddMessage('已添加到学习列表');
      setTimeout(() => setAddMessage(''), 2000);
    } catch (error) {
      console.error('Failed to add to study:', error);
      setAddMessage('添加失败');
      setTimeout(() => setAddMessage(''), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  const currentWord = wordDetails[selectedIndex];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="card p-8">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-card w-[90vw] h-[85vh] flex overflow-hidden">
        {/* 左侧边栏 - 单词列表 */}
        <div className="w-64 bg-gray-50 border-r flex flex-col">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg truncate">{notepad?.title || '词本'}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
              >
                ×
              </button>
            </div>
            {notepad?.brief && (
              <p className="text-body text-gray-500 truncate">{notepad.brief}</p>
            )}
            <p className="text-caption text-gray-400 mt-1">{words.length} 个单词</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {words.map((word, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                  selectedIndex === index
                    ? 'bg-ink text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className={`font-medium ${selectedIndex === index ? 'text-white' : 'text-gray-800'}`}>
                  {word}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧内容区 - 单词详情 */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">加载单词详情中...</p>
            </div>
          ) : currentWord ? (
            <div className="p-6">
              {/* 单词标题 */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-800">{currentWord.spelling}</h2>
                  <div className="flex items-center gap-2">
                    {addMessage && (
                      <span className={`text-body ${addMessage.includes('失败') ? 'text-error' : 'text-success'}`}>
                        {addMessage}
                      </span>
                    )}
                    <button
                      onClick={handleAddToStudy}
                      disabled={isAdding || !currentWord.voc_id}
                      className="btn-primary text-sm"
                    >
                      {isAdding ? '添加中...' : '加入学习'}
                    </button>
                  </div>
                </div>
                
                {/* 音标 */}
                {dictData && (dictData.phonetic || dictData.uk_phonetic) && (
                  <div className="mt-2 flex gap-4 text-gray-500">
                    {dictData.uk_phonetic && (
                      <span>英 [{dictData.uk_phonetic}]</span>
                    )}
                    {dictData.phonetic && (
                      <span>美 [{dictData.phonetic}]</span>
                    )}
                  </div>
                )}
                
                {/* 词形变化 */}
                {dictData?.word_forms && dictData.word_forms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dictData.word_forms.map((wf, idx) => (
                      <span key={idx} className="text-body text-gray-500">
                        {wf.form}: <span className="text-gray-700">{wf.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 词典释义 */}
              {dictData?.definitions && dictData.definitions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-body font-semibold text-gray-500 uppercase mb-3">释义</h4>
                  <div className="space-y-2">
                    {dictData.definitions.map((def, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-card">
                        <p className="text-gray-800">{def}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 例句 */}
              {dictData?.examples && dictData.examples.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-body font-semibold text-gray-500 uppercase mb-3">例句</h4>
                  <div className="space-y-3">
                    {dictData.examples.map((ex, idx) => (
                      <div key={idx} className="p-3 bg-ink-50 rounded-card">
                        <p className="text-gray-800 font-medium">{ex.sentence}</p>
                        <p className="text-gray-600 text-body mt-1">{ex.translation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 加载提示 */}
              {isLoadingDict && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-body">加载词典数据中...</p>
                </div>
              )}

              {/* 墨墨自定义内容 */}
              {currentWord.interpretations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-body font-semibold text-gray-500 uppercase mb-3">我的释义</h4>
                  <div className="space-y-2">
                    {currentWord.interpretations.map((interp: any, idx: number) => (
                      <div key={idx} className="p-3 bg-ink-50 rounded-card">
                        <p className="text-gray-800">{interp.interpretation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentWord.notes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-body font-semibold text-gray-500 uppercase mb-3">我的助记</h4>
                  <div className="space-y-2">
                    {currentWord.notes.map((note: any, idx: number) => (
                      <div key={idx} className="p-3 bg-warning/10 rounded-card">
                        <span className="text-warning font-medium text-body mr-2">[{note.note_type}]</span>
                        <span className="text-gray-800">{note.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentWord.phrases.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-body font-semibold text-gray-500 uppercase mb-3">我的例句</h4>
                  <div className="space-y-3">
                    {currentWord.phrases.map((phrase: any, idx: number) => (
                      <div key={idx} className="p-3 bg-ink-100 rounded-card">
                        <p className="text-gray-800 font-medium">{phrase.phrase}</p>
                        <p className="text-gray-600 text-body mt-1">{phrase.interpretation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 导航按钮 */}
              <div className="flex justify-between mt-8 pt-4 border-t">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="btn-text"
                >
                  ← 上一个
                </button>
                <span className="text-gray-500 text-body self-center">
                  {selectedIndex + 1} / {words.length}
                </span>
                <button
                  onClick={() => setSelectedIndex(Math.min(words.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === words.length - 1}
                  className="btn-primary"
                >
                  下一个 →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">选择一个单词查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
