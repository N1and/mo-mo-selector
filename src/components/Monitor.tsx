import { useWordStore, useSettingsStore } from '../stores';

export function Monitor() {
  const { currentWord, recentWords } = useWordStore();
  const { settings } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">划词监控</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">快捷键：</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
            {settings.hotkey}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600 mb-2">使用方法：</p>
        <ol className="list-decimal list-inside text-gray-700 space-y-1">
          <li>复制一个英文单词</li>
          <li>按下快捷键 <span className="font-mono bg-gray-100 px-1">{settings.hotkey}</span></li>
          <li>在鼠标位置显示释义</li>
          <li>点击「添加到词本」</li>
        </ol>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600 mb-2">当前单词：</p>
        {currentWord ? (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xl font-bold">{currentWord.spelling}</p>
          </div>
        ) : (
          <p className="text-gray-400 italic">按下快捷键后显示</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">最近查询</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {recentWords.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">暂无记录</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentWords.map((word) => (
                <li key={word.id} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{word.spelling}</span>
                    <span className="text-sm text-gray-500">
                      {word.addedAt.toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
