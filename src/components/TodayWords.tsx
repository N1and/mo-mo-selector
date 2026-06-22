import { useWordStore } from '../stores';

export function HistoryWords() {
  const { getTodayWords, clearRecentWords } = useWordStore();
  const words = getTodayWords();

  const handleClick = (spelling: string) => {
    navigator.clipboard.writeText(spelling);
    window.dispatchEvent(new Event('app:refresh-lookup'));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="banner flex items-center justify-between mb-6">
        <div>
          <h2 className="banner-title">历史查询</h2>
          <p className="banner-desc">点击单词可再次查询</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="banner-info">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {words.length} 个
          </span>
          {words.length > 0 && (
            <button onClick={clearRecentWords} className="banner-btn">
              清空
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 card overflow-hidden">
        {words.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">暂无查询记录</p>
        ) : (
          <ul className="divide-y divide-gray-200 overflow-y-auto h-full">
            {words.map((word) => (
              <li
                key={word.id}
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleClick(word.spelling)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-base">{word.spelling}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(word.addedAt).toLocaleDateString()} {new Date(word.addedAt).toLocaleTimeString()}
                  </span>
                </div>
                {word.definitions && word.definitions.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {word.definitions.slice(0, 3).map((def, idx) => (
                      <p key={idx} className="text-sm text-gray-500 leading-relaxed">
                        {def}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
