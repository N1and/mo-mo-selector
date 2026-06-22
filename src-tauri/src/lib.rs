// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    #[serde(default)]
    pub maimemo_token: String,
    #[serde(default)]
    pub selected_notepad_id: String,
    #[serde(default = "default_auto_start")]
    pub auto_start: bool,
    #[serde(default = "default_hotkey")]
    pub hotkey: String,
}

fn default_auto_start() -> bool { false }
fn default_hotkey() -> String { "Ctrl+Shift+A".to_string() }

impl Default for Settings {
    fn default() -> Self {
        Self {
            maimemo_token: String::new(),
            selected_notepad_id: String::new(),
            auto_start: false,
            hotkey: "Ctrl+Shift+A".to_string(),
        }
    }
}

fn get_settings_path(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app.path().app_config_dir().unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    let path = get_settings_path(&app);
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let settings: Settings = serde_json::from_str(&data).map_err(|e| e.to_string())?;
        Ok(settings)
    } else {
        Ok(Settings::default())
    }
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let path = get_settings_path(&app);
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard().read_text().map_err(|e| e.to_string())
}

#[tauri::command]
async fn check_vocabulary(spelling: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("https://open.maimemo.com/open/api/v1/vocabulary?spelling={}", spelling))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    response.json::<serde_json::Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_notepads(token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://open.maimemo.com/open/api/v1/notepads")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    response.json::<serde_json::Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_words_to_notepad(notepad_id: String, voc_ids: Vec<String>, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({ "voc_ids": voc_ids });
    let response = client
        .post(format!("https://open.maimemo.com/open/api/v1/notepads/{}/words", notepad_id))
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    response.json::<serde_json::Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
fn get_cursor_position() -> Result<serde_json::Value, String> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            load_settings,
            save_settings,
            get_clipboard_text,
            check_vocabulary,
            get_notepads,
            add_words_to_notepad,
            get_cursor_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
