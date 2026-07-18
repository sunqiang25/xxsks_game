// 进度存储：localStorage 持久化（支持数学/英语双科目分区）
// 存储结构 v2：
// {
//   subjects: {
//     math:    { levels:{[id]:{stars,best,fast,plays}}, stats:{totalCorrect,totalWrong,byType:{}} },
//     english: { levels:{...}, stats:{...} }
//   },
//   badges: [ 'math:first_win', 'english:stars10', 'combo10', ... ],  // 科目相关徽章带前缀
//   settings: { sound, theme, difficulty }
// }

(function (global) {
  'use strict';

  const KEY = 'mathQuestGame_v1';

  function emptySubject() {
    return { levels: {}, stats: { totalCorrect: 0, totalWrong: 0, byType: {} } };
  }
  function defaultState() {
    return {
      subjects: { math: emptySubject(), english: emptySubject() },
      badges: [],
      coins: 0,
      wishes: defaultWishes(),
      redeemed: [],
      settings: { sound: true, theme: 'space', difficulty: 'std' }
    };
  }

  // 预置愿望清单（家长可改）
  function defaultWishes() {
    return [
      { id: 'w_tv', name: '看电视 30 分钟', emoji: '📺', cost: 80 },
      { id: 'w_phone', name: '玩手机 15 分钟', emoji: '📱', cost: 60 },
      { id: 'w_ice', name: '买一个冰淇淋', emoji: '🍦', cost: 50 },
      { id: 'w_park', name: '周末去公园', emoji: '🏞️', cost: 200 }
    ];
  }

  // 旧版(v1,纯数学)存档迁移：{levels,badges,stats,settings} -> subjects.math
  function migrate(data) {
    if (data && data.subjects) return data; // 已是新结构
    const st = defaultState();
    if (data) {
      if (data.levels) st.subjects.math.levels = data.levels;
      if (data.stats) st.subjects.math.stats = Object.assign(st.subjects.math.stats, data.stats);
      if (Array.isArray(data.badges)) {
        // 旧徽章都是数学的，加 math: 前缀（combo10 是通用的，保留原样）
        st.badges = data.badges.map(b => (b === 'combo10' ? b : 'math:' + b));
      }
      if (data.settings) st.settings = Object.assign(st.settings, data.settings);
    }
    return st;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const data = migrate(JSON.parse(raw));
      // 补全字段，防止半旧存档缺项
      const base = defaultState();
      base.settings = Object.assign(base.settings, data.settings || {});
      base.badges = Array.isArray(data.badges) ? data.badges : [];
      base.coins = typeof data.coins === 'number' ? data.coins : 0;
      base.wishes = (Array.isArray(data.wishes) && data.wishes.length) ? data.wishes : defaultWishes();
      base.redeemed = Array.isArray(data.redeemed) ? data.redeemed : [];
      ['math', 'english'].forEach(sid => {
        const s = (data.subjects && data.subjects[sid]) || {};
        base.subjects[sid] = {
          levels: s.levels || {},
          stats: Object.assign({ totalCorrect: 0, totalWrong: 0, byType: {} }, s.stats || {})
        };
      });
      return base;
    } catch (e) {
      return defaultState();
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式忽略 */ }
  }

  function get() { return state; }
  function sub(subjectId) {
    if (!state.subjects[subjectId]) state.subjects[subjectId] = emptySubject();
    return state.subjects[subjectId];
  }

  // 关卡是否解锁：每个年级(世界)第一关直接开放；年级内前一关拿 >=1 星解锁下一关
  function isUnlocked(subjectId, levelId) {
    const worlds = global.Subjects.get(subjectId).worlds;
    for (const w of worlds) {
      const idx = w.levels.findIndex(l => l.id === levelId);
      if (idx === -1) continue;
      if (idx === 0) return true;
      const prev = w.levels[idx - 1];
      const rec = sub(subjectId).levels[prev.id];
      return !!(rec && rec.stars >= 1);
    }
    return true;
  }

  function levelRecord(subjectId, levelId) {
    return sub(subjectId).levels[levelId] || { stars: 0, best: 0, fast: false, plays: 0 };
  }

  // 从关卡 id 推年级序号(1-6)：id 形如 w3l2 / ylw3l2 / nsw3l2，取字母 w 后、l 前的数字
  function gradeOf(levelId) {
    const m = String(levelId).match(/w(\d+)l\d+/);
    const g = m ? parseInt(m[1], 10) : 1;
    return Math.min(6, Math.max(1, g));
  }

  // 金币公式：星级基数 × 年级系数 × 难度系数。只在“刷新纪录”(首通或星级提升)时发币，重玩无进步 0 币。
  //  - 星级基数：1★=5 / 2★=10 / 3★=20
  //  - 年级系数：一年级 1.0，每升一级 +0.2，六年级 2.0
  //  - 难度系数：easy 0.8 / std 1.0 / hard 1.5（选难的鼓励，多给）
  function coinFor(levelId, stars, difficulty) {
    if (stars < 1) return 0;
    const STAR_BASE = { 1: 5, 2: 10, 3: 20 };
    const gradeMult = 1.0 + (gradeOf(levelId) - 1) * 0.2;
    const DIFF_MULT = { easy: 0.8, std: 1.0, hard: 1.5 };
    const diffMult = DIFF_MULT[difficulty] || 1.0;
    return Math.max(1, Math.round((STAR_BASE[stars] || 0) * gradeMult * diffMult));
  }

  // 记录一次通关结果
  function recordResult(subjectId, levelId, type, correct, total, avgSec, difficulty) {
    const S = global.Subjects.get(subjectId);
    const accuracy = total > 0 ? correct / total : 0;
    const stars = S.starsFor(accuracy);
    const prev = levelRecord(subjectId, levelId);
    const score = Math.round(accuracy * 100);
    const fastSec = S.fastSec();

    const rec = {
      stars: Math.max(prev.stars, stars),
      best: Math.max(prev.best, score),
      fast: prev.fast || (avgSec <= fastSec && accuracy >= 0.8),
      plays: prev.plays + 1
    };
    const improved = stars > prev.stars || score > prev.best;
    sub(subjectId).levels[levelId] = rec;

    // ---- 金币奖励：只在“刷新星级纪录”时按 星级×年级×难度 发币，重玩无进步 = 0 币（杜绝刷简单题攒币）----
    let coinsEarned = 0;
    const brokeRecord = stars >= 1 && (prev.plays === 0 || stars > prev.stars); // 首通 或 星级提升
    if (brokeRecord) {
      coinsEarned = coinFor(levelId, stars, difficulty);
      state.coins = (state.coins || 0) + coinsEarned;
    }

    const st = sub(subjectId).stats;
    st.totalCorrect += correct;
    st.totalWrong += (total - correct);
    if (!st.byType[type]) st.byType[type] = { correct: 0, wrong: 0 };
    st.byType[type].correct += correct;
    st.byType[type].wrong += (total - correct);

    const newBadges = checkBadges(subjectId);
    save();
    return {
      newStars: stars, storedStars: rec.stars, improved: improved,
      newBadges: newBadges, fast: rec.fast, coinsEarned: coinsEarned,
      replayNoCoin: stars >= 1 && !brokeRecord // 通关了但没刷新纪录、没发币
    };
  }

  // ---------- 星数统计（按科目） ----------
  function totalStars(subjectId) {
    return Object.values(sub(subjectId).levels).reduce((s, r) => s + (r.stars || 0), 0);
  }
  function maxStars(subjectId) {
    return global.Subjects.flatLevels(subjectId).length * 3;
  }
  function perfectCount(subjectId) {
    return Object.values(sub(subjectId).levels).filter(r => r.stars === 3).length;
  }
  function worldCleared(subjectId, worldId) {
    const w = global.Subjects.get(subjectId).worlds.find(x => x.id === worldId);
    if (!w) return false;
    return w.levels.every(l => (sub(subjectId).levels[l.id] && sub(subjectId).levels[l.id].stars >= 1));
  }

  // ---------- 徽章（科目相关的带 subjectId: 前缀）----------
  // 每科通用徽章模板
  const BADGE_TPL = [
    { id: 'first_win', name: '首次通关', emoji: '🎖️', test: (sid) => totalStars(sid) >= 1 },
    { id: 'stars10', name: '集星达人', emoji: '⭐', test: (sid) => totalStars(sid) >= 10 },
    { id: 'stars30', name: '星光闪耀', emoji: '🌟', test: (sid) => totalStars(sid) >= 30 },
    { id: 'all_clear', name: '全科满星', emoji: '👑', test: (sid) => totalStars(sid) >= maxStars(sid) },
    { id: 'perfect5', name: '五连满星', emoji: '💯', test: (sid) => perfectCount(sid) >= 5 }
  ];

  function checkBadges(subjectId) {
    const earned = [];
    for (const b of BADGE_TPL) {
      const key = subjectId + ':' + b.id;
      if (!state.badges.includes(key) && b.test(subjectId)) {
        state.badges.push(key);
        earned.push(Object.assign({}, b, { id: key }));
      }
    }
    return earned;
  }

  // combo 徽章（通用，不分科）
  function grantComboBadge(combo) {
    const earned = [];
    if (combo >= 10 && !state.badges.includes('combo10')) {
      state.badges.push('combo10');
      earned.push({ id: 'combo10', name: '十连击', emoji: '🔥' });
      save();
    }
    return earned;
  }

  // 某科目的徽章定义列表（用于徽章墙展示）
  function badgeDefs(subjectId) {
    const list = BADGE_TPL.map(b => Object.assign({}, b, { id: subjectId + ':' + b.id }));
    list.push({ id: 'combo10', name: '十连击', emoji: '🔥' });
    return list;
  }
  function hasBadge(id) { return state.badges.includes(id); }

  // 最薄弱题型（按科目）
  function weakestType(subjectId) {
    let worst = null, worstRate = -1;
    const byType = sub(subjectId).stats.byType;
    for (const [type, rec] of Object.entries(byType)) {
      const total = rec.correct + rec.wrong;
      if (total < 5) continue;
      const rate = rec.wrong / total;
      if (rate > worstRate && rate > 0) { worstRate = rate; worst = type; }
    }
    return worst ? { type: worst, wrongRate: worstRate } : null;
  }

  function totalCorrectOf(subjectId) { return sub(subjectId).stats.totalCorrect; }

  function setSetting(key, value) {
    state.settings[key] = value;
    save();
  }

  // ---------- 金币 & 愿望清单 ----------
  function getCoins() { return state.coins || 0; }
  function spendCoins(n) {
    n = Math.max(0, Math.floor(n || 0));
    if ((state.coins || 0) < n) return false;
    state.coins -= n;
    save();
    return true;
  }
  function getWishes() { return Array.isArray(state.wishes) ? state.wishes : []; }
  function setWishes(arr) {
    if (Array.isArray(arr)) { state.wishes = arr; save(); }
  }
  function getRedeemed() { return Array.isArray(state.redeemed) ? state.redeemed : []; }
  function pushRedeemed(entry) {
    if (!Array.isArray(state.redeemed)) state.redeemed = [];
    state.redeemed.unshift(entry); // 最新的在前
    if (state.redeemed.length > 50) state.redeemed.length = 50; // 只留最近 50 条
    save();
  }

  // ---------- 存档备份/恢复（防换设备、防浏览器清缓存丢进度）----------
  // 导出：把整个存档编码成一串“存档码”（Base64，家长可复制保存）
  function exportSave() {
    try {
      const json = JSON.stringify(state);
      // encodeURIComponent 先处理中文，再 btoa 转 Base64
      return 'XXSKS1' + btoa(unescape(encodeURIComponent(json)));
    } catch (e) { return ''; }
  }
  // 导入：粘回存档码，成功则覆盖当前进度并返回 true
  function importSave(code) {
    try {
      const raw = String(code || '').trim();
      if (raw.indexOf('XXSKS1') !== 0) return false;
      const json = decodeURIComponent(escape(atob(raw.slice(6))));
      const data = JSON.parse(json);
      if (!data || typeof data !== 'object') return false;
      // 走一遍 migrate + 字段补全，保证结构安全
      const migrated = migrate(data);
      localStorage.setItem(KEY, JSON.stringify(migrated));
      state = load();
      return true;
    } catch (e) { return false; }
  }

  // 清空：可指定科目，不传则全清
  function reset(subjectId) {
    if (subjectId) {
      state.subjects[subjectId] = emptySubject();
      state.badges = state.badges.filter(b => b.indexOf(subjectId + ':') !== 0);
    } else {
      state = defaultState();
    }
    save();
  }

  global.Store = {
    get: get,
    save: save,
    isUnlocked: isUnlocked,
    levelRecord: levelRecord,
    recordResult: recordResult,
    grantComboBadge: grantComboBadge,
    badgeDefs: badgeDefs,
    hasBadge: hasBadge,
    totalStars: totalStars,
    maxStars: maxStars,
    weakestType: weakestType,
    worldCleared: worldCleared,
    totalCorrectOf: totalCorrectOf,
    setSetting: setSetting,
    getCoins: getCoins,
    spendCoins: spendCoins,
    getWishes: getWishes,
    setWishes: setWishes,
    getRedeemed: getRedeemed,
    pushRedeemed: pushRedeemed,
    exportSave: exportSave,
    importSave: importSave,
    reset: reset
  };
})(window);
