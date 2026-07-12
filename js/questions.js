// 题目生成器：按知识点生成口算题
// 每道题格式：
//   keypad 模式  { text, answer:Number, inputMode:'keypad', decimals }
//   choice 模式  { text, answer:String, inputMode:'choice', options:[...] }

(function (global) {
  'use strict';

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
  }
  function simplifyFrac(n, d) {
    const g = gcd(n, d);
    return [n / g, d / g];
  }
  function fracStr(n, d) {
    if (d === 1) return String(n);
    if (n === 0) return '0';
    return n + '/' + d;
  }

  function kq(text, answer, decimals) {
    return { text: text, answer: Number(answer), inputMode: 'keypad', decimals: decimals || 0 };
  }
  function cq(text, answer, options) {
    return { text: text, answer: String(answer), inputMode: 'choice', options: options };
  }

  // 从候选干扰项里拼出 4 个不重复选项（含正确答案），并打乱
  // makeMore(k): 可选兜底函数，去重后不足 4 个时反复调用以补足
  function buildOptions(correct, distractors, makeMore) {
    const set = [String(correct)];
    const pushUnique = (v) => {
      const s = String(v);
      if (set.length < 4 && !set.includes(s)) set.push(s);
    };
    for (const d of distractors) {
      if (set.length >= 4) break;
      pushUnique(d);
    }
    let guard = 0;
    while (set.length < 4 && typeof makeMore === 'function' && guard < 60) {
      guard++;
      pushUnique(makeMore(guard));
    }
    // 打乱
    for (let i = set.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [set[i], set[j]] = [set[j], set[i]];
    }
    return set;
  }

  // ---------- 各知识点生成器 ----------
  const GEN = {
    // 一年级
    add10() {
      const a = randInt(1, 9);
      const b = randInt(0, 10 - a);
      return kq(a + ' + ' + b, a + b);
    },
    sub10() {
      const a = randInt(1, 10);
      const b = randInt(0, a);
      return kq(a + ' − ' + b, a - b);
    },
    add20() { // 进位加法，和在 11~18
      let a, b;
      do { a = randInt(3, 9); b = randInt(3, 9); } while (a + b < 11 || a + b > 18);
      return kq(a + ' + ' + b, a + b);
    },
    sub20() { // 退位减法
      let a, b;
      do { a = randInt(11, 18); b = randInt(2, 9); } while (a - b < 1 || (a % 10) >= b);
      return kq(a + ' − ' + b, a - b);
    },

    // 二年级
    add100() {
      const a = randInt(10, 89);
      const b = randInt(10, 100 - a);
      return kq(a + ' + ' + b, a + b);
    },
    sub100() {
      const a = randInt(20, 99);
      const b = randInt(10, a - 1);
      return kq(a + ' − ' + b, a - b);
    },
    mulTable() { // 乘法口诀
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      return kq(a + ' × ' + b, a * b);
    },
    divTable() { // 表内除法
      const b = randInt(2, 9);
      const q = randInt(2, 9);
      return kq((b * q) + ' ÷ ' + b, q);
    },

    // 三年级
    addSub3() { // 三位数加减
      if (randInt(0, 1)) {
        const a = randInt(100, 800);
        const b = randInt(100, 999 - a > 100 ? 999 - a : 100);
        return kq(a + ' + ' + b, a + b);
      }
      const a = randInt(300, 999);
      const b = randInt(100, a - 50);
      return kq(a + ' − ' + b, a - b);
    },
    mul1by2() { // 一位数 × 两位数
      const a = randInt(2, 9);
      const b = randInt(11, 99);
      return kq(a + ' × ' + b, a * b);
    },
    divExact3() { // 两三位数 ÷ 一位数（整除）
      const d = randInt(2, 9);
      const q = randInt(11, 99);
      return kq((d * q) + ' ÷ ' + d, q);
    },

    // 四年级
    mul2by2() {
      const a = randInt(11, 99);
      const b = randInt(11, 99);
      return kq(a + ' × ' + b, a * b);
    },
    mul3by1() {
      const a = randInt(100, 999);
      const b = randInt(2, 9);
      return kq(a + ' × ' + b, a * b);
    },
    divByTwo() { // 除数是两位数（整除）
      const d = randInt(11, 30);
      const q = randInt(2, 30);
      return kq((d * q) + ' ÷ ' + d, q);
    },
    mixed4() { // 简单四则混合
      const forms = [
        () => { const a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 20); return kq(a + ' × ' + b + ' + ' + c, a * b + c); },
        () => { const a = randInt(2, 9), b = randInt(2, 9), c = randInt(1, 10); return kq(a + ' × ' + b + ' − ' + c, a * b - c); },
        () => { const a = randInt(2, 20), b = randInt(2, 20), c = randInt(2, 9); return kq('(' + a + ' + ' + b + ') × ' + c, (a + b) * c); },
        () => { const a = randInt(10, 50), b = randInt(2, 9), c = randInt(2, 9); return kq(a + ' + ' + b + ' × ' + c, a + b * c); }
      ];
      return pick(forms)();
    },

    // 五年级
    decAddSub() { // 一位小数加减
      const a = randInt(11, 99) / 10;
      let b = randInt(11, 99) / 10;
      if (randInt(0, 1)) {
        return kq(a.toFixed(1) + ' + ' + b.toFixed(1), Math.round((a + b) * 10) / 10, 1);
      }
      const big = Math.max(a, b), small = Math.min(a, b);
      return kq(big.toFixed(1) + ' − ' + small.toFixed(1), Math.round((big - small) * 10) / 10, 1);
    },
    decMul() { // 小数 × 整数
      const a = randInt(11, 99) / 10;
      const b = randInt(2, 9);
      return kq(a.toFixed(1) + ' × ' + b, Math.round(a * b * 10) / 10, 1);
    },
    fracSameDenom() { // 同分母分数加减（选择）
      const d = randInt(3, 9);
      if (randInt(0, 1)) {
        const n1 = randInt(1, d - 2);
        const n2 = randInt(1, d - 1 - n1);
        const ans = fracStr(n1 + n2, d);
        const opts = buildOptions(ans, [
          fracStr(n1 + n2, d + d),
          fracStr(n1 + n2 + 1, d),
          fracStr(n1 * n2, d)
        ], (k) => fracStr(Math.max(1, n1 + n2 + (k % 2 ? k : -k)), d));
        return cq(fracStr(n1, d) + ' + ' + fracStr(n2, d), ans, opts);
      }
      const n1 = randInt(2, d - 1);
      const n2 = randInt(1, n1 - 1);
      const ans = fracStr(n1 - n2, d);
      const opts = buildOptions(ans, [
        fracStr(n1 - n2, d + d),
        fracStr(n1 - n2 + 1, d),
        fracStr(n1 + n2, d)
      ], (k) => fracStr(Math.max(1, (n1 - n2) + (k % 2 ? k : -k)), d));
      return cq(fracStr(n1, d) + ' − ' + fracStr(n2, d), ans, opts);
    },

    // 六年级
    fracMul() { // 真分数乘法（选择）
      const b = randInt(2, 6), d = randInt(2, 6);
      const a = randInt(1, b - 1), c = randInt(1, d - 1); // 真分数，分子<分母
      const [sn, sd] = simplifyFrac(a * c, b * d);
      const ans = fracStr(sn, sd);
      const opts = buildOptions(ans, [
        fracStr(a * c, b * d),
        fracStr(a + c, b + d),
        fracStr(a * d, b * c)
      ], (k) => fracStr(a * c + k, b * d));
      return cq(fracStr(a, b) + ' × ' + fracStr(c, d), ans, opts);
    },
    percent() { // 百分数（keypad，答案为整数）
      const pct = pick([10, 20, 25, 50, 5]);
      const base = randInt(1, 10) * 20;
      return kq(base + ' 的 ' + pct + '% ', base * pct / 100);
    },
    mixedAdv() { // 综合混合运算
      const forms = [
        () => { const a = randInt(3, 12), b = randInt(3, 12), c = randInt(3, 12), d = randInt(2, 9); return kq(a + ' × ' + b + ' + ' + c + ' × ' + d, a * b + c * d); },
        () => { const a = randInt(20, 80), b = randInt(3, 9), c = randInt(3, 9); return kq(a + ' + ' + b + ' × ' + c, a + b * c); },
        () => { const a = randInt(2, 12), b = randInt(2, 12), c = randInt(2, 9); return kq(a + ' × (' + b + ' + ' + c + ')', a * (b + c)); },
        () => { const c = randInt(2, 9), q = randInt(3, 20), r = randInt(1, 30); return kq((c * q) + ' ÷ ' + c + ' + ' + r, q + r); }
      ];
      return pick(forms)();
    }
  };

  // 生成一关的题目，尽量避免连续重复
  function generate(type, count) {
    const gen = GEN[type];
    if (!gen) throw new Error('未知题型: ' + type);
    const out = [];
    const recent = [];
    let guard = 0;
    while (out.length < count && guard < count * 30) {
      guard++;
      const item = gen();
      if (recent.includes(item.text)) continue;
      recent.push(item.text);
      if (recent.length > 3) recent.shift();
      out.push(item);
    }
    while (out.length < count) out.push(gen()); // 兜底
    return out;
  }

  global.Questions = { generate: generate, TYPES: Object.keys(GEN) };
})(window);
