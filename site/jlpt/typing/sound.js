/**
 * JLPT-GO — タイピング練習とゲームの効果音（ADR 0038 追記・2026-10-26 主人「効果音を入れてください。」）
 *
 * 音のファイルは使わず、ブラウザの Web Audio で短い音を作る（権利の確認が要らず、読み込みも無い）。
 * オン・オフは端末に残す（localStorage の jlpt.typing.sound）。既定はオン。
 * ブラウザは利用者の操作の前に音を出させないので、最初のキーやクリックで音の準備をする
 */

const KEY = "jlpt.typing.sound";
let ctx = null;

export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSound(on) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // 保存できない端末では、このページを開いているあいだだけ切り替わる
  }
  memory = on;
}

/** localStorage が使えない端末のための、開いているあいだの状態 */
let memory = null;
const enabled = () => (memory !== null ? memory : soundOn());

function context() {
  if (ctx !== null) return ctx;
  const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (AudioContext === undefined) return null;
  ctx = new AudioContext();
  return ctx;
}

/** 1つの音。freq は Hz、start は今からの秒、length は秒、type は波の形 */
function tone(audio, { freq, start = 0, length = 0.08, type = "sine", volume = 0.12, slide = null }) {
  const t = audio.currentTime + start;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide !== null) osc.frequency.exponentialRampToValueAtTime(slide, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

/** 鳴らす音の一覧 */
const SOUNDS = {
  /** 正しく打った（小さく短く。打つたびに鳴るので控えめに） */
  key: (a) => tone(a, { freq: 880, length: 0.03, type: "triangle", volume: 0.05 }),
  /** 打ち間違えた */
  miss: (a) => tone(a, { freq: 180, length: 0.12, type: "square", volume: 0.06, slide: 120 }),
  /** 1つ打ち終えた（言葉・文・正解） */
  done: (a) => {
    tone(a, { freq: 660, length: 0.09 });
    tone(a, { freq: 990, start: 0.07, length: 0.12 });
  },
  /** もぐらに当てた */
  hit: (a) => tone(a, { freq: 520, length: 0.08, type: "triangle", volume: 0.14, slide: 900 }),
  /** 言葉を落とした（単語の雨） */
  lose: (a) => tone(a, { freq: 300, length: 0.25, type: "sawtooth", volume: 0.06, slide: 110 }),
  /** 終わった */
  finish: (a) => [523, 659, 784, 1047].forEach((freq, i) => tone(a, { freq, start: i * 0.09, length: 0.16, volume: 0.1 })),
};

export function play(name) {
  if (!enabled()) return;
  const audio = context();
  if (audio === null) return;
  if (audio.state === "suspended") void audio.resume();
  try {
    SOUNDS[name]?.(audio);
  } catch {
    // 音が出せない端末では、何もしない
  }
}
