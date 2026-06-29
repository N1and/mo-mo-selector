#[tauri::command]
pub async fn check_vocabulary(spelling: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!(
            "https://open.maimemo.com/open/api/v1/vocabulary?spelling={}",
            spelling
        ))
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
pub async fn create_notepad(
    title: String,
    brief: String,
    tags: Vec<String>,
    content: String,
    token: String,
) -> Result<serde_json::Value, String> {
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
pub async fn get_notepads(token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let auth_header = format!("Bearer {}", token);
    let mut all_notepads = Vec::new();
    let mut offset = 0;
    let limit = 10;

    loop {
        let url = format!(
            "https://open.maimemo.com/open/api/v1/notepads?limit={}&offset={}",
            limit, offset
        );
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
pub async fn add_words_to_notepad(
    notepad_id: String,
    voc_ids: Vec<String>,
    token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let auth_header = format!("Bearer {}", token);

    // 1. 获取词本详情
    let notepad_url = format!(
        "https://open.maimemo.com/open/api/v1/notepads/{}",
        notepad_id
    );
    let notepad_resp = client
        .get(&notepad_url)
        .header("Authorization", &auth_header)
        .send()
        .await
        .map_err(|e| format!("获取词本失败: {}", e))?;

    let notepad_data: serde_json::Value = notepad_resp
        .json()
        .await
        .map_err(|e| format!("解析词本数据失败: {}", e))?;
    let notepad_inner = notepad_data.get("data").unwrap_or(&notepad_data);
    let current_content = notepad_inner["notepad"]["content"]
        .as_str()
        .unwrap_or("");
    let title = notepad_inner["notepad"]["title"]
        .as_str()
        .unwrap_or("未命名词本");
    let brief = notepad_inner["notepad"]["brief"].as_str().unwrap_or("");
    let status = notepad_inner["notepad"]["status"]
        .as_str()
        .unwrap_or("UNPUBLISHED");
    let tags: Vec<String> = notepad_inner["notepad"]["tags"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    // 2. 获取每个单词的拼写
    let mut new_spellings = Vec::new();
    for voc_id in &voc_ids {
        let voc_url = "https://open.maimemo.com/open/api/v1/vocabulary/query".to_string();
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
                if let Some(voc) = voc_inner["voc"]
                    .as_array()
                    .and_then(|arr| arr.first())
                {
                    if let Some(spelling) = voc["spelling"].as_str() {
                        new_spellings.push(spelling.to_string());
                    }
                }
            }
        }
    }

    // 3. 将新单词追加到 content
    let mut words: Vec<&str> = current_content
        .lines()
        .filter(|l| !l.trim().is_empty())
        .collect();
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

    let result = update_resp
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("解析更新结果失败: {}", e))?;
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
pub async fn delete_notepad(
    notepad_id: String,
    token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://open.maimemo.com/open/api/v1/notepads/{}",
        notepad_id
    );
    let _response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "data": { "success": true } }))
}

#[tauri::command]
pub async fn get_notepad_detail(
    notepad_id: String,
    token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://open.maimemo.com/open/api/v1/notepads/{}",
        notepad_id
    );
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
pub async fn get_word_details(
    spellings: Vec<String>,
    token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let auth_header = format!("Bearer {}", token);
    let mut words_details = Vec::new();

    for spelling in &spellings {
        // 1. 获取单词ID
        let voc_url = format!(
            "https://open.maimemo.com/open/api/v1/vocabulary?spelling={}",
            spelling
        );
        let voc_resp = client
            .get(&voc_url)
            .header("Authorization", &auth_header)
            .send()
            .await;

        let voc_id = if let Ok(resp) = voc_resp {
            if let Ok(voc_data) = resp.json::<serde_json::Value>().await {
                let voc_inner = voc_data.get("data").unwrap_or(&voc_data);
                voc_inner["voc"]["id"]
                    .as_str()
                    .map(|s| s.to_string())
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
        let interp_url = format!(
            "https://open.maimemo.com/open/api/v1/interpretations?voc_id={}",
            voc_id
        );
        let interpretations = if let Ok(resp) = client
            .get(&interp_url)
            .header("Authorization", &auth_header)
            .send()
            .await
        {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let inner = data.get("data").unwrap_or(&data);
                inner["interpretations"]
                    .as_array()
                    .cloned()
                    .unwrap_or_default()
            } else {
                vec![]
            }
        } else {
            vec![]
        };

        // 3. 获取助记
        let notes_url = format!(
            "https://open.maimemo.com/open/api/v1/notes?voc_id={}",
            voc_id
        );
        let notes = if let Ok(resp) = client
            .get(&notes_url)
            .header("Authorization", &auth_header)
            .send()
            .await
        {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let inner = data.get("data").unwrap_or(&data);
                inner["notes"]
                    .as_array()
                    .cloned()
                    .unwrap_or_default()
            } else {
                vec![]
            }
        } else {
            vec![]
        };

        // 4. 获取例句
        let phrases_url = format!(
            "https://open.maimemo.com/open/api/v1/phrases?voc_id={}",
            voc_id
        );
        let phrases = if let Ok(resp) = client
            .get(&phrases_url)
            .header("Authorization", &auth_header)
            .send()
            .await
        {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let inner = data.get("data").unwrap_or(&data);
                inner["phrases"]
                    .as_array()
                    .cloned()
                    .unwrap_or_default()
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
pub async fn add_words_to_study(
    voc_ids: Vec<String>,
    advance: bool,
    token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = "https://open.maimemo.com/open/api/v1/study/add_words";

    let words: Vec<serde_json::Value> = voc_ids
        .iter()
        .map(|id| serde_json::json!({ "id": id }))
        .collect();

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
pub async fn update_notepad(
    notepad_id: String,
    title: String,
    brief: String,
    tags: Vec<String>,
    content: String,
    token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://open.maimemo.com/open/api/v1/notepads/{}",
        notepad_id
    );
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
