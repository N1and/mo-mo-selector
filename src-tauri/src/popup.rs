use tauri::Manager;

#[tauri::command]
pub async fn show_popup_window(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
    word: String,
    definitions: Vec<String>,
    examples: Vec<serde_json::Value>,
    phonetic: String,
    uk_phonetic: String,
    voc_id: String,
    token: String,
    word_forms: Vec<serde_json::Value>,
    web_translations: Vec<String>,
    synonyms: Vec<String>,
    antonyms: Vec<String>,
) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;

    // 如果已存在popup窗口，先关闭
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.destroy();
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }

    let popup_width = 400.0;
    let popup_height = 500.0;

    // 通过 URL 参数传递数据（本地桌面应用，不存在外部泄露风险）
    let defs_json = serde_json::to_string(&definitions).unwrap_or_default();
    let examples_json = serde_json::to_string(&examples).unwrap_or_default();
    let word_forms_json = serde_json::to_string(&word_forms).unwrap_or_default();
    let web_trans_json = serde_json::to_string(&web_translations).unwrap_or_default();
    let synonyms_json = serde_json::to_string(&synonyms).unwrap_or_default();
    let antonyms_json = serde_json::to_string(&antonyms).unwrap_or_default();

    let url = format!(
        "index.html#/popup?word={}&definitions={}&examples={}&phonetic={}&uk_phonetic={}&voc_id={}&token={}&word_forms={}&web_translations={}&synonyms={}&antonyms={}",
        urlencoding::encode(&word),
        urlencoding::encode(&defs_json),
        urlencoding::encode(&examples_json),
        urlencoding::encode(&phonetic),
        urlencoding::encode(&uk_phonetic),
        urlencoding::encode(&voc_id),
        urlencoding::encode(&token),
        urlencoding::encode(&word_forms_json),
        urlencoding::encode(&web_trans_json),
        urlencoding::encode(&synonyms_json),
        urlencoding::encode(&antonyms_json)
    );

    let popup = WebviewWindowBuilder::new(&app, "popup", WebviewUrl::App(url.into()))
        .title(&word)
        .inner_size(popup_width, popup_height)
        .position(x - popup_width / 2.0, y - popup_height / 2.0)
        .decorations(false)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .build()
        .map_err(|e| e.to_string())?;

    let _ = popup.set_focus();

    let app_handle = app.clone();
    let title_utf16: Vec<u16> = word.encode_utf16().chain(std::iter::once(0)).collect();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        #[cfg(target_os = "windows")]
        unsafe {
            extern "system" {
                fn FindWindowW(className: *const u16, windowName: *const u16) -> *mut std::ffi::c_void;
                fn GetForegroundWindow() -> *mut std::ffi::c_void;
            }
            let popup_hwnd = FindWindowW(std::ptr::null(), title_utf16.as_ptr()) as usize;
            if popup_hwnd == 0 {
                return;
            }
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                let foreground = GetForegroundWindow() as usize;
                if foreground != 0 && foreground != popup_hwnd {
                    if let Some(w) = app_handle.get_webview_window("popup") {
                        let _ = w.close();
                    }
                    break;
                }
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                if let Some(w) = app_handle.get_webview_window("popup") {
                    if let Ok(false) = w.is_focused() {
                        let _ = w.close();
                        break;
                    }
                } else {
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn close_popup_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.destroy();
    }
    Ok(())
}
