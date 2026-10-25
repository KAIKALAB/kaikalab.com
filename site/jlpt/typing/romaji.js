/**
 * JLPT-GO — ローマ字でかなを打つ仕組み（kaikalab.com/jlpt/typing/・ADR 0038）
 *
 * 打つ文（かな）を「打つ単位」に分け、単位ごとに正しい打ち方を全部並べる（し: shi・si・ci など）。
 * 押したキーが、どれかの打ち方の続きになっていれば正しい。手本は、打ち始めた打ち方に合わせて書き換える。
 * ブラウザでそのまま読む ES モジュール（ビルドしない）。テストは romaji.test.js
 */

/** 1字のかなの打ち方。先頭が手本に出す打ち方 */
const SINGLE = {
  あ: ["a"], い: ["i", "yi"], う: ["u", "wu", "whu"], え: ["e"], お: ["o"],
  か: ["ka", "ca"], き: ["ki"], く: ["ku", "cu", "qu"], け: ["ke"], こ: ["ko", "co"],
  さ: ["sa"], し: ["shi", "si", "ci"], す: ["su"], せ: ["se", "ce"], そ: ["so"],
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  わ: ["wa"], ゐ: ["wyi"], ゑ: ["wye"], を: ["wo"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  だ: ["da"], ぢ: ["di"], づ: ["du"], で: ["de"], ど: ["do"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ゔ: ["vu"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"], ゅ: ["xyu", "lyu"], ょ: ["xyo", "lyo"], ゎ: ["xwa", "lwa"],
  っ: ["xtu", "ltu", "xtsu", "ltsu"],
  ー: ["-"], "、": [","], "。": ["."], "・": ["/"], "「": ["["], "」": ["]"],
  "？": ["?"], "！": ["!"], "（": ["("], "）": [")"], "〜": ["~"], " ": [" "], "　": [" "],
};

/** 2字の組（拗音・外来語の書き方）。まとめた打ち方。1字ずつ（ki + xya）の打ち方は後で足す */
const PAIRS = {
  きゃ: ["kya"], きぃ: ["kyi"], きゅ: ["kyu"], きぇ: ["kye"], きょ: ["kyo"],
  ぎゃ: ["gya"], ぎぃ: ["gyi"], ぎゅ: ["gyu"], ぎぇ: ["gye"], ぎょ: ["gyo"],
  しゃ: ["sha", "sya"], しぃ: ["syi"], しゅ: ["shu", "syu"], しぇ: ["she", "sye"], しょ: ["sho", "syo"],
  じゃ: ["ja", "zya", "jya"], じぃ: ["zyi", "jyi"], じゅ: ["ju", "zyu", "jyu"], じぇ: ["je", "zye", "jye"], じょ: ["jo", "zyo", "jyo"],
  ちゃ: ["cha", "tya", "cya"], ちぃ: ["tyi", "cyi"], ちゅ: ["chu", "tyu", "cyu"], ちぇ: ["che", "tye", "cye"], ちょ: ["cho", "tyo", "cyo"],
  ぢゃ: ["dya"], ぢぃ: ["dyi"], ぢゅ: ["dyu"], ぢぇ: ["dye"], ぢょ: ["dyo"],
  にゃ: ["nya"], にぃ: ["nyi"], にゅ: ["nyu"], にぇ: ["nye"], にょ: ["nyo"],
  ひゃ: ["hya"], ひぃ: ["hyi"], ひゅ: ["hyu"], ひぇ: ["hye"], ひょ: ["hyo"],
  びゃ: ["bya"], びぃ: ["byi"], びゅ: ["byu"], びぇ: ["bye"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴぃ: ["pyi"], ぴゅ: ["pyu"], ぴぇ: ["pye"], ぴょ: ["pyo"],
  みゃ: ["mya"], みぃ: ["myi"], みゅ: ["myu"], みぇ: ["mye"], みょ: ["myo"],
  りゃ: ["rya"], りぃ: ["ryi"], りゅ: ["ryu"], りぇ: ["rye"], りょ: ["ryo"],
  ふぁ: ["fa", "fwa"], ふぃ: ["fi", "fyi", "fwi"], ふぇ: ["fe", "fye", "fwe"], ふぉ: ["fo", "fwo"], ふゅ: ["fyu"],
  てぃ: ["thi"], てゅ: ["thu"], でぃ: ["dhi"], でゅ: ["dhu"], とぅ: ["twu"], どぅ: ["dwu"],
  うぃ: ["wi", "whi"], うぇ: ["we", "whe"], うぉ: ["who"], いぇ: ["ye"],
  ゔぁ: ["va"], ゔぃ: ["vi", "vyi"], ゔぇ: ["ve", "vye"], ゔぉ: ["vo"], ゔゅ: ["vyu"],
  つぁ: ["tsa"], つぃ: ["tsi"], つぇ: ["tse"], つぉ: ["tso"],
  くぁ: ["kwa", "qa"], ぐぁ: ["gwa"],
};

const SOKUON_PREFIX = SINGLE["っ"];

/** カタカナをひらがなにする（打ち方を引くため。画面にはもとの字を出す）。長音「ー」はそのまま */
export function toHiragana(text) {
  return text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** 「ん」の次が母音・や行・な行・「ん」のどれかで始まるなら、n 1つでは打てない（na と区別できない） */
const needsDoubleN = (next) => next !== undefined && next.options.some((o) => /^[aiueoyn']/.test(o));

/**
 * かなの文を打つ単位に分ける。打てない字があれば null（データを作る側で、その文を使わない）
 * 単位: { text: 画面の字, options: 打ち方（先頭が手本） }
 */
export function toUnits(text) {
  const chars = [...text];
  const hira = chars.map(toHiragana);
  /** i から始まる単位を作る（「っ」「ん」のために、後ろから決める） */
  const build = (i) => {
    if (i >= chars.length) return [];
    if (hira[i] === "っ" && i + 1 < chars.length) {
      const rest = build(i + 1);
      if (rest === null) return null;
      const next = rest[0];
      // 次が子音で始まるなら、子音を重ねても打てる（kka・cchi・tchi）
      if (next !== undefined && next.options.some((o) => /^[bcdfghjkmpqrstvwyz]/.test(o))) {
        const options = [];
        for (const o of next.options) {
          if (/^[bcdfghjkmpqrstvwyz]/.test(o)) options.push(o[0] + o);
          if (o.startsWith("ch")) options.push("t" + o);
        }
        for (const p of SOKUON_PREFIX) for (const o of next.options) options.push(p + o);
        return [{ text: chars[i] + next.text, options: unique(options) }, ...rest.slice(1)];
      }
      return [{ text: chars[i], options: SOKUON_PREFIX }, ...rest];
    }
    if (hira[i] === "ん") {
      const rest = build(i + 1);
      if (rest === null) return null;
      const options = ["nn", "n'", "xn"];
      if (!needsDoubleN(rest[0])) options.push("n");
      return [{ text: chars[i], options }, ...rest];
    }
    const pair = hira[i] + (hira[i + 1] ?? "");
    if (PAIRS[pair] !== undefined) {
      const rest = build(i + 2);
      if (rest === null) return null;
      // 1字ずつ打つ打ち方（ki + xya）も正しい
      const split = SINGLE[hira[i]].flatMap((a) => SINGLE[hira[i + 1]].map((b) => a + b));
      return [{ text: chars[i] + chars[i + 1], options: unique([...PAIRS[pair], ...split]) }, ...rest];
    }
    if (SINGLE[hira[i]] === undefined) return null;
    const rest = build(i + 1);
    if (rest === null) return null;
    return [{ text: chars[i], options: SINGLE[hira[i]] }, ...rest];
  };
  return build(0);
}

const unique = (list) => [...new Set(list)];

/**
 * 1つの文を打つ。key(c) に押した字を渡す。
 * 戻り値: { ok: 正しいか, done: 打ち終えたか }
 */
export class Typing {
  constructor(text) {
    const units = toUnits(text);
    if (units === null) throw new Error(`打てない字があります: ${text}`);
    this.text = text;
    this.units = units;
    this.index = 0;
    /** 今の単位で打った字 */
    this.buffer = "";
    /** 打ち終えた単位ごとの、実際に打った字 */
    this.typed = [];
  }

  get done() {
    return this.index >= this.units.length;
  }

  key(input) {
    if (this.done) return { ok: false, done: true };
    const c = input.toLowerCase();
    const unit = this.units[this.index];
    const next = this.buffer + c;
    const candidates = unit.options.filter((o) => o.startsWith(next));
    if (candidates.length > 0) {
      this.buffer = next;
      const exact = unit.options.includes(next);
      const last = this.index === this.units.length - 1;
      // 打ち終えた形で、これより長い打ち方が無い（または文の最後）なら単位を閉じる。
      // 「ん」の n のように、続けて nn と打つかもしれないときは、次のキーを待つ
      if (exact && (candidates.every((o) => o === next) || last)) this.commit();
      return { ok: true, done: this.done };
    }
    // 今の単位が打ち終えた形なら閉じて、押した字を次の単位に回す（「ん」を n 1つで打って次へ進んだとき）
    if (unit.options.includes(this.buffer)) {
      this.commit();
      return this.key(c);
    }
    return { ok: false, done: false };
  }

  commit() {
    this.typed.push(this.buffer);
    this.buffer = "";
    this.index++;
  }

  /** 今打っている単位（打ち間違えたときの理由に使う） */
  current() {
    return this.done ? null : this.units[this.index];
  }

  /** 手本: 打ち終えたローマ字と、残りのローマ字（打ち始めた打ち方に合わせる） */
  guide() {
    const rest = this.units.slice(this.index).map((unit, i) => {
      if (i === 0 && this.buffer !== "") return (unit.options.find((o) => o.startsWith(this.buffer)) ?? unit.options[0]).slice(this.buffer.length);
      return unit.options[0];
    });
    return { typed: this.typed.join("") + this.buffer, rest: rest.join("") };
  }

  /** 打ち終えたかなの数（画面で色を変えるため。単位の字数で数える） */
  doneChars() {
    return this.units.slice(0, this.index).reduce((n, u) => n + [...u.text].length, 0);
  }
}
