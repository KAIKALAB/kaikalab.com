/**
 * JLPT-GO — タイピングのゲーム4つ（kaikalab.com/jlpt/typing/・ADR 0038 追記）
 *
 * TopikPilot の韓国語タイピングのゲーム（もぐらたたき・意味あわせ・単語の雨・60秒チャレンジ）の形をまねる。
 * 打つのはローマ字（romaji.js）。言葉は今日の漢字の言葉（data.json の words）。
 * 記録は端末だけ（localStorage の jlpt.typing.games）
 *
 * #/game/mole、#/game/match/N3、#/game/rain/N3、#/game/sprint/N3
 */
import { toUnits, Typing } from "./romaji.js";
import { play } from "./sound.js";
import { esc, LEVELS, meaningOf, pick, readStore, shuffle, soundButton, tx, writeStore } from "./ui.js";

// ── 文言（6言語。日英以外は人が確認していない） ──

export const G = {
  games: { ja: "ゲーム", en: "Games", "zh-Hans": "游戏", "zh-Hant": "遊戲", id: "Permainan", vi: "Trò chơi" },
  mole: { ja: "字のもぐらたたき", en: "Kana whack-a-mole", "zh-Hans": "假名打地鼠", "zh-Hant": "假名打地鼠", id: "Pukul kana", vi: "Đập chuột kana" },
  moleDesc: {
    ja: "出てきたかなを、消える前に打ちます（60秒）。",
    en: "Type each kana before it disappears (60 seconds).",
    "zh-Hans": "在假名消失前打出来（60 秒）。",
    "zh-Hant": "在假名消失前打出來（60 秒）。",
    id: "Ketik setiap kana sebelum menghilang (60 detik).",
    vi: "Gõ mỗi kana trước khi nó biến mất (60 giây).",
  },
  match: { ja: "意味あわせ", en: "Meaning match", "zh-Hans": "意思配对", "zh-Hant": "意思配對", id: "Cocokkan arti", vi: "Ghép nghĩa" },
  matchDesc: {
    ja: "意味に合う言葉を4つから選びます（10問）。数字キーの 1〜4 でも選べます。",
    en: "Pick the word that matches the meaning, out of four (10 questions). Keys 1–4 also work.",
    "zh-Hans": "从四个选项中选出与意思相符的词（10 题）。也可以按数字键 1〜4。",
    "zh-Hant": "從四個選項中選出與意思相符的詞（10 題）。也可以按數字鍵 1〜4。",
    id: "Pilih kata yang sesuai dengan artinya dari empat pilihan (10 soal). Tombol 1–4 juga bisa.",
    vi: "Chọn từ đúng với nghĩa trong bốn lựa chọn (10 câu). Có thể bấm phím 1–4.",
  },
  rain: { ja: "単語の雨", en: "Word rain", "zh-Hans": "单词雨", "zh-Hant": "單字雨", id: "Hujan kata", vi: "Mưa từ vựng" },
  rainDesc: {
    ja: "落ちてくる言葉を、下に着く前に打ちます。3つ落とすと終わりです。",
    en: "Type the falling words before they reach the bottom. The game ends when three get through.",
    "zh-Hans": "在单词落到底部前打出来。漏掉三个就结束。",
    "zh-Hant": "在單字落到底部前打出來。漏掉三個就結束。",
    id: "Ketik kata yang jatuh sebelum sampai ke bawah. Permainan selesai jika tiga kata lolos.",
    vi: "Gõ các từ đang rơi trước khi chạm đáy. Để lọt ba từ là kết thúc.",
  },
  sprint: { ja: "60秒チャレンジ", en: "60-second challenge", "zh-Hans": "60 秒挑战", "zh-Hant": "60 秒挑戰", id: "Tantangan 60 detik", vi: "Thử thách 60 giây" },
  sprintDesc: {
    ja: "60秒で、言葉をいくつ打てるかを競います。最初のキーで時間が動き出します。",
    en: "See how many words you can type in 60 seconds. The clock starts with your first key.",
    "zh-Hans": "看看 60 秒内能打出多少个词。按下第一个键时开始计时。",
    "zh-Hant": "看看 60 秒內能打出多少個詞。按下第一個鍵時開始計時。",
    id: "Berapa banyak kata yang bisa kamu ketik dalam 60 detik. Waktu mulai berjalan saat tombol pertama ditekan.",
    vi: "Xem bạn gõ được bao nhiêu từ trong 60 giây. Đồng hồ chạy từ phím đầu tiên.",
  },
  start: { ja: "始める", en: "Start", "zh-Hans": "开始", "zh-Hant": "開始", id: "Mulai", vi: "Bắt đầu" },
  time: { ja: "残り時間", en: "Time left", "zh-Hans": "剩余时间", "zh-Hant": "剩餘時間", id: "Sisa waktu", vi: "Thời gian còn" },
  score: { ja: "点", en: "Score", "zh-Hans": "得分", "zh-Hant": "得分", id: "Skor", vi: "Điểm" },
  lives: { ja: "あと落とせる数", en: "Lives", "zh-Hans": "剩余机会", "zh-Hant": "剩餘機會", id: "Nyawa", vi: "Mạng" },
  correct: { ja: "正解", en: "Correct", "zh-Hans": "答对", "zh-Hant": "答對", id: "Benar", vi: "Đúng" },
  wrong: { ja: "正しくは", en: "Answer", "zh-Hans": "正确答案", "zh-Hant": "正確答案", id: "Jawaban", vi: "Đáp án" },
  words: { ja: "打てた言葉", en: "Words typed", "zh-Hans": "打出的词", "zh-Hant": "打出的詞", id: "Kata yang diketik", vi: "Số từ đã gõ" },
  speed: { ja: "速さ（打/分）", en: "Speed (keys/min)", "zh-Hans": "速度（键/分）", "zh-Hant": "速度（鍵/分）", id: "Kecepatan (tombol/menit)", vi: "Tốc độ (phím/phút)" },
  accuracy: { ja: "正確さ", en: "Accuracy", "zh-Hans": "准确率", "zh-Hant": "準確率", id: "Ketepatan", vi: "Độ chính xác" },
  best: { ja: "これまでの最高", en: "Your best", "zh-Hans": "最佳记录", "zh-Hant": "最佳紀錄", id: "Rekor terbaik", vi: "Kỷ lục" },
  over: { ja: "終わりました", en: "Finished", "zh-Hans": "结束了", "zh-Hant": "結束了", id: "Selesai", vi: "Kết thúc" },
  again: { ja: "もう一度", en: "Again", "zh-Hans": "再来一次", "zh-Hant": "再來一次", id: "Ulangi", vi: "Làm lại" },
  menu: { ja: "メニューへ", en: "Menu", "zh-Hans": "返回菜单", "zh-Hant": "返回選單", id: "Menu", vi: "Về menu" },
  esc: { ja: "Esc でメニューへ", en: "Esc: back to menu", "zh-Hans": "按 Esc 返回菜单", "zh-Hant": "按 Esc 返回選單", id: "Esc: kembali ke menu", vi: "Esc: về menu" },
};

/**
 * もぐらたたきに出すかな（清音と濁音・半濁音）。「ん」は n 1つで「な」の打ち始めと区別できないので出さない。
 * 「ぢ」「づ」は di・du と打つが、学習者は ji・zu と打ちやすく、外れの理由を出さないゲームでは分かりにくいので出さない
 */
export const MOLE_KANA = [..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをがぎぐげござじずぜぞだでどばびぶべぼぱぴぷぺぽ"];

const GAME_SECONDS = 60;
const RECORD_KEY = "jlpt.typing.games";

/**
 * もぐらたたきの打ち方の判定。いま出ているかなのどれかの打ち方の続きなら受け付ける。
 * 戻り値: { hit: 打ち終えたかなの番号（無ければ -1）, buffer: 次の打ちかけ, ok: 受け付けたか }
 * 出ているかなが複数あれば、先に出たものを優先する（kana は出た順に並べて渡す）
 */
export function matchKana(buffer, key, kana) {
  const next = buffer + key.toLowerCase();
  const options = kana.map((k) => toUnits(k)?.[0]?.options ?? []);
  const hit = options.findIndex((list) => list.includes(next));
  if (hit >= 0) return { hit, buffer: "", ok: true };
  if (options.some((list) => list.some((o) => o.startsWith(next)))) return { hit: -1, buffer: next, ok: true };
  return { hit: -1, buffer: "", ok: false };
}

/**
 * 単語の雨の狙い。いま狙っている言葉が無ければ、押した字で打ち始められる言葉のうち、一番下にあるものを狙う。
 * words は下にあるものから並べて渡す。戻り値は狙う言葉の番号（無ければ -1）
 */
export function pickTarget(key, readings) {
  return readings.findIndex((reading) => new Typing(reading).key(key).ok);
}

// ── 記録 ──

function best(mode, value) {
  const records = readStore(RECORD_KEY);
  if (value !== undefined && (records[mode] === undefined || value > records[mode])) {
    records[mode] = value;
    writeStore(RECORD_KEY, records);
  }
  return records[mode];
}
export function bestOf(mode) {
  return readStore(RECORD_KEY)[mode];
}

// ── 進め方 ──

let stopCurrent = null;
/** 動いているゲームを止める（別の画面へ移るとき） */
export function stopGame() {
  if (stopCurrent !== null) stopCurrent();
  stopCurrent = null;
}

function onKey(handler) {
  const listener = (e) => {
    if (e.key === "Escape") {
      location.hash = "#/";
      return;
    }
    if (e.isComposing || e.key === "Process") return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    e.preventDefault();
    handler(e.key);
  };
  document.addEventListener("keydown", listener);
  return () => document.removeEventListener("keydown", listener);
}

function result(root, route, title, rows, bestValue) {
  stopGame();
  play("finish");
  root.innerHTML = `
<div class="result">
  <h2>${tx(G.over)}</h2>
  <p>${tx(title)}</p>
  <dl>${rows.map(([label, value]) => `<dt>${tx(label)}</dt><dd>${esc(value)}</dd>`).join("")}<dt>${tx(G.best)}</dt><dd>${esc(bestValue ?? "-")}</dd></dl>
  <p class="actions"><a href="${esc(route)}" data-again>${tx(G.again)}</a><a href="#/">${tx(G.menu)}</a></p>
</div>`;
  root.querySelector("[data-again]").addEventListener("click", (e) => {
    e.preventDefault();
    startGame(root, route.replace(/^#/, ""), lastData);
  });
}

let lastData = null;

/** route は "/game/mole" などの # のうしろ。data は data.json */
export function startGame(root, route, data) {
  stopGame();
  lastData = data;
  const [, , name, level] = route.split("/");
  const words = LEVELS.includes(level) ? data.words[level] : [];
  if (name === "mole") return mole(root, `#${route}`);
  if (name === "match" && words.length >= 4) return match(root, `#${route}`, level, words);
  if (name === "rain" && words.length > 0) return rain(root, `#${route}`, level, words);
  if (name === "sprint" && words.length > 0) return sprint(root, `#${route}`, level, words);
  location.hash = "#/";
}

const head = (title, info) =>
  `<p class="play-head"><span>${tx(title)}</span>${info}<span class="esc">${tx(G.esc)}</span>${soundButton()}</p>`;

// ── 字のもぐらたたき ──

function mole(root, route) {
  const HOLES = 9;
  root.innerHTML = `
<div class="play game-mole">
  ${head(G.mole, `<span>${tx(G.time)}: <b data-time>${GAME_SECONDS}</b></span><span>${tx(G.score)}: <b data-score>0</b></span>`)}
  <div class="holes">${Array.from({ length: HOLES }, (_, i) => `<div class="hole" data-hole="${i}"></div>`).join("")}</div>
  <p class="guide" data-buffer></p>
</div>`;
  const holes = [...root.querySelectorAll("[data-hole]")];
  /** 出ているかな（出た順）: { hole, kana, until } */
  let up = [];
  let buffer = "";
  let score = 0;
  let miss = 0;
  const endAt = Date.now() + GAME_SECONDS * 1000;
  const draw = () => {
    for (const [i, el] of holes.entries()) {
      const m = up.find((u) => u.hole === i);
      el.textContent = m ? m.kana : "";
      el.classList.toggle("up", m !== undefined);
    }
    root.querySelector("[data-buffer]").textContent = buffer;
    root.querySelector("[data-score]").textContent = String(score);
  };
  const tick = () => {
    const now = Date.now();
    const before = up.length;
    up = up.filter((u) => u.until > now);
    if (up.length !== before && !up.some((u) => (toUnits(u.kana)?.[0]?.options ?? []).some((o) => o.startsWith(buffer)))) buffer = "";
    // 同時に出すのは3つまで。経過に合わせて出す間隔を縮める
    const elapsed = GAME_SECONDS * 1000 - (endAt - now);
    if (up.length < 3 && Math.random() < 0.08 + elapsed / 600000) {
      const free = holes.map((_, i) => i).filter((i) => !up.some((u) => u.hole === i));
      const shown = new Set(up.map((u) => u.kana));
      const kana = shuffle(MOLE_KANA).find((k) => !shown.has(k));
      if (free.length > 0) up.push({ hole: free[Math.floor(Math.random() * free.length)], kana, until: now + 2600 - Math.min(elapsed / 60, 900) });
    }
    root.querySelector("[data-time]").textContent = String(Math.max(0, Math.ceil((endAt - now) / 1000)));
    draw();
    if (now >= endAt) {
      result(root, route, G.mole, [[G.score, score], [G.accuracy, `${score + miss === 0 ? 0 : Math.round((score / (score + miss)) * 100)}%`]], best("mole", score));
    }
  };
  const timer = setInterval(tick, 100);
  const off = onKey((key) => {
    const r = matchKana(buffer, key, up.map((u) => u.kana));
    if (!r.ok) {
      miss++;
      play("miss");
    } else if (r.hit < 0) play("key");
    if (r.hit >= 0) {
      play("hit");
      score++;
      const hitKana = up[r.hit];
      up = up.filter((u) => u !== hitKana);
      const el = holes[hitKana.hole];
      el.classList.add("hit");
      setTimeout(() => el.classList.remove("hit"), 200);
    }
    buffer = r.buffer;
    draw();
  });
  stopCurrent = () => {
    clearInterval(timer);
    off();
  };
  draw();
}

// ── 意味あわせ ──

function match(root, route, level, words) {
  const questions = pick(words, 10).map((answer) => {
    const others = shuffle(words.filter((w) => w.word !== answer.word && meaningOf(w.meaning) !== meaningOf(answer.meaning))).slice(0, 3);
    return { answer, choices: shuffle([answer, ...others]) };
  });
  let index = 0;
  let correct = 0;
  let locked = false;
  /** 次の問題へ移るまでの待ち。ゲームを離れたら取り消す（残すと、別の画面を意味あわせで上書きした） */
  let pending = null;
  const show = (feedback = "") => {
    const q = questions[index];
    root.innerHTML = `
<div class="play game-match">
  ${head(G.match, `<span>${esc(level)}</span><span>${index + 1} / ${questions.length}</span><span>${tx(G.correct)}: ${correct}</span>`)}
  <p class="target meaning">${esc(meaningOf(q.answer.meaning))}</p>
  <ol class="match-choices">${q.choices.map((c, i) => `<li><button type="button" data-choice="${i}"><span class="no">${i + 1}</span> ${esc(c.word)} <small>${esc(c.reading)}</small></button></li>`).join("")}</ol>
  <p class="message" aria-live="polite">${feedback}</p>
</div>`;
    for (const button of root.querySelectorAll("[data-choice]")) button.addEventListener("click", () => choose(Number(button.dataset.choice)));
  };
  const choose = (i) => {
    if (locked) return;
    const q = questions[index];
    if (i < 0 || i >= q.choices.length) return;
    locked = true;
    const ok = q.choices[i] === q.answer;
    if (ok) correct++;
    play(ok ? "done" : "miss");
    show(ok ? `<span class="ok">${tx(G.correct)}</span>` : `${tx(G.wrong)}: ${esc(q.answer.word)}（${esc(q.answer.reading)}）`);
    pending = setTimeout(
      () => {
        locked = false;
        index++;
        if (index >= questions.length) result(root, route, G.match, [[G.correct, `${correct} / ${questions.length}`]], best(`match${level}`, correct));
        else show();
      },
      ok ? 600 : 1500,
    );
  };
  const off = onKey((key) => {
    if (/^[1-4]$/.test(key)) choose(Number(key) - 1);
  });
  stopCurrent = () => {
    off();
    if (pending !== null) clearTimeout(pending);
  };
  show();
}

// ── 単語の雨 ──

function rain(root, route, level, words) {
  const HEIGHT = 380;
  root.innerHTML = `
<div class="play game-rain">
  ${head(G.rain, `<span>${esc(level)}</span><span>${tx(G.score)}: <b data-score>0</b></span><span>${tx(G.lives)}: <b data-lives>3</b></span>`)}
  <div class="sky" style="height:${HEIGHT}px"></div>
  <p class="guide" data-guide></p>
</div>`;
  const sky = root.querySelector(".sky");
  /** 落ちている言葉: { word, el, y, x, typing } */
  let drops = [];
  let target = null;
  let score = 0;
  let lives = 3;
  let ok = 0;
  let miss = 0;
  let lastSpawn = 0;
  let lastFrame = performance.now();
  const startedAt = performance.now();
  const queue = pick(words, 400);
  const spawn = () => {
    const word = queue.shift() ?? words[0];
    const el = document.createElement("div");
    el.className = "drop";
    el.innerHTML = `${esc(word.word)}<small>${esc(word.reading)}</small>`;
    sky.appendChild(el);
    const x = 4 + Math.random() * 70;
    el.style.left = `${x}%`;
    drops.push({ word, el, y: -40, typing: new Typing(word.reading) });
  };
  const guide = () => {
    const el = root.querySelector("[data-guide]");
    if (target === null) {
      el.textContent = "";
      return;
    }
    const g = target.typing.guide();
    el.innerHTML = `<span class="done">${esc(g.typed)}</span>${esc(g.rest)}`;
  };
  let frame = 0;
  const loop = (now) => {
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    const elapsed = (now - startedAt) / 1000;
    // 時間とともに速く、多くする
    const speed = 28 + elapsed * 0.9;
    const interval = Math.max(1.1, 2.6 - elapsed / 40);
    if (now - lastSpawn > interval * 1000 && drops.length < 6) {
      spawn();
      lastSpawn = now;
    }
    for (const d of drops) {
      d.y += speed * dt;
      d.el.style.transform = `translateY(${d.y}px)`;
    }
    for (const d of drops.filter((d) => d.y > HEIGHT - 30)) {
      d.el.remove();
      lives--;
      if (lives > 0) play("lose");
      if (d === target) target = null;
    }
    drops = drops.filter((d) => d.y <= HEIGHT - 30);
    root.querySelector("[data-lives]").textContent = String(Math.max(lives, 0));
    if (lives <= 0) {
      result(root, route, G.rain, [[G.score, score], [G.accuracy, `${ok + miss === 0 ? 0 : Math.round((ok / (ok + miss)) * 100)}%`]], best(`rain${level}`, score));
      return;
    }
    guide();
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  const off = onKey((key) => {
    if (target === null) {
      // 下にあるものから狙う
      const ordered = [...drops].sort((a, b) => b.y - a.y);
      const i = pickTarget(key, ordered.map((d) => d.word.reading));
      if (i < 0) {
        miss++;
        play("miss");
        return;
      }
      target = ordered[i];
      target.el.classList.add("target");
    }
    const r = target.typing.key(key);
    if (!r.ok) {
      miss++;
      play("miss");
      return;
    }
    ok++;
    play(r.done ? "done" : "key");
    if (r.done) {
      score++;
      target.el.remove();
      drops = drops.filter((d) => d !== target);
      target = null;
      root.querySelector("[data-score]").textContent = String(score);
    }
    guide();
  });
  stopCurrent = () => {
    cancelAnimationFrame(frame);
    off();
  };
}

// ── 60秒チャレンジ ──

function sprint(root, route, level, words) {
  const queue = pick(words, 300);
  let index = 0;
  let typing = new Typing(queue[0].reading);
  let done = 0;
  let ok = 0;
  let miss = 0;
  let startedAt = null;
  let timer = null;
  const draw = () => {
    const w = queue[index];
    const g = typing.guide();
    const chars = [...w.reading];
    const left = startedAt === null ? GAME_SECONDS : Math.max(0, Math.ceil(GAME_SECONDS - (Date.now() - startedAt) / 1000));
    root.innerHTML = `
<div class="play game-sprint">
  ${head(G.sprint, `<span>${esc(level)}</span><span>${tx(G.time)}: <b>${left}</b></span><span>${tx(G.words)}: <b>${done}</b></span>`)}
  <p class="target">${esc(w.word)}</p>
  <p class="reading"><span class="done">${esc(chars.slice(0, typing.doneChars()).join(""))}</span>${esc(chars.slice(typing.doneChars()).join(""))}</p>
  <p class="guide"><span class="done">${esc(g.typed)}</span>${esc(g.rest)}</p>
  <p class="sub">${esc(meaningOf(w.meaning))}</p>
</div>`;
  };
  const finish = () => {
    const minutes = GAME_SECONDS / 60;
    result(
      root,
      route,
      G.sprint,
      [
        [G.words, done],
        [G.speed, Math.round(ok / minutes)],
        [G.accuracy, `${ok + miss === 0 ? 0 : Math.round((ok / (ok + miss)) * 100)}%`],
      ],
      best(`sprint${level}`, done),
    );
  };
  const off = onKey((key) => {
    if (startedAt === null) {
      startedAt = Date.now();
      timer = setInterval(() => {
        if (Date.now() - startedAt >= GAME_SECONDS * 1000) finish();
        else draw();
      }, 250);
    }
    const r = typing.key(key);
    if (!r.ok) {
      miss++;
      play("miss");
      return;
    }
    ok++;
    play(r.done ? "done" : "key");
    if (r.done) {
      done++;
      index++;
      typing = new Typing(queue[index % queue.length].reading);
      index %= queue.length;
    }
    draw();
  });
  stopCurrent = () => {
    if (timer !== null) clearInterval(timer);
    off();
  };
  draw();
}
