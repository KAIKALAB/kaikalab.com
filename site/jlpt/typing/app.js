/**
 * JLPT-GO — 日本語タイピング練習の画面（kaikalab.com/jlpt/typing/・ADR 0038）
 *
 * 段階は # で切り替える: #/ メニュー、#/kana/1〜5、#/words/N3、#/short、#/long、ゲームは #/game/…（games.js）
 * 表示言語は /jlpt/ のほかのページと同じ（html の data-ui。選んでいなければ日本語と英語）
 * 記録は端末だけ（localStorage）。サーバーには送らない
 */
import { Typing } from "./romaji.js";
import { bestOf, G, startGame, stopGame } from "./games.js";
import { play, setSound, soundOn } from "./sound.js";
import { esc, lang, LEVELS, meaningOf, pick, readStore, soundButton, tx, writeStore } from "./ui.js";

const root = document.getElementById("typing-app");
const BASE = root.dataset.base;

// ── 文言（6言語。日英以外は人が確認していない・ADR 0034〜0036 と同じ） ──

const S = {
  step: { ja: "段階", en: "Step", "zh-Hans": "步骤", "zh-Hant": "步驟", id: "Langkah", vi: "Bước" },
  kana: { ja: "かな", en: "Kana", "zh-Hans": "假名", "zh-Hant": "假名", id: "Kana", vi: "Kana" },
  kanaDesc: {
    ja: "ローマ字でかなを打ちます。清音から順に5つの組。",
    en: "Type kana in romaji, in five groups starting with the basic sounds.",
    "zh-Hans": "用罗马字输入假名。从清音开始，共五组。",
    "zh-Hant": "用羅馬字輸入假名。從清音開始，共五組。",
    id: "Ketik kana dengan romaji, dalam lima kelompok mulai dari bunyi dasar.",
    vi: "Gõ kana bằng romaji, gồm năm nhóm bắt đầu từ âm cơ bản.",
  },
  words: { ja: "単語", en: "Words", "zh-Hans": "单词", "zh-Hant": "單字", id: "Kata", vi: "Từ vựng" },
  wordsDesc: {
    ja: "今日の漢字の言葉を、意味を見ながら打ちます。",
    en: "Type the words from Kanji of the day while reading their meanings.",
    "zh-Hans": "一边看意思，一边输入今日汉字的词语。",
    "zh-Hant": "一邊看意思，一邊輸入今日漢字的詞語。",
    id: "Ketik kata-kata dari Kanji hari ini sambil melihat artinya.",
    vi: "Vừa xem nghĩa vừa gõ các từ trong Kanji hôm nay.",
  },
  short: { ja: "短文", en: "Sentences", "zh-Hans": "短句", "zh-Hant": "短句", id: "Kalimat", vi: "Câu ngắn" },
  shortDesc: {
    ja: "毎日の読解の文章から、1文ずつ打ちます。",
    en: "Type one sentence at a time from the daily reading passages.",
    "zh-Hans": "从每日阅读的文章中，一次输入一句。",
    "zh-Hant": "從每日閱讀的文章中，一次輸入一句。",
    id: "Ketik satu kalimat demi satu dari teks membaca harian.",
    vi: "Gõ từng câu trích từ bài đọc hiểu hằng ngày.",
  },
  long: { ja: "長文", en: "Passages", "zh-Hans": "长文", "zh-Hant": "長文", id: "Teks panjang", vi: "Đoạn văn" },
  longDesc: {
    ja: "毎日の読解の文章を、数文続けて打ちます（150〜300字）。",
    en: "Type several sentences in a row from a daily reading passage (150–300 characters).",
    "zh-Hans": "连续输入每日阅读文章中的几句话（150〜300 字）。",
    "zh-Hant": "連續輸入每日閱讀文章中的幾句話（150〜300 字）。",
    id: "Ketik beberapa kalimat berturut-turut dari teks membaca harian (150–300 karakter).",
    vi: "Gõ liên tiếp vài câu trong bài đọc hiểu hằng ngày (150–300 ký tự).",
  },
  start: { ja: "始める", en: "Start", "zh-Hans": "开始", "zh-Hant": "開始", id: "Mulai", vi: "Bắt đầu" },
  again: { ja: "もう一度", en: "Again", "zh-Hans": "再来一次", "zh-Hant": "再來一次", id: "Ulangi", vi: "Làm lại" },
  menu: { ja: "メニューへ", en: "Menu", "zh-Hans": "返回菜单", "zh-Hant": "返回選單", id: "Menu", vi: "Về menu" },
  done: { ja: "おつかれさまでした", en: "Well done", "zh-Hans": "辛苦了", "zh-Hant": "辛苦了", id: "Selesai", vi: "Hoàn thành" },
  speed: { ja: "速さ（打/分）", en: "Speed (keys/min)", "zh-Hans": "速度（键/分）", "zh-Hant": "速度（鍵/分）", id: "Kecepatan (tombol/menit)", vi: "Tốc độ (phím/phút)" },
  accuracy: { ja: "正確さ", en: "Accuracy", "zh-Hans": "准确率", "zh-Hant": "準確率", id: "Ketepatan", vi: "Độ chính xác" },
  best: { ja: "これまでの最高", en: "Your best", "zh-Hans": "最佳记录", "zh-Hant": "最佳紀錄", id: "Rekor terbaik", vi: "Kỷ lục" },
  records: { ja: "記録（この端末だけ）", en: "Records (this device only)", "zh-Hans": "记录（仅本设备）", "zh-Hant": "紀錄（僅本裝置）", id: "Rekor (hanya perangkat ini)", vi: "Kỷ lục (chỉ trên thiết bị này)" },
  hint: {
    ja: "「{kana}」は {romaji} と打ちます",
    en: "Type “{kana}” as {romaji}",
    "zh-Hans": "「{kana}」输入 {romaji}",
    "zh-Hant": "「{kana}」輸入 {romaji}",
    id: "“{kana}” diketik {romaji}",
    vi: "“{kana}” gõ là {romaji}",
  },
  or: { ja: " か ", en: " or ", "zh-Hans": " 或 ", "zh-Hant": " 或 ", id: " atau ", vi: " hoặc " },
  ime: {
    ja: "日本語入力がオンになっています。半角英数に切り替えてください。",
    en: "Japanese input (IME) is on. Switch to direct (English) input.",
    "zh-Hans": "输入法正在使用中。请切换为英文输入。",
    "zh-Hant": "輸入法正在使用中。請切換為英文輸入。",
    id: "Input bahasa Jepang (IME) sedang aktif. Ganti ke input huruf Latin biasa.",
    vi: "Bộ gõ tiếng Nhật (IME) đang bật. Hãy chuyển sang gõ chữ Latin thông thường.",
  },
  pc: {
    ja: "このページは、キーボードのある PC 向けです。",
    en: "This page is for computers with a keyboard.",
    "zh-Hans": "本页面适用于有键盘的电脑。",
    "zh-Hant": "本頁面適用於有鍵盤的電腦。",
    id: "Halaman ini untuk komputer dengan keyboard.",
    vi: "Trang này dành cho máy tính có bàn phím.",
  },
  esc: { ja: "Esc でメニューへ", en: "Esc: back to menu", "zh-Hans": "按 Esc 返回菜单", "zh-Hant": "按 Esc 返回選單", id: "Esc: kembali ke menu", vi: "Esc: về menu" },
  noData: { ja: "まだ文がありません。", en: "No sentences yet.", "zh-Hans": "还没有句子。", "zh-Hant": "還沒有句子。", id: "Belum ada kalimat.", vi: "Chưa có câu nào." },
  howto: {
    ja: "ローマ字で打ちます（例: 「し」は shi・si、「っ」は次の子音を重ねる、「ん」は nn）。日本語入力の設定は要りません。",
    en: "Type in romaji (for example し is shi or si, っ doubles the next consonant, ん is nn). No Japanese keyboard setup is needed.",
    "zh-Hans": "用罗马字输入（例：「し」打 shi 或 si，「っ」重复下一个辅音，「ん」打 nn）。不需要设置日语输入法。",
    "zh-Hant": "用羅馬字輸入（例：「し」打 shi 或 si，「っ」重複下一個子音，「ん」打 nn）。不需要設定日文輸入法。",
    id: "Ketik dengan romaji (misalnya し diketik shi atau si, っ menggandakan konsonan berikutnya, ん diketik nn). Tidak perlu mengatur keyboard bahasa Jepang.",
    vi: "Gõ bằng romaji (ví dụ し là shi hoặc si, っ là gấp đôi phụ âm tiếp theo, ん là nn). Không cần cài bàn phím tiếng Nhật.",
  },
};

/** かなの5つの組 */
const KANA_STAGES = [
  { name: { ja: "清音", en: "Basic kana", "zh-Hans": "清音", "zh-Hant": "清音", id: "Kana dasar", vi: "Âm cơ bản" }, items: [..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"] },
  { name: { ja: "濁音・半濁音", en: "Voiced sounds", "zh-Hans": "浊音・半浊音", "zh-Hant": "濁音・半濁音", id: "Bunyi bersuara", vi: "Âm đục" }, items: [..."がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ"] },
  { name: { ja: "拗音", en: "Combined sounds", "zh-Hans": "拗音", "zh-Hant": "拗音", id: "Bunyi gabungan", vi: "Âm ghép" }, items: "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ".split(" ") },
  { name: { ja: "「っ」「ん」と長音", en: "っ, ん and long vowels", "zh-Hans": "「っ」「ん」与长音", "zh-Hant": "「っ」「ん」與長音", id: "っ, ん, dan vokal panjang", vi: "っ, ん và trường âm" }, items: "がっこう きって ざっし いっぱい まっすぐ ちょっと にほん みんな せんせい きんえん こんや ほんや しんぶん ラーメン コーヒー スーパー ノート ケーキ ゲーム カレー".split(" ") },
  { name: { ja: "カタカナ", en: "Katakana", "zh-Hans": "片假名", "zh-Hant": "片假名", id: "Katakana", vi: "Katakana" }, items: [..."アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ"] },
];


// ── 記録（端末だけ） ──

const RECORD_KEY = "jlpt.typing.best";
const readRecords = () => readStore(RECORD_KEY);
function saveRecord(mode, kpm, acc) {
  const records = readRecords();
  const old = records[mode];
  if (old === undefined || kpm > old.kpm) records[mode] = { kpm, acc };
  writeStore(RECORD_KEY, records);
  return records[mode];
}

// ── データ ──

let data = null;
async function loadData() {
  if (data === null) data = await (await fetch(`${BASE}data.json`)).json();
  return data;
}

// ── 画面 ──

let session = null;

function menu() {
  session = null;
  const records = readRecords();
  const rec = (mode) => (records[mode] ? `<span class="rec">${tx(S.best)}: ${records[mode].kpm} / ${records[mode].acc}%</span>` : "");
  const gameRec = (mode) => (bestOf(mode) !== undefined ? `<span class="rec">${tx(S.best)}: ${bestOf(mode)}</span>` : "");
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  root.innerHTML = `
${coarse ? `<p class="notice">${tx(S.pc)}</p>` : ""}
<p class="howto">${tx(S.howto)}</p>
<p class="sound-row">${soundButton()}</p>
<div class="steps">
  <section class="step">
    <p class="step-no">${tx(S.step)} 1</p><h2>${tx(S.kana)}</h2><p>${tx(S.kanaDesc)}</p>
    <div class="choices">${KANA_STAGES.map((s, i) => `<a href="#/kana/${i + 1}">${i + 1}. ${tx(s.name)}</a>${rec(`kana${i + 1}`)}`).join("")}</div>
  </section>
  <section class="step">
    <p class="step-no">${tx(S.step)} 2</p><h2>${tx(S.words)}</h2><p>${tx(S.wordsDesc)}</p>
    <div class="choices">${LEVELS.map((l) => `<a href="#/words/${l}">${l}</a>${rec(`words${l}`)}`).join("")}</div>
  </section>
  <section class="step">
    <p class="step-no">${tx(S.step)} 3</p><h2>${tx(S.short)}</h2><p>${tx(S.shortDesc)}</p>
    <div class="choices"><a href="#/short">${tx(S.start)}</a>${rec("short")}</div>
  </section>
  <section class="step">
    <p class="step-no">${tx(S.step)} 4</p><h2>${tx(S.long)}</h2><p>${tx(S.longDesc)}</p>
    <div class="choices"><a href="#/long">${tx(S.start)}</a>${rec("long")}</div>
  </section>
</div>
<h2 class="games-title">${tx(G.games)}</h2>
<div class="steps games">
  <section class="step">
    <h2>${tx(G.mole)}</h2><p>${tx(G.moleDesc)}</p>
    <div class="choices"><a href="#/game/mole">${tx(G.start)}</a>${gameRec("mole")}</div>
  </section>
  ${["match", "rain", "sprint"]
    .map(
      (name) => `<section class="step">
    <h2>${tx(G[name])}</h2><p>${tx(G[`${name}Desc`])}</p>
    <div class="choices">${LEVELS.map((l) => `<a href="#/game/${name}/${l}">${l}</a>${gameRec(`${name}${l}`)}`).join("")}</div>
  </section>`,
    )
    .join("")}
</div>`;
}

/** 打つものの並び。item: { text: 画面の大きな字, reading: 打つかな, sub: 下に出す説明 } */
async function items(route) {
  const [, mode, arg] = route.split("/");
  if (mode === "kana") {
    const stage = KANA_STAGES[Number(arg) - 1];
    if (stage === undefined) return null;
    const n = Number(arg) === 4 ? 10 : 20;
    return { mode: `kana${arg}`, title: stage.name, list: pick(stage.items, n).map((k) => ({ text: k, reading: k, sub: "" })) };
  }
  const d = await loadData();
  if (mode === "words" && LEVELS.includes(arg)) {
    return {
      mode: `words${arg}`,
      title: { ...S.words, ja: `${S.words.ja} ${arg}` },
      list: pick(d.words[arg], 10).map((w) => ({ text: w.word, reading: w.reading, sub: meaningOf(w.meaning) })),
    };
  }
  if (mode === "short") return { mode: "short", title: S.short, list: pick(d.short, 5).map((s) => ({ text: s.text, reading: s.reading, sub: `${s.level} ・ ${s.date}` })) };
  if (mode === "long") return { mode: "long", title: S.long, list: pick(d.long, 1).map((s) => ({ text: s.text, reading: s.reading, sub: `${s.level} ・ ${s.date}` })) };
  return null;
}

async function start(route) {
  const plan = await items(route);
  if (plan === null) {
    location.hash = "#/";
    return;
  }
  if (plan.list.length === 0) {
    root.innerHTML = `<p class="notice">${tx(S.noData)}</p><p><a href="#/">${tx(S.menu)}</a></p>`;
    return;
  }
  session = { ...plan, index: 0, typing: new Typing(plan.list[0].reading), ok: 0, miss: 0, startedAt: null, message: "" };
  draw();
}

function draw() {
  const s = session;
  const item = s.list[s.index];
  const done = s.typing.doneChars();
  const chars = [...item.reading];
  const guide = s.typing.guide();
  const bigKana = item.text === item.reading;
  root.innerHTML = `
<div class="play">
  <p class="play-head"><span>${tx(s.title)}</span><span>${s.index + 1} / ${s.list.length}</span><span class="esc">${tx(S.esc)}</span>${soundButton()}</p>
  <p class="target${bigKana ? " big" : ""}${s.mode === "long" ? " longtext" : ""}">${esc(item.text)}</p>
  ${bigKana ? "" : `<p class="reading"><span class="done">${esc(chars.slice(0, done).join(""))}</span>${esc(chars.slice(done).join(""))}</p>`}
  <p class="guide"><span class="done">${esc(guide.typed)}</span>${esc(guide.rest)}</p>
  ${item.sub ? `<p class="sub">${esc(item.sub)}</p>` : ""}
  <p class="message" aria-live="polite">${s.message}</p>
</div>`;
}

function finish() {
  const s = session;
  const minutes = Math.max((Date.now() - (s.startedAt ?? Date.now())) / 60000, 1 / 60);
  const kpm = Math.round(s.ok / minutes);
  const acc = s.ok + s.miss === 0 ? 0 : Math.round((s.ok / (s.ok + s.miss)) * 100);
  const best = saveRecord(s.mode, kpm, acc);
  play("finish");
  const route = location.hash;
  session = null;
  root.innerHTML = `
<div class="result">
  <h2>${tx(S.done)}</h2>
  <dl><dt>${tx(S.speed)}</dt><dd>${kpm}</dd><dt>${tx(S.accuracy)}</dt><dd>${acc}%</dd><dt>${tx(S.best)}</dt><dd>${best.kpm} / ${best.acc}%</dd></dl>
  <p class="actions"><a href="${esc(route)}" data-again>${tx(S.again)}</a><a href="#/">${tx(S.menu)}</a></p>
</div>`;
  root.querySelector("[data-again]").addEventListener("click", (e) => {
    e.preventDefault();
    void start(route.slice(1));
  });
}

document.addEventListener("keydown", (e) => {
  if (session === null) return;
  if (e.key === "Escape") {
    location.hash = "#/";
    return;
  }
  if (e.isComposing || e.key === "Process") {
    session.message = tx(S.ime);
    draw();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  e.preventDefault();
  session.startedAt ??= Date.now();
  const unit = session.typing.current();
  const result = session.typing.key(e.key);
  if (!result.ok) {
    play("miss");
    session.miss++;
    const romaji = unit.options.slice(0, 3).join(S.or[lang() ?? "ja"]);
    session.message = tx(S.hint, { kana: unit.text, romaji });
    draw();
    return;
  }
  session.ok++;
  session.message = "";
  play(result.done ? "done" : "key");
  if (result.done) {
    session.index++;
    if (session.index >= session.list.length) {
      finish();
      return;
    }
    session.typing = new Typing(session.list[session.index].reading);
  }
  draw();
});

async function route() {
  stopGame();
  session = null;
  const hash = location.hash.replace(/^#/, "") || "/";
  if (hash === "/") menu();
  else if (hash.startsWith("/game/")) startGame(root, hash, await loadData());
  else void start(hash);
}
window.addEventListener("hashchange", () => void route());
// 効果音のオン・オフ（メニューと、打っている画面の上のボタン）
root.addEventListener("click", (e) => {
  const button = e.target.closest("[data-sound]");
  if (button === null) return;
  setSound(!soundOn());
  button.outerHTML = soundButton();
  if (soundOn()) play("done");
});
void route();
