import { useWordStore, useSettingsStore } from '../stores';

export function Monitor() {
  const { currentWord, logs, clearLogs } = useWordStore();
  const { settings } = useSettingsStore();

  return (
    <div className="h-full flex flex-col">
      <div className="banner flex items-center justify-between mb-6">
        <div>
          <h2 className="banner-title">划词监控</h2>
          <p className="banner-desc">按快捷键查词，自动弹窗显示释义</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="banner-info">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {settings.hotkey}
          </span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600">当前单词</p>
          <button
            onClick={() => {
              window.dispatchEvent(new Event('app:refresh-current-word'));
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="刷新当前单词"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {currentWord ? (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xl font-bold">{currentWord.spelling}</p>
          </div>
        ) : (
          <p className="text-gray-400 italic">按下快捷键后显示</p>
        )}
      </div>

      <div className="flex-1 flex flex-col card overflow-hidden">
        <div className="flex items-center justify-between border-b">
          <h3 className="font-semibold py-3">运行日志</h3>
          <button
            onClick={clearLogs}
            className="text-sm text-gray-500 hover:text-gray-700 py-3"
          >
            清空
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center">暂无日志</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`py-1 border-b border-gray-100 last:border-0 ${
                  log.type === 'error'
                    ? 'text-red-600'
                    : log.type === 'success'
                    ? 'text-green-600'
                    : 'text-gray-700'
                }`}
              >
                <span className="text-gray-400 mr-2">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
