#[tauri::command]
pub async fn get_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard().read_text().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_cursor_position() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "windows")]
    {
        #[repr(C)]
        struct POINT {
            x: i32,
            y: i32,
        }

        extern "system" {
            fn GetCursorPos(lpPoint: *mut POINT) -> i32;
        }

        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            GetCursorPos(&mut point);
            Ok(serde_json::json!({ "x": point.x, "y": point.y }))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(serde_json::json!({ "x": 400, "y": 300 }))
    }
}
