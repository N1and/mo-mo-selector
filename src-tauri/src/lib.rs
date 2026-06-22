// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
use tauri::menu::{Menu, MenuItem};


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
async fn show_popup_window(app: tauri::AppHandle, x: f64, y: f64, word: String, definitions: Vec<String>, examples: Vec<serde_json::Value>, phonetic: String, uk_phonetic: String, voc_id: String, token: String, word_forms: Vec<serde_json::Value>, web_translations: Vec<String>, synonyms: Vec<String>, antonyms: Vec<String>) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;
    
    // 如果已存在popup窗口，先关闭
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.destroy();
        // 等待窗口完全销毁
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
    
    let popup_width = 400.0;
    let popup_height = 500.0;
    
    let defs_json = serde_json::to_string(&definitions).unwrap_or_default();
    let examples_json = serde_json::to_string(&examples).unwrap_or_default();
    let word_forms_json = serde_json::to_string(&word_forms).unwrap_or_default();
    let web_trans_json = serde_json::to_string(&web_translations).unwrap_or_default();
    let synonyms_json = serde_json::to_string(&synonyms).unwrap_or_default();
    let antonyms_json = serde_json::to_string(&antonyms).unwrap_or_default();
    let encoded_word = urlencoding::encode(&word);
    let encoded_defs = urlencoding::encode(&defs_json);
    let encoded_examples = urlencoding::encode(&examples_json);
    let encoded_phonetic = urlencoding::encode(&phonetic);
    let encoded_uk = urlencoding::encode(&uk_phonetic);
    let encoded_voc_id = urlencoding::encode(&voc_id);
    let encoded_token = urlencoding::encode(&token);
    let encoded_word_forms = urlencoding::encode(&word_forms_json);
    let encoded_web_trans = urlencoding::encode(&web_trans_json);
    let encoded_synonyms = urlencoding::encode(&synonyms_json);
    let encoded_antonyms = urlencoding::encode(&antonyms_json);
    let url = format!(
        "index.html#/popup?word={}&definitions={}&examples={}&phonetic={}&uk_phonetic={}&voc_id={}&token={}&word_forms={}&web_translations={}&synonyms={}&antonyms={}",
        encoded_word, encoded_defs, encoded_examples, encoded_phonetic, encoded_uk, encoded_voc_id, encoded_token, encoded_word_forms, encoded_web_trans, encoded_synonyms, encoded_antonyms
    );
    
    WebviewWindowBuilder::new(
        &app,
        "popup",
        WebviewUrl::App(url.into()),
    )
    .title(&word)
    .inner_size(popup_width, popup_height)
    .position(x, y)
    .decorations(false)
    .resizable(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn close_popup_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.destroy();
    }
    Ok(())
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
    
    let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    // API 响应包裹在 data 字段中
    let result = data.get("data").unwrap_or(&data);
    Ok(serde_json::json!({ "data": result }))
}

#[tauri::command]
async fn create_notepad(title: String, brief: String, tags: Vec<String>, content: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let notepad = serde_json::json!({
        "title": title,
        "brief": brief,
        "tags": tags,
        "content": content,
        "status": "UNPUBLISHED"
    });
    let body = serde_json::json!({ "notepad": notepad });
    let response = client
        .post("https://open.maimemo.com/open/api/v1/notepads")
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    // API 响应包裹在 data 字段中
    let result = data.get("data").unwrap_or(&data);
    Ok(serde_json::json!({ "data": result }))
}

#[tauri::command]
async fn get_notepads(token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let auth_header = format!("Bearer {}", token);
    let mut all_notepads = Vec::new();
    let mut offset = 0;
    let limit = 10;
    
    loop {
        let url = format!("https://open.maimemo.com/open/api/v1/notepads?limit={}&offset={}", limit, offset);
        let response = client
            .get(&url)
            .header("Authorization", &auth_header)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        
        let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        
        // API 响应可能包裹在 data 字段中
        let notepads_data = data.get("data").unwrap_or(&data);
        
        if let Some(notepads) = notepads_data["notepads"].as_array() {
            if notepads.is_empty() {
                break;
            }
            all_notepads.extend(notepads.iter().cloned());
            if (notepads.len() as i64) < limit {
                break;
            }
            offset += limit;
        } else {
            break;
        }
    }
    
    Ok(serde_json::json!({ "data": { "notepads": all_notepads } }))
}

#[tauri::command]
async fn add_words_to_notepad(notepad_id: String, voc_ids: Vec<String>, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let auth_header = format!("Bearer {}", token);
    
    // 1. 获取词本详情
    let notepad_url = format!("https://open.maimemo.com/open/api/v1/notepads/{}", notepad_id);
    let notepad_resp = client
        .get(&notepad_url)
        .header("Authorization", &auth_header)
        .send()
        .await
        .map_err(|e| format!("获取词本失败: {}", e))?;
    
    let notepad_data: serde_json::Value = notepad_resp.json().await.map_err(|e| format!("解析词本数据失败: {}", e))?;
    let notepad_inner = notepad_data.get("data").unwrap_or(&notepad_data);
    let current_content = notepad_inner["notepad"]["content"].as_str().unwrap_or("");
    let title = notepad_inner["notepad"]["title"].as_str().unwrap_or("未命名词本");
    let brief = notepad_inner["notepad"]["brief"].as_str().unwrap_or("");
    let status = notepad_inner["notepad"]["status"].as_str().unwrap_or("UNPUBLISHED");
    let tags: Vec<String> = notepad_inner["notepad"]["tags"]
        .as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
        .unwrap_or_default();
    
    // 2. 获取每个单词的拼写
    let mut new_spellings = Vec::new();
    for voc_id in &voc_ids {
        let voc_url = format!("https://open.maimemo.com/open/api/v1/vocabulary/query");
        let body = serde_json::json!({ "ids": [voc_id] });
        let voc_resp = client
            .post(&voc_url)
            .header("Authorization", &auth_header)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await;
        
        if let Ok(resp) = voc_resp {
            if let Ok(voc_data) = resp.json::<serde_json::Value>().await {
                let voc_inner = voc_data.get("data").unwrap_or(&voc_data);
                if let Some(voc) = voc_inner["voc"].as_array().and_then(|arr| arr.first()) {
                    if let Some(spelling) = voc["spelling"].as_str() {
                        new_spellings.push(spelling.to_string());
                    }
                }
            }
        }
    }
    
    // 3. 将新单词追加到 content
    let mut words: Vec<&str> = current_content.lines().filter(|l| !l.trim().is_empty()).collect();
    let mut added_count = 0;
    let mut exist_count = 0;
    for spelling in &new_spellings {
        if words.contains(&spelling.as_str()) {
            exist_count += 1;
        } else {
            words.push(spelling);
            added_count += 1;
        }
    }
    let new_content = words.join("\n");
    
    // 4. 更新词本
    let update_body = serde_json::json!({
        "notepad": {
            "title": title,
            "brief": brief,
            "tags": tags,
            "content": new_content,
            "status": status
        }
    });
    
    let update_resp = client
        .post(&notepad_url)
        .header("Authorization", &auth_header)
        .header("Content-Type", "application/json")
        .json(&update_body)
        .send()
        .await
        .map_err(|e| format!("更新词本失败: {}", e))?;
    
    let result = update_resp.json::<serde_json::Value>().await.map_err(|e| format!("解析更新结果失败: {}", e))?;
    let result_inner = result.get("data").unwrap_or(&result);
    
    Ok(serde_json::json!({
        "data": {
            "success": true,
            "added_count": added_count,
            "exist_count": exist_count,
            "notepad": result_inner["notepad"]
        }
    }))
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

#[tauri::command]
async fn delete_notepad(notepad_id: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://open.maimemo.com/open/api/v1/notepads/{}", notepad_id);
    let _response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({ "data": { "success": true } }))
}

#[tauri::command]
async fn get_notepad_detail(notepad_id: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://open.maimemo.com/open/api/v1/notepads/{}", notepad_id);
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    let result = data.get("data").unwrap_or(&data);
    Ok(serde_json::json!({ "data": result }))
}

#[tauri::command]
async fn get_word_details(spellings: Vec<String>, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let auth_header = format!("Bearer {}", token);
    let mut words_details = Vec::new();
    
    for spelling in &spellings {
        // 1. 获取单词ID
        let voc_url = format!("https://open.maimemo.com/open/api/v1/vocabulary?spelling={}", spelling);
        let voc_resp = client
            .get(&voc_url)
            .header("Authorization", &auth_header)
            .send()
            .await;
        
        let voc_id = if let Ok(resp) = voc_resp {
            if let Ok(voc_data) = resp.json::<serde_json::Value>().await {
                let voc_inner = voc_data.get("data").unwrap_or(&voc_data);
                voc_inner["voc"]["id"].as_str().map(|s| s.to_string())
            } else {
                None
            }
        } else {
            None
        };
        
        let voc_id = match voc_id {
            Some(id) => id,
            None => continue,
        };
        
        // 2. 获取释义
        let interp_url = format!("https://open.maimemo.com/open/api/v1/interpretations?voc_id={}", voc_id);
        let interpretations = if let Ok(resp) = client.get(&interp_url).header("Authorization", &auth_header).send().await {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let inner = data.get("data").unwrap_or(&data);
                inner["interpretations"].as_array().cloned().unwrap_or_default()
            } else {
                vec![]
            }
        } else {
            vec![]
        };
        
        // 3. 获取助记
        let notes_url = format!("https://open.maimemo.com/open/api/v1/notes?voc_id={}", voc_id);
        let notes = if let Ok(resp) = client.get(&notes_url).header("Authorization", &auth_header).send().await {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let inner = data.get("data").unwrap_or(&data);
                inner["notes"].as_array().cloned().unwrap_or_default()
            } else {
                vec![]
            }
        } else {
            vec![]
        };
        
        // 4. 获取例句
        let phrases_url = format!("https://open.maimemo.com/open/api/v1/phrases?voc_id={}", voc_id);
        let phrases = if let Ok(resp) = client.get(&phrases_url).header("Authorization", &auth_header).send().await {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let inner = data.get("data").unwrap_or(&data);
                inner["phrases"].as_array().cloned().unwrap_or_default()
            } else {
                vec![]
            }
        } else {
            vec![]
        };
        
        words_details.push(serde_json::json!({
            "spelling": spelling,
            "voc_id": voc_id,
            "interpretations": interpretations,
            "notes": notes,
            "phrases": phrases
        }));
    }
    
    Ok(serde_json::json!({ "data": { "words": words_details } }))
}

#[tauri::command]
async fn add_words_to_study(voc_ids: Vec<String>, advance: bool, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = "https://open.maimemo.com/open/api/v1/study/add_words";
    
    let words: Vec<serde_json::Value> = voc_ids.iter().map(|id| {
        serde_json::json!({ "id": id })
    }).collect();
    
    let body = serde_json::json!({
        "words": words,
        "advance": advance
    });
    
    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    let result = data.get("data").unwrap_or(&data);
    Ok(serde_json::json!({ "data": result }))
}

#[tauri::command]
async fn lookup_dictionary(word: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    
    // 使用有道词典API
    let url = format!("https://dict.youdao.com/jsonapi?q={}", word);
    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    // 提取音标
    let phonetic = data["ec"]["word"][0]["usphone"].as_str().unwrap_or("");
    let uk_phonetic = data["ec"]["word"][0]["ukphone"].as_str().unwrap_or("");
    
    // 提取释义
    let mut definitions = Vec::new();
    if let Some(trs) = data["ec"]["word"][0]["trs"].as_array() {
        for tr in trs {
            if let Some(tr_item) = tr["tr"].as_array() {
                for item in tr_item {
                    if let Some(l) = item["l"]["i"].as_array() {
                        let meaning: Vec<&str> = l.iter().filter_map(|v| v.as_str()).collect();
                        if !meaning.is_empty() {
                            definitions.push(meaning.join(" "));
                        }
                    }
                }
            }
        }
    }
    
    // 提取词形变化
    let mut word_forms = Vec::new();
    if let Some(wfs) = data["ec"]["word"][0]["wfs"].as_array() {
        for wf in wfs {
            if let Some(wf_item) = wf["wf"].as_object() {
                if let (Some(name), Some(value)) = (wf_item.get("name"), wf_item.get("value")) {
                    word_forms.push(serde_json::json!({
                        "form": name.as_str().unwrap_or(""),
                        "value": value.as_str().unwrap_or("")
                    }));
                }
            }
        }
    }
    
    // 提取例句（直接取前5条双语例句）
    let mut examples = Vec::new();
    if let Some(sent) = data["blng_sents_part"]["sentence-pair"].as_array() {
        for s in sent.iter().take(5) {
            let en = s["sentence"].as_str().unwrap_or("");
            let cn = s["sentence-translation"].as_str().unwrap_or("");
            if !en.is_empty() {
                examples.push(serde_json::json!({
                    "sentence": en,
                    "translation": cn
                }));
            }
        }
    }
    
    // 提取网络释义
    let mut web_translations = Vec::new();
    if let Some(web) = data["web_trans"]["web-translation"].as_array() {
        for w in web.iter().take(5) {
            if let Some(trans) = w["trans"].as_array() {
                for t in trans {
                    if let Some(tr) = t["value"].as_str() {
                        web_translations.push(tr.to_string());
                    }
                }
            }
        }
    }
    
    // 提取同反义词
    let mut synonyms = Vec::new();
    let mut antonyms = Vec::new();
    if let Some(rel) = data["rel_word"]["rel"].as_array() {
        for r in rel {
            if let Some(type_name) = r["type"].as_str() {
                if let Some(words) = r["words"].as_array() {
                    for w in words {
                        if let Some(wl) = w["word"].as_str() {
                            match type_name {
                                "syno" => synonyms.push(wl.to_string()),
                                "anton" => antonyms.push(wl.to_string()),
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(serde_json::json!({
        "data": {
            "word": word,
            "phonetic": phonetic,
            "uk_phonetic": uk_phonetic,
            "definitions": definitions,
            "examples": examples,
            "word_forms": word_forms,
            "web_translations": web_translations,
            "synonyms": synonyms,
            "antonyms": antonyms
        }
    }))
}

#[tauri::command]
async fn update_notepad(notepad_id: String, title: String, brief: String, tags: Vec<String>, content: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://open.maimemo.com/open/api/v1/notepads/{}", notepad_id);
    let body = serde_json::json!({
        "notepad": {
            "title": title,
            "brief": brief,
            "tags": tags,
            "content": content,
            "status": "UNPUBLISHED"
        }
    });
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    let result = data.get("data").unwrap_or(&data);
    Ok(serde_json::json!({ "data": result }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            // 创建托盘菜单
            let show_i = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;
            
            // 创建系统托盘
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("MoMo Selector")
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
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
                    }
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
            load_settings,
            save_settings,
            show_popup_window,
            close_popup_window,
            get_clipboard_text,
            check_vocabulary,
            create_notepad,
            get_notepads,
            add_words_to_notepad,
            delete_notepad,
            update_notepad,
            get_notepad_detail,
            get_word_details,
            add_words_to_study,
            lookup_dictionary,
            get_cursor_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
