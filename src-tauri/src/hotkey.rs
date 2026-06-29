use tauri::Manager;
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

pub fn parse_hotkey(hotkey_str: &str) -> Result<Shortcut, String> {
    let parts: Vec<String> = hotkey_str
        .split('+')
        .map(|p| p.trim().to_lowercase())
        .collect();
    let mut modifiers = Modifiers::empty();
    let mut key_code = None;

    for part in &parts {
        match part.as_ref() {
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" => modifiers |= Modifiers::ALT,
            "meta" | "super" | "win" | "cmd" | "command" => modifiers |= Modifiers::SUPER,
            key_str => {
                let code = match key_str {
                    "a" => Code::KeyA,
                    "b" => Code::KeyB,
                    "c" => Code::KeyC,
                    "d" => Code::KeyD,
                    "e" => Code::KeyE,
                    "f" => Code::KeyF,
                    "g" => Code::KeyG,
                    "h" => Code::KeyH,
                    "i" => Code::KeyI,
                    "j" => Code::KeyJ,
                    "k" => Code::KeyK,
                    "l" => Code::KeyL,
                    "m" => Code::KeyM,
                    "n" => Code::KeyN,
                    "o" => Code::KeyO,
                    "p" => Code::KeyP,
                    "q" => Code::KeyQ,
                    "r" => Code::KeyR,
                    "s" => Code::KeyS,
                    "t" => Code::KeyT,
                    "u" => Code::KeyU,
                    "v" => Code::KeyV,
                    "w" => Code::KeyW,
                    "x" => Code::KeyX,
                    "y" => Code::KeyY,
                    "z" => Code::KeyZ,
                    "0" => Code::Digit0,
                    "1" => Code::Digit1,
                    "2" => Code::Digit2,
                    "3" => Code::Digit3,
                    "4" => Code::Digit4,
                    "5" => Code::Digit5,
                    "6" => Code::Digit6,
                    "7" => Code::Digit7,
                    "8" => Code::Digit8,
                    "9" => Code::Digit9,
                    "space" => Code::Space,
                    "enter" | "return" => Code::Enter,
                    "tab" => Code::Tab,
                    "escape" | "esc" => Code::Escape,
                    "backspace" => Code::Backspace,
                    "delete" | "del" => Code::Delete,
                    "insert" | "ins" => Code::Insert,
                    "home" => Code::Home,
                    "end" => Code::End,
                    "pageup" | "page_up" => Code::PageUp,
                    "pagedown" | "page_down" => Code::PageDown,
                    "arrowup" | "up" => Code::ArrowUp,
                    "arrowdown" | "down" => Code::ArrowDown,
                    "arrowleft" | "left" => Code::ArrowLeft,
                    "arrowright" | "right" => Code::ArrowRight,
                    "f1" => Code::F1,
                    "f2" => Code::F2,
                    "f3" => Code::F3,
                    "f4" => Code::F4,
                    "f5" => Code::F5,
                    "f6" => Code::F6,
                    "f7" => Code::F7,
                    "f8" => Code::F8,
                    "f9" => Code::F9,
                    "f10" => Code::F10,
                    "f11" => Code::F11,
                    "f12" => Code::F12,
                    _ => return Err(format!("不支持的按键: {}", key_str)),
                };
                key_code = Some(code);
            }
        }
    }

    let code = key_code.ok_or("未指定按键")?;
    Ok(Shortcut::new(Some(modifiers), code))
}

#[tauri::command]
pub async fn register_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    let shortcut = parse_hotkey(&hotkey)?;
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let app_handle = app_handle.clone();
                std::thread::spawn(move || {
                    #[cfg(target_os = "windows")]
                    unsafe {
                        extern "system" {
                            fn keybd_event(
                                bVk: u8,
                                bScan: u8,
                                dwFlags: u32,
                                dwExtraInfo: usize,
                            );
                        }
                        keybd_event(0x11, 0, 0, 0); // Ctrl down
                        keybd_event(0x43, 0, 0, 0); // C down
                        std::thread::sleep(std::time::Duration::from_millis(30));
                        keybd_event(0x43, 0, 0x0002, 0); // C up
                        keybd_event(0x11, 0, 0x0002, 0); // Ctrl up
                        std::thread::sleep(std::time::Duration::from_millis(80));
                    }
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.eval("window.dispatchEvent(new Event('global-shortcut-triggered'))");
                    }
                });
            }
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn unregister_all_hotkeys(app: tauri::AppHandle) -> Result<(), String> {
    // 忽略"没有注册热键"的错误
    let _ = app.global_shortcut().unregister_all();
    Ok(())
}
