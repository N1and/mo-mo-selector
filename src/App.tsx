import { useState, useEffect } from "react";
import { Monitor, NotepadManager, Settings, WordLookup, Toast } from "./components";
import { useSettingsStore } from "./stores";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<"monitor" | "notepads" | "settings">("monitor");
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 全局提示 */}
      <Toast />

      {/* 全局快捷键弹窗 */}
      <WordLookup />

      {/* 侧边栏 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">墨墨单词助手</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab("monitor")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "monitor"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                划词监控
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("notepads")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "notepads"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                词本管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "settings"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                设置
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === "monitor" && <Monitor />}
        {activeTab === "notepads" && <NotepadManager />}
        {activeTab === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default App;
