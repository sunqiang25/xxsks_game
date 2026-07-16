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
    },

    // ===== 应用题（文字题，答案为整数，键盘作答）=====
    word_g1() { // 一年级：20 以内一步加减
      const forms = [
        () => { const a = randInt(3, 12), b = randInt(2, 8); return wq('小明有 ' + a + ' 颗糖🍬，妈妈又给了 ' + b + ' 颗，<br>现在一共有几颗糖？', a + b); },
        () => { const a = randInt(8, 18), b = randInt(2, a - 1); return wq('树上有 ' + a + ' 只小鸟🐦，飞走了 ' + b + ' 只，<br>还剩几只小鸟？', a - b); },
        () => { const a = randInt(3, 9), b = randInt(2, 8); return wq('停车场有 ' + a + ' 辆红色🚗和 ' + b + ' 辆蓝色🚙，<br>一共有几辆车？', a + b); },
        () => { const a = randInt(10, 20), b = randInt(3, 9); return wq('小红有 ' + a + ' 支铅笔✏️，送给同学 ' + b + ' 支，<br>还剩几支？', a - b); },
        () => { const a = randInt(5, 12), b = randInt(3, 8); return wq('鱼缸里有 ' + a + ' 条金鱼🐟，又放进 ' + b + ' 条，<br>现在有几条？', a + b); },
        () => { const a = randInt(10, 19), b = randInt(3, 9); return wq('盘子里有 ' + a + ' 个饺子🥟，吃了 ' + b + ' 个，<br>还剩几个？', a - b); },
        () => { const a = randInt(2, 7), b = randInt(2, 7), c = randInt(2, 6); return wq('小猫🐱钓了 ' + a + ' 条鱼，小狗钓了 ' + b + ' 条，小兔钓了 ' + c + ' 条，<br>三个一共几条？', a + b + c); }
      ];
      return pick(forms)();
    },
    word_g2() { // 二年级：100 以内加减 + 乘法口诀应用
      const forms = [
        () => { const a = randInt(3, 9), b = randInt(2, 9); return wq('每盒有 ' + a + ' 支彩笔🖍️，' + b + ' 盒一共有几支？', a * b); },
        () => { const a = randInt(30, 60), b = randInt(10, a - 5); return wq('果园摘了 ' + a + ' 个苹果🍎，卖掉 ' + b + ' 个，<br>还剩几个？', a - b); },
        () => { const a = randInt(2, 9), b = randInt(2, 9); return wq('一排有 ' + a + ' 个座位💺，' + b + ' 排一共几个座位？', a * b); },
        () => { const a = randInt(15, 45), b = randInt(10, 40); return wq('班里有男生 ' + a + ' 人，女生 ' + b + ' 人，<br>全班一共几人？', a + b); },
        () => { const per = randInt(2, 9); const n = randInt(2, 6); const total = per * n; return wq('' + total + ' 块糖🍬平均装进 ' + n + ' 个袋子，<br>每袋装几块？', per); },
        () => { const a = randInt(2, 6), b = randInt(2, 5); return wq('一只手有 5 根手指✋，' + a + ' 只手一共几根手指？', a * 5); },
        () => { const w = randInt(20, 50), s = randInt(5, w - 5); return wq('小明有 ' + w + ' 元💰，买文具花了 ' + s + ' 元，<br>还剩多少元？', w - s); }
      ];
      return pick(forms)();
    },
    word_g3() { // 三年级：乘除 + 三位数加减
      const forms = [
        () => { const box = randInt(3, 8), per = randInt(4, 9); return wq('书架每层放 ' + per + ' 本书📚，' + box + ' 层一共放几本？', box * per); },
        () => { const per = pick([2, 3, 4, 5, 6]); const q = randInt(3, 9); const g = per * q; return wq('有 ' + g + ' 块饼干🍪，平均分给 ' + per + ' 个小朋友，<br>每人分几块？', q); },
        () => { const a = randInt(120, 480), b = randInt(50, 200); return wq('图书馆上午借出 ' + a + ' 本书，下午又借出 ' + b + ' 本，<br>一共借出几本？', a + b); },
        () => { const price = randInt(3, 9), n = randInt(3, 8); return wq('一个面包🍞 ' + price + ' 元，买 ' + n + ' 个要多少元？', price * n); },
        () => { const total = randInt(200, 600), s = randInt(50, 180); return wq('商店有 ' + total + ' 瓶饮料🥤，卖出 ' + s + ' 瓶，<br>还剩几瓶？', total - s); },
        () => { const rows = randInt(4, 8), per = randInt(6, 9); return wq('操场上同学排队，每排 ' + per + ' 人，共 ' + rows + ' 排，<br>一共多少人？', rows * per); },
        () => { const per = pick([6, 8, 10]); const boxes = randInt(3, 8); const g = per * boxes; return wq('' + g + ' 个鸡蛋🥚，每 ' + per + ' 个装一盒，<br>能装几盒？', boxes); }
      ];
      return pick(forms)();
    },
    word_g4() { // 四年级：两步混合应用
      const forms = [
        () => { const per = randInt(5, 12), box = randInt(3, 6), eat = randInt(2, 8); return wq('每袋 ' + per + ' 颗巧克力🍫，买了 ' + box + ' 袋，<br>吃掉 ' + eat + ' 颗，还剩几颗？', per * box - eat); },
        () => { const per = pick([5, 10, 20]); const n = randInt(3, 8); const total = per * n; return wq('一共 ' + total + ' 元💰，每本笔记本 ' + per + ' 元，<br>能买几本？', n); },
        () => { const speed = randInt(40, 80), h = randInt(2, 5); return wq('汽车每小时行 ' + speed + ' 千米🚙，<br>行了 ' + h + ' 小时，一共行多少千米？', speed * h); },
        () => { const a = randInt(3, 8), b = randInt(3, 8), c = randInt(2, 6); return wq('每排 ' + a + ' 棵树🌳，共 ' + b + ' 排，<br>又种了 ' + c + ' 棵，一共几棵？', a * b + c); },
        () => { const a = randInt(20, 80), b = randInt(20, 80), total = a + b + randInt(10, 100); return wq('小明有 ' + total + ' 元，买书花 ' + a + ' 元，买笔花 ' + b + ' 元，<br>还剩多少元？', total - a - b); },
        () => { const boxes = randInt(4, 9), per = randInt(6, 12), give = randInt(2, 5); return wq('' + boxes + ' 箱苹果🍎，每箱 ' + per + ' 个，<br>送人 ' + give + ' 个后还剩几个？', boxes * per - give); },
        () => { const rows = randInt(6, 12), cols = randInt(6, 12); return wq('教室座位排成 ' + rows + ' 行 ' + cols + ' 列，<br>一共有多少个座位💺？', rows * cols); }
      ];
      return pick(forms)();
    },
    word_g5() { // 五年级：小数 + 平均数应用
      const forms = [
        () => { const price = (randInt(15, 45) / 10), n = randInt(2, 5); const ans = Math.round(price * n * 10) / 10; return wq('一支笔 ' + price.toFixed(1) + ' 元，买 ' + n + ' 支<br>一共多少元？（结果保留一位小数）', ans, 1); },
        () => { const avg = randInt(75, 95); const sum = avg * 3; return wq('三次考试平均分 ' + avg + ' 分，<br>三次的总分是多少分？', sum); },
        () => { const w = (randInt(20, 50) / 10), n = randInt(3, 6); const ans = Math.round(w * n * 10) / 10; return wq('每袋米重 ' + w.toFixed(1) + ' 千克，' + n + ' 袋<br>一共重多少千克？（保留一位小数）', ans, 1); },
        () => { const sum = randInt(60, 95) + randInt(60, 95) + randInt(60, 95) + randInt(60, 95); const avg = Math.round(sum / 4 * 10) / 10; return wq('四位同学身高加起来共 ' + sum + ' 厘米，<br>平均每人多高？（保留一位小数）', avg, 1); },
        () => { const b = (randInt(10, 30) / 10); const a = b + (randInt(10, 40) / 10); const aa = Math.round(a * 10) / 10; const ans = Math.round((aa - b) * 10) / 10; return wq('一根绳子长 ' + aa.toFixed(1) + ' 米，剪去 ' + b.toFixed(1) + ' 米，<br>还剩多少米？（保留一位小数）', ans, 1); },
        () => { const total = randInt(3, 8); const each = pick([2, 4, 5]); const money = total * each; return wq('买 ' + total + ' 个练习本共 ' + money + ' 元，<br>每个练习本多少元？', each); }
      ];
      return pick(forms)();
    },
    word_g6() { // 六年级：分数/百分数应用
      const forms = [
        () => { const total = randInt(3, 10) * 20, pct = pick([10, 20, 25, 50]); return wq('一本书共 ' + total + ' 页📖，已经读了 ' + pct + '%，<br>读了多少页？', total * pct / 100); },
        () => { const total = randInt(3, 8) * 12, frac = pick([[1, 2], [1, 3], [1, 4], [2, 3]]); const ans = total * frac[0] / frac[1]; return wq('果园有 ' + total + ' 棵果树🌳，其中 ' + frac[0] + '/' + frac[1] + ' 是苹果树，<br>苹果树有几棵？', ans); },
        () => { const price = randInt(5, 20) * 10, off = pick([10, 20, 30]); return wq('一件衣服👕原价 ' + price + ' 元，<br>打 ' + (100 - off) + ' 折后便宜了多少元？', price * off / 100); },
        () => { const total = randInt(4, 10) * 25; const pct = pick([20, 40, 60, 80]); return wq('班里有 ' + total + ' 名同学，' + pct + '% 参加了合唱🎵，<br>参加合唱的有几人？', total * pct / 100); },
        () => { const base = randInt(2, 6) * 10; const up = pick([10, 20, 50]); return wq('一件玩具🧸原价 ' + base + ' 元，涨价 ' + up + '%，<br>现在多少元？', base * (100 + up) / 100); },
        () => { const frac = pick([[3, 5], [3, 4], [2, 5]]); const total = randInt(3, 9) * frac[1]; const ans = total * frac[0] / frac[1]; return wq('一桶水 ' + total + ' 升，用去了 ' + frac[0] + '/' + frac[1] + '，<br>用去多少升？', ans); }
      ];
      return pick(forms)();
    },

    // ===== 图形题（用 emoji 拼图，选择或键盘）=====
    shape_g1() { // 一年级：数图形个数
      const items = [
        { e: '🔺', zh: '三角形' }, { e: '⬛', zh: '正方形' }, { e: '⭕', zh: '圆形' }, { e: '⭐', zh: '星星' }
      ];
      const target = pick(items);
      const n = randInt(3, 7);
      const other = pick(items.filter(x => x.e !== target.e));
      const m = randInt(2, 5);
      let row = (target.e.repeat(n) + other.e.repeat(m)).split('');
      // 打乱
      for (let i = row.length - 1; i > 0; i--) { const j = randInt(0, i); [row[i], row[j]] = [row[j], row[i]]; }
      return kqShape('图中有几个' + target.zh + target.e + '？<br><span class="shape-art">' + row.join('') + '</span>', n);
    },
    shape_g2() { // 二年级：认识图形的边数
      const shapes = [
        { e: '🔺', zh: '三角形', sides: 3 }, { e: '⬛', zh: '正方形', sides: 4 },
        { e: '▬', zh: '长方形', sides: 4 }, { e: '⬠', zh: '五边形', sides: 5 }, { e: '⬡', zh: '六边形', sides: 6 }
      ];
      const s = pick(shapes);
      const opts = buildOptions(s.sides, [3, 4, 5, 6].filter(x => x !== s.sides), (k) => s.sides + k);
      return cqShape('<span class="shape-art">' + s.e + '</span>' + s.zh + '有几条边？', s.sides, opts);
    },
    shape_g3() { // 三年级：长方形/正方形周长
      const forms = [
        () => { const a = randInt(3, 12), b = randInt(3, 12); return kqShape('长方形长 ' + a + ' 厘米，宽 ' + b + ' 厘米，<br>周长是多少厘米？', (a + b) * 2); },
        () => { const a = randInt(3, 15); return kqShape('正方形⬛边长 ' + a + ' 厘米，<br>周长是多少厘米？', a * 4); },
        () => { const a = randInt(3, 12), b = randInt(3, 12); return kqShape('长方形长 ' + a + ' 厘米，宽 ' + b + ' 厘米，<br>面积是多少平方厘米？', a * b); }
      ];
      return pick(forms)();
    },

    // ===== 找规律（填下一个数，keypad）=====
    pattern_g1() { // 低年级：等差 +1~+3 / 翻倍 / 隔项
      const forms = [
        () => { const s = randInt(1, 5), d = randInt(1, 3); const arr = [s, s + d, s + 2 * d, s + 3 * d]; return kqPattern(arr, arr[3] + d); },
        () => { const d = randInt(1, 3); const s = randInt(4 * d + 1, 20); const arr = [s, s - d, s - 2 * d, s - 3 * d]; return kqPattern(arr, arr[3] - d); },
        () => { const s = randInt(1, 3); const arr = [s, s * 2, s * 4, s * 8]; return kqPattern(arr, arr[3] * 2); },
        () => { const s = randInt(2, 6); const arr = [s, s + 2, s + 4, s + 6]; return kqPattern(arr, arr[3] + 2); }
      ];
      return pick(forms)();
    },
    pattern_g2() { // 中高年级：等差大步 / 平方 / 累加
      const forms = [
        () => { const s = randInt(2, 9), d = pick([3, 4, 5, 10]); const arr = [s, s + d, s + 2 * d, s + 3 * d]; return kqPattern(arr, arr[3] + d); },
        () => { const arr = [1, 4, 9, 16]; return kqPattern(arr, 25); },
        () => { const arr = [1, 2, 4, 8]; return kqPattern(arr, 16); },
        () => { const s = randInt(1, 4); const arr = [s, s + 1, s + 3, s + 6]; return kqPattern(arr, s + 10); }, // 差 +1,+2,+3,+4
        () => { const arr = [2, 6, 18, 54]; return kqPattern(arr, 162); } // ×3
      ];
      return pick(forms)();
    },

    // ===== 单位换算（keypad）=====
    unit_g1() { // 长度/时间/人民币基础换算
      const forms = [
        () => { const m = randInt(1, 9); return wq('' + m + ' 米 = 多少厘米？<br>（1 米 = 100 厘米）', m * 100); },
        () => { const h = randInt(1, 6); return wq('' + h + ' 小时 = 多少分钟？<br>（1 小时 = 60 分钟）', h * 60); },
        () => { const y = randInt(2, 9); return wq('' + y + ' 元 = 多少角？<br>（1 元 = 10 角）', y * 10); },
        () => { const kg = randInt(2, 9); return wq('' + kg + ' 千克 = 多少克？<br>（1 千克 = 1000 克）', kg * 1000); },
        () => { const dm = randInt(2, 9); return wq('' + dm + ' 分米 = 多少厘米？<br>（1 分米 = 10 厘米）', dm * 10); }
      ];
      return pick(forms)();
    },

    // ===== 时间计算（keypad，答案为分钟或小时）=====
    time_g1() {
      const forms = [
        () => { const start = randInt(1, 6), dur = randInt(1, 4); return wq('现在是 ' + start + ' 点🕐，再过 ' + dur + ' 小时是几点？<br>（填几点，用数字）', start + dur); },
        () => { const a = randInt(10, 40), b = randInt(5, 20); return wq('看书用了 ' + a + ' 分钟，做操用了 ' + b + ' 分钟，<br>一共用了多少分钟？', a + b); },
        () => { const total = randInt(40, 90), used = randInt(10, 30); return wq('一节课加课间共 ' + total + ' 分钟，上课 ' + used + ' 分钟🔔，<br>课间休息多少分钟？', total - used); }
      ];
      return pick(forms)();
    },

    // ===== 人民币购物（keypad，答案为元，整数）=====
    money_g1() {
      const forms = [
        () => { const p = randInt(2, 9), n = randInt(2, 5); return wq('一支冰棍🍦 ' + p + ' 元，买 ' + n + ' 支要多少元？', p * n); },
        () => { const give = randInt(20, 50), cost = randInt(5, give - 3); return wq('给了 ' + give + ' 元，买东西花了 ' + cost + ' 元，<br>应找回多少元？💰', give - cost); },
        () => { const a = randInt(3, 12), b = randInt(3, 12); return wq('买铅笔花 ' + a + ' 元，买本子花 ' + b + ' 元，<br>一共花多少元？', a + b); }
      ];
      return pick(forms)();
    }
  };

  // 找规律构造器：展示前 4 个数 + ?，答下一个
  function kqPattern(arr, answer) {
    const shown = arr.join('， ') + '， <b>?</b>';
    return { text: '找规律，问号处填几？<br><span class="shape-art">' + shown + '</span>', answer: Number(answer), inputMode: 'keypad', decimals: 0, sec: 35 };
  }

  // 应用题构造器：keypad，带 40 秒建议时长；decimals 可选
  function wq(text, answer, decimals) {
    return { text: text, answer: Number(answer), inputMode: 'keypad', decimals: decimals || 0, sec: 40 };
  }
  // 图形题（keypad）
  function kqShape(text, answer) {
    return { text: text, answer: Number(answer), inputMode: 'keypad', decimals: 0, sec: 35 };
  }
  // 图形题（choice）
  function cqShape(text, answer, options) {
    return { text: text, answer: String(answer), inputMode: 'choice', options: options, sec: 35 };
  }

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
