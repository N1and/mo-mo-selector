import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PopupWindow } from "./components/PopupWindow";

// 检查是否是弹窗窗口
const isPopup = window.location.hash.startsWith("#/popup");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isPopup ? <PopupWindow /> : <App />}
  </React.StrictMode>,
);
