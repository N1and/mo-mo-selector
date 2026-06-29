#[tauri::command]
pub async fn lookup_dictionary(word: String) -> Result<serde_json::Value, String> {
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
