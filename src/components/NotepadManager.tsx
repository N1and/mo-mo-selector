import { useEffect, useState } from 'react';
import { useNotepadStore, useSettingsStore, useWordStore, useToastStore } from '../stores';
import { getNotepads, createNotepad, deleteNotepad, updateNotepad } from '../lib/tauri';
import { NotepadViewer } from './NotepadViewer';

export function NotepadManager() {
  const { notepads, selectedNotepad, isLoading, setNotepads, setLoading, addNotepad, removeNotepad, updateNotepad: updateNotepadInStore } = useNotepadStore();
  const { settings } = useSettingsStore();
  const { addLog } = useWordStore();
  const showToast = useToastStore((s) => s.show);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewingNotepadId, setViewingNotepadId] = useState<string | null>(null);
  const [editingNotepad, setEditingNotepad] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBrief, setNewBrief] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allTags = [...new Set(notepads.flatMap((n) => n.tags || []))].sort();
  const filteredNotepads = filterTag
    ? notepads.filter((n) => n.tags?.includes(filterTag))
    : notepads;

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
      if (result?.data?.notepads) {
        setNotepads(result.data.notepads);
        showToast(`加载词本列表成功: ${result.data.notepads.length} 个`, 'success');
        addLog(`加载词本列表成功: ${result.data.notepads.length} 个`, 'success');
      }
    } catch (error) {
      console.error('Failed to load notepads:', error);
      showToast('加载词本列表失败', 'error');
      addLog(`加载词本列表失败: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const PREDEFINED_TAGS = [
    '小学', '初中', '高中', '大学教科书',
    '四级', '六级', '专四', '专八', '考研',
    '新概念', 'SAT', '托福', '雅思', 'GRE',
    'GMAT', '托业', 'BEC', '词典', '词频', '其他',
  ];

  const handleCreateNotepad = async () => {
    if (!newTitle.trim()) return;
    if (!settings.maimemoToken) return;

    setIsCreating(true);
    try {
      const result = await createNotepad(
        newTitle.trim(),
        newBrief.trim(),
        newTags,
        newContent.trim() || ' ',
        settings.maimemoToken
      );
      if (result?.data?.notepad) {
        addNotepad(result.data.notepad);
        showToast('创建词本成功', 'success');
        addLog(`创建词本成功: ${newTitle.trim()}`, 'success');
        setShowCreateModal(false);
        setNewTitle('');
        setNewBrief('');
        setNewTags([]);
        setNewContent('');
      }
    } catch (error) {
      console.error('Failed to create notepad:', error);
      showToast('创建词本失败', 'error');
      addLog(`创建词本失败: ${newTitle.trim()}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditNotepad = async () => {
    if (!editingNotepad || !newTitle.trim()) return;
    if (!settings.maimemoToken) return;

    setIsEditing(true);
    try {
      const result = await updateNotepad(
        editingNotepad.id,
        newTitle.trim(),
        newBrief.trim(),
        newTags,
        newContent.trim() || ' ',
        settings.maimemoToken
      );
      if (result?.data?.notepad) {
        updateNotepadInStore(editingNotepad.id, result.data.notepad);
        showToast('修改词本成功', 'success');
        addLog(`修改词本成功: ${newTitle.trim()}`, 'success');
        setShowEditModal(false);
        setEditingNotepad(null);
        setNewTitle('');
        setNewBrief('');
        setNewTags([]);
        setNewContent('');
      }
    } catch (error) {
      console.error('Failed to update notepad:', error);
      showToast('修改词本失败', 'error');
      addLog(`修改词本失败: ${newTitle.trim()}`, 'error');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || !settings.maimemoToken) return;

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个词本吗？`)) return;

    try {
      for (const id of selectedIds) {
        const notepad = notepads.find(n => n.id === id);
        await deleteNotepad(id, settings.maimemoToken);
        removeNotepad(id);
        showToast(`删除词本成功: ${notepad?.title || id}`, 'success');
        addLog(`删除词本成功: ${notepad?.title || id}`, 'success');
      }
      setSelectedIds(new Set());
      setIsManageMode(false);
    } catch (error) {
      console.error('Failed to delete notepads:', error);
      showToast('删除词本失败', 'error');
      addLog(`删除词本失败: ${error}`, 'error');
    }
  };

  const toggleSelectNotepad = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNotepads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotepads.map(n => n.id)));
    }
  };

  const openEditModal = (notepad: any) => {
    setEditingNotepad(notepad);
    setNewTitle(notepad.title || '');
    setNewBrief(notepad.brief || '');
    setNewTags(notepad.tags || []);
    setNewContent(notepad.content || '');
    setShowEditModal(true);
  };

  const toggleTag = (tag: string) => {
    setNewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      <div className="banner flex items-center justify-between">
        <div>
          <h2 className="banner-title">词本管理</h2>
          <p className="banner-desc">管理你的词本，添加、编辑、删除词本</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="banner-info">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {notepads.length} 个词本
          </span>
          {notepads.length > 0 && (
            <button
              onClick={() => {
                setIsManageMode(!isManageMode);
                setSelectedIds(new Set());
              }}
              className="banner-btn"
            >
              {isManageMode ? '退出管理' : '管理'}
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="banner-btn"
          >
            新建词本
          </button>
        </div>
      </div>

      {isManageMode && (
        <div className="flex items-center gap-4 p-3 bg-ink-50 rounded-card border border-ink-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredNotepads.length && filteredNotepads.length > 0}
              onChange={selectAll}
              className="w-4 h-4 text-ink rounded focus:ring-ink"
            />
            <span className="text-body font-medium">全选</span>
          </label>
          <span className="text-body text-gray-500">
            已选 {selectedIds.size} / {filteredNotepads.length}
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="btn-danger text-sm"
          >
            删除选中
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : notepads.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">暂无词本，请创建新词本</p>
        </div>
      ) : (
        <>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTag(null)}
                className={filterTag === null ? "tag-active" : "tag"}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={filterTag === tag ? "tag-active" : "tag"}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotepads.map((notepad) => (
            <div
              key={notepad.id}
              className={`card cursor-pointer transition-all ${
                selectedNotepad?.id === notepad.id && !isManageMode
                  ? 'card-active'
                  : ''
              } ${selectedIds.has(notepad.id) ? 'ring-2 ring-ink bg-ink-50' : ''}`}
              onClick={() => {
                if (isManageMode) {
                  toggleSelectNotepad(notepad.id);
                } else {
                  setViewingNotepadId(notepad.id);
                  setShowViewer(true);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2 truncate">{notepad.title}</h3>
                  {notepad.brief && (
                    <p className="text-gray-600 text-body mb-2 line-clamp-2">{notepad.brief}</p>
                  )}
                </div>
                {isManageMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notepad.id)}
                    onChange={() => toggleSelectNotepad(notepad.id)}
                    className="w-5 h-5 text-ink rounded focus:ring-ink ml-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
              <div className="flex justify-between items-center text-body text-gray-500">
                <span>{notepad.updated_time ? new Date(notepad.updated_time).toLocaleDateString() : ''}</span>
                {!isManageMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(notepad);
                    }}
                    className="text-ink hover:text-ink-light text-body"
                  >
                    编辑
                  </button>
                )}
              </div>
              {notepad.tags && notepad.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {notepad.tags.map((tag, index) => (
                    <span key={index} className="tag text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-[560px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">新建词本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  词本名称 *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                  placeholder="输入词本名称"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  描述 *
                </label>
                <textarea
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  className="textarea"
                  rows={2}
                  placeholder="词本描述"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={newTags.includes(tag) ? "tag-outline-active" : "tag-outline"}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  词本正文
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="textarea"
                  rows={4}
                  placeholder="每行一个单词"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTitle('');
                  setNewBrief('');
                  setNewTags([]);
                  setNewContent('');
                }}
                className="btn-text"
              >
                取消
              </button>
              <button
                onClick={handleCreateNotepad}
                disabled={!newTitle.trim() || !newBrief.trim() || isCreating}
                className="btn-primary"
              >
                {isCreating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingNotepad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-[560px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">编辑词本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  词本名称 *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                  placeholder="输入词本名称"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  描述 *
                </label>
                <textarea
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  className="textarea"
                  rows={2}
                  placeholder="词本描述"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={newTags.includes(tag) ? "tag-outline-active" : "tag-outline"}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-body font-medium text-gray-700 mb-1">
                  词本正文
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="textarea"
                  rows={4}
                  placeholder="每行一个单词"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNotepad(null);
                  setNewTitle('');
                  setNewBrief('');
                  setNewTags([]);
                  setNewContent('');
                }}
                className="btn-text"
              >
                取消
              </button>
              <button
                onClick={handleEditNotepad}
                disabled={!newTitle.trim() || !newBrief.trim() || isEditing}
                className="btn-primary"
              >
                {isEditing ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewer && viewingNotepadId && (
        <NotepadViewer
          notepadId={viewingNotepadId}
          onClose={() => {
            setShowViewer(false);
            setViewingNotepadId(null);
          }}
        />
      )}
    </div>
  );
}
