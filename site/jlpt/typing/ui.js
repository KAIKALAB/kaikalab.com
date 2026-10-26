/**
 * JLPT-GO — タイピング練習とゲームで共通の表示の道具（ADR 0038）
 * 表示言語は /jlpt/ のほかのページと同じ（html の data-ui。選んでいなければ日本語と英語）
 */

export const LANGS = ["ja", "en", "zh-Hans", "zh-Hant", "id", "vi"];
export const LEVELS = ["N3", "N2", "N1"];

export function lang() {
  const l = document.documentElement.getAttribute("data-ui");
  return LANGS.includes(l) ? l : null;
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 文言。言語を選んでいなければ日本語と英語を並べる */
export function tx(text, params = {}) {
  const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");
  const l = lang();
  if (l !== null) return esc(fill(text[l]));
  return `${esc(fill(text.ja))} <span class="en" lang="en">${esc(fill(text.en))}</span>`;
}

/** 意味。言語を選んでいなければ英語、日本語を選んでいれば日本語 */
export function meaningOf(meaning) {
  return meaning[lang() ?? "en"] ?? meaning.en ?? meaning.ja;
}

/** 端末だけに残す記録。保存できない端末では残さないだけ */
export function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}
export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 端末が保存を許さないときは、記録を残さないだけ
  }
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** n 件取り出す。足りなければ繰り返す */
export const pick = (list, n) => {
  if (list.length === 0) return [];
  let out = [];
  while (out.length < n) out = out.concat(shuffle(list));
  return out.slice(0, n);
};
