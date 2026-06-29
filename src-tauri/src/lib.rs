mod dictionary;
mod hotkey;
mod maimemo;
mod popup;
mod settings;
mod system;

use tauri::Manager;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::menu::{Menu, MenuItem};
use tauri_plugin_autostart::ManagerExt;

use settings::{get_settings_path, Settings};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // 同步开机自启动状态
            {
                let app_handle = app.handle().clone();
                let path = get_settings_path(&app_handle);
                if path.exists() {
                    if let Ok(data) = std::fs::read_to_string(&path) {
                        if let Ok(settings) = serde_json::from_str::<Settings>(&data) {
                            if settings.auto_start {
                                let _ = app_handle.autolaunch().enable();
                            } else {
                                let _ = app_handle.autolaunch().disable();
                            }
                        }
                    }
                }
            }

            // 创建托盘菜单
            let show_i =
                MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            // 创建系统托盘
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("MoMo Selector")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 阻止窗口关闭，改为隐藏到托盘
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            settings::load_settings,
            settings::save_settings,
            popup::show_popup_window,
            popup::close_popup_window,
            system::get_clipboard_text,
            maimemo::check_vocabulary,
            maimemo::create_notepad,
            maimemo::get_notepads,
            maimemo::add_words_to_notepad,
            maimemo::delete_notepad,
            maimemo::update_notepad,
            maimemo::get_notepad_detail,
            maimemo::get_word_details,
            maimemo::add_words_to_study,
            dictionary::lookup_dictionary,
            system::get_cursor_position,
            hotkey::register_hotkey,
            hotkey::unregister_all_hotkeys
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
