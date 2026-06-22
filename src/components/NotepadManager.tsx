import { useEffect, useState } from 'react';
import { useNotepadStore, useSettingsStore } from '../stores';
import { getNotepads } from '../lib/tauri';

export function NotepadManager() {
  const { notepads, selectedNotepad, isLoading, setNotepads, setSelectedNotepad, setLoading } = useNotepadStore();
  const { settings } = useSettingsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadNotepads();
  }, []);

  const loadNotepads = async () => {
    if (!settings.maimemoToken) {
      console.log('No token configured');
      return;
    }

    setLoading(true);
    try {
      const result = await getNotepads(settings.maimemoToken);
      if (result?.data) {
        setNotepads(result.data);
      }
    } catch (error) {
      console.error('Failed to load notepads:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">词本管理</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          新建词本
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : notepads.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">暂无词本，请创建新词本</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notepads.map((notepad) => (
            <div
              key={notepad.id}
              className={`p-4 bg-white rounded-lg shadow cursor-pointer transition-all hover:shadow-md ${
                selectedNotepad?.id === notepad.id
                  ? 'ring-2 ring-blue-500'
                  : ''
              }`}
              onClick={() => setSelectedNotepad(notepad)}
            >
              <h3 className="font-semibold text-lg mb-2">{notepad.title}</h3>
              {notepad.brief && (
                <p className="text-gray-600 text-sm mb-2">{notepad.brief}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{notepad.wordCount} 个单词</span>
                <span>{notepad.updatedAt.toLocaleDateString()}</span>
              </div>
              {notepad.tags && notepad.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {notepad.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">新建词本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  词本名称
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入词本名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="可选描述"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // TODO: 创建词本逻辑
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}