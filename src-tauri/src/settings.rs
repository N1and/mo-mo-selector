use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_autostart::ManagerExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
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

fn default_auto_start() -> bool {
    false
}

fn default_hotkey() -> String {
    "Ctrl+Shift+A".to_string()
}

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

pub fn get_settings_path(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

#[tauri::command]
pub fn load_settings(app: tauri::AppHandle) -> Result<Settings, String> {
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
pub fn save_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let path = get_settings_path(&app);
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())?;

    // 同步开机自启动状态（捕获 panic，不影响保存）
    let app_clone = app.clone();
    let auto_start = settings.auto_start;
    let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        if auto_start {
            let _ = app_clone.autolaunch().enable();
        } else {
            let _ = app_clone.autolaunch().disable();
        }
    }));

    Ok(())
}
