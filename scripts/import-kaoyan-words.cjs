#!/usr/bin/env node

/**
 * 考研真题生词导入脚本
 *
 * 所有年份、英一/英二的真题生词都放在同一个词本「考研英语真题生词」里，
 * 用章节区分：章节名格式为「年份 英一/英二 Text N」，例如「2013 英二 Text 1」。
 *
 * 用法：
 *   MAIMEMO_TOKEN=... node scripts/import-kaoyan-words.cjs <年份> <英一|英二> <生词文件> [--dry-run]
 *
 * 生词文件格式（每行一个单词或词组，用 #Text N 分章节）：
 *   #Text 1
 *   mill
 *   make the point
 *   #Text 2
 *   settler
 *
 * 同名章节会被整体替换，其余章节保持不变；已在其他章节出现过的单词会跳过并提示。
 */

const fs = require('fs');

const API = 'https://open.maimemo.com/open/api/v1';
const NOTEPAD_TITLE = '考研英语真题生词';
const NOTEPAD_BRIEF =
  '历年考研英语（一）（二）阅读真题生词。章节按「年份 英一/英二 Text N」区分，例如「2013 英二 Text 1」。';
const NOTEPAD_TAGS = ['考研'];

async function request(method, path, token, body) {
  const resp = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(`${method} ${path} 失败: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

async function findNotepad(token) {
  const limit = 10;
  for (let offset = 0; ; offset += limit) {
    const { notepads } = await request('GET', `/notepads?limit=${limit}&offset=${offset}`, token);
    const found = notepads.find((n) => n.title === NOTEPAD_TITLE);
    if (found) return found.id;
    if (notepads.length < limit) return null;
  }
}

// 把词本 content 解析为 [{ chapter, words }]，章节外的单词归入 chapter = null
function parseSections(content) {
  const sections = [];
  let current = { chapter: null, words: [] };
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      if (current.chapter !== null || current.words.length) sections.push(current);
      current = { chapter: line.slice(1).trim(), words: [] };
    } else {
      current.words.push(line);
    }
  }
  if (current.chapter !== null || current.words.length) sections.push(current);
  return sections;
}

function renderSections(sections) {
  return sections
    .map((s) => (s.chapter === null ? s.words : [`#${s.chapter}`, ...s.words]).join('\n'))
    .join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const [year, paper, file] = args.filter((a) => a !== '--dry-run');
  const token = process.env.MAIMEMO_TOKEN;

  if (!year || !['英一', '英二'].includes(paper) || !file) {
    console.error('用法: node scripts/import-kaoyan-words.cjs <年份> <英一|英二> <生词文件> [--dry-run]');
    process.exit(1);
  }
  if (!token) {
    console.error('请设置环境变量 MAIMEMO_TOKEN');
    process.exit(1);
  }

  const incoming = parseSections(fs.readFileSync(file, 'utf8')).map((s) => ({
    chapter: `${year} ${paper} ${s.chapter ?? 'Text'}`,
    words: s.words,
  }));
  const replaced = new Set(incoming.map((s) => s.chapter));

  const notepadId = await findNotepad(token);
  let current = [];
  let status = 'UNPUBLISHED';
  if (notepadId) {
    const { notepad } = await request('GET', `/notepads/${notepadId}`, token);
    current = parseSections(notepad.content || '');
    status = notepad.status;
  }
  const existing = current.filter((s) => !replaced.has(s.chapter));

  // 单词在整个词本中只保留第一次出现的位置
  const seen = new Map();
  for (const s of existing) for (const w of s.words) seen.set(w.toLowerCase(), s.chapter);
  const skipped = [];
  for (const s of incoming) {
    s.words = s.words.filter((w) => {
      const key = w.toLowerCase();
      if (seen.has(key)) {
        skipped.push(`${w}（已在 ${seen.get(key)}）`);
        return false;
      }
      seen.set(key, s.chapter);
      return true;
    });
  }

  // 同名章节原位替换，新章节追加到末尾
  const byChapter = new Map(incoming.map((s) => [s.chapter, s]));
  const merged = current.map((s) => byChapter.get(s.chapter) ?? s);
  const kept = new Set(merged);
  for (const s of incoming) if (!kept.has(s)) merged.push(s);
  const content = renderSections(merged);
  for (const s of incoming) console.log(`${s.chapter}: ${s.words.length} 个`);
  if (skipped.length) console.log(`跳过重复 ${skipped.length} 个: ${skipped.join('，')}`);

  if (dryRun) {
    console.log('\n--dry-run，未写入。合并后的内容：\n');
    console.log(content);
    return;
  }

  const notepad = { title: NOTEPAD_TITLE, brief: NOTEPAD_BRIEF, tags: NOTEPAD_TAGS, content, status };
  if (notepadId) {
    await request('POST', `/notepads/${notepadId}`, token, { notepad });
    console.log(`已更新词本 ${NOTEPAD_TITLE} (${notepadId})`);
  } else {
    const data = await request('POST', '/notepads', token, { notepad });
    console.log(`已创建词本 ${NOTEPAD_TITLE} (${data.notepad.id})`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
