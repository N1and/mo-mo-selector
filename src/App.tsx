import { useState, useEffect } from "react";
import { Monitor, HistoryWords, NotepadManager, Settings, WordLookup, Toast } from "./components";
import { useSettingsStore } from "./stores";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<"monitor" | "history" | "notepads" | "settings">("monitor");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { loadSettings, settings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const navItems = [
    { key: "monitor" as const, label: "划词监控", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
    { key: "history" as const, label: "历史查询", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "notepads" as const, label: "词本管理", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { key: "settings" as const, label: "设置", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-body">
      <Toast />
      <WordLookup />

      {/* 左侧导航栏 */}
      <aside className={`${sidebarCollapsed ? 'w-12' : 'w-56'} bg-ink flex flex-col transition-all duration-300`}>
        {/* 应用标识区 */}
        <div className={`${sidebarCollapsed ? 'py-4' : 'py-6'} border-b border-white/20 relative`}>
          {!sidebarCollapsed && (
            <div className="flex items-center px-4" style={{ textAlign: 'center' }}>
              <h1 className="text-2xl font-bold text-white w-full">墨墨单词助手</h1>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* 导航菜单区 */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => setActiveTab(item.key)}
                  className={activeTab === item.key ? "nav-item-active" : "nav-item"}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={sidebarCollapsed ? { justifyContent: 'center', padding: '10px 0', width: '40px', marginLeft: '4px', height: '40px' } : undefined}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 状态摘要区 */}
        {!sidebarCollapsed && (
          <div className="py-4 border-t border-white/20">
            <div className="flex items-center justify-center gap-2 font-bold text-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  settings?.maimemoToken ? "bg-success" : "bg-white/40"
                }`}
              />
              <span className="text-body">{settings?.maimemoToken ? "墨墨已连接" : "未连接墨墨"}</span>
            </div>
          </div>
        )}
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === "monitor" && <Monitor />}
        {activeTab === "history" && <HistoryWords />}
        {activeTab === "notepads" && <NotepadManager />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
}

export default App;
