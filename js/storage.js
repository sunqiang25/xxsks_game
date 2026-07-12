// 进度存储：localStorage 持久化
// 存储结构：
// {
//   levels: { [levelId]: { stars, best, fast, plays } },
//   badges: [ 'first_win', 'combo10', ... ],
//   stats:  { totalCorrect, totalWrong, byType: { [type]:{correct,wrong} } },
//   settings: { sound: true, theme: 'space' }
// }

(function (global) {
  'use strict';

  const KEY = 'mathQuestGame_v1';

  const DEFAULT = {
    levels: {},
    badges: [],
    stats: { totalCorrect: 0, totalWrong: 0, byType: {} },
    settings: { sound: true, theme: 'space', timeLimit: 0 }
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const data = JSON.parse(raw);
      // 合并默认字段，防止旧存档缺字段
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT)), data, {
        settings: Object.assign({}, DEFAULT.settings, data.settings || {}),
        stats: Object.assign({}, DEFAULT.stats, data.stats || {})
      });
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式忽略 */ }
  }

  function get() { return state; }

  // 关卡是否解锁：第一关永远解锁，其余需前一关拿到 >=1 星
  function isUnlocked(levelId) {
    const flat = global.Levels.flatLevels();
    const idx = flat.findIndex(l => l.id === levelId);
    if (idx <= 0) return true;
    const prev = flat[idx - 1];
    const rec = state.levels[prev.id];
    return !!(rec && rec.stars >= 1);
  }

  function levelRecord(levelId) {
    return state.levels[levelId] || { stars: 0, best: 0, fast: false, plays: 0 };
  }

  // 记录一次通关结果，返回 { newStars, improved, newBadges }
  function recordResult(levelId, type, correct, total, avgSec) {
    const accuracy = total > 0 ? correct / total : 0;
    const stars = global.Levels.starsFor(accuracy);
    const prev = levelRecord(levelId);
    const score = Math.round(accuracy * 100);

    const rec = {
      stars: Math.max(prev.stars, stars),
      best: Math.max(prev.best, score),
      fast: prev.fast || (avgSec <= global.Levels.FAST_SEC && accuracy >= 0.8),
      plays: prev.plays + 1
    };
    const improved = stars > prev.stars || score > prev.best;
    state.levels[levelId] = rec;

    // 统计
    state.stats.totalCorrect += correct;
    state.stats.totalWrong += (total - correct);
    if (!state.stats.byType[type]) state.stats.byType[type] = { correct: 0, wrong: 0 };
    state.stats.byType[type].correct += correct;
    state.stats.byType[type].wrong += (total - correct);

    const newBadges = checkBadges();
    save();
    return { newStars: stars, storedStars: rec.stars, improved: improved, newBadges: newBadges, fast: rec.fast };
  }

  // 徽章检查
  const BADGE_DEFS = [
    { id: 'first_win', name: '首次通关', emoji: '🎖️', test: s => totalStars() >= 1 },
    { id: 'stars10', name: '集星达人', emoji: '⭐', test: s => totalStars() >= 10 },
    { id: 'stars30', name: '星光闪耀', emoji: '🌟', test: s => totalStars() >= 30 },
    { id: 'stars_all', name: '宇宙之王', emoji: '👑', test: s => totalStars() >= maxStars() },
    { id: 'w1_clear', name: '月球毕业', emoji: '🌙', test: s => worldCleared('w1') },
    { id: 'w2_clear', name: '火星毕业', emoji: '🔴', test: s => worldCleared('w2') },
    { id: 'perfect5', name: '五连满星', emoji: '💯', test: s => perfectCount() >= 5 }
  ];

  function totalStars() {
    return Object.values(state.levels).reduce((sum, r) => sum + (r.stars || 0), 0);
  }
  function maxStars() {
    return global.Levels.flatLevels().length * 3;
  }
  function perfectCount() {
    return Object.values(state.levels).filter(r => r.stars === 3).length;
  }
  function worldCleared(worldId) {
    const w = global.Levels.WORLDS.find(x => x.id === worldId);
    if (!w) return false;
    return w.levels.every(l => (state.levels[l.id] && state.levels[l.id].stars >= 1));
  }

  function checkBadges() {
    const earned = [];
    for (const b of BADGE_DEFS) {
      if (!state.badges.includes(b.id) && b.test(state)) {
        state.badges.push(b.id);
        earned.push(b);
      }
    }
    return earned;
  }

  // combo 徽章（答题过程中触发）
  function grantComboBadge(combo) {
    const earned = [];
    if (combo >= 10 && !state.badges.includes('combo10')) {
      state.badges.push('combo10');
      earned.push({ id: 'combo10', name: '十连击', emoji: '🔥' });
      save();
    }
    return earned;
  }

  function badgeDefs() { return BADGE_DEFS.concat([{ id: 'combo10', name: '十连击', emoji: '🔥' }]); }
  function hasBadge(id) { return state.badges.includes(id); }

  // 找出最薄弱的题型（错误率最高，且做过 >=5 题）
  function weakestType() {
    let worst = null, worstRate = -1;
    for (const [type, rec] of Object.entries(state.stats.byType)) {
      const total = rec.correct + rec.wrong;
      if (total < 5) continue;
      const rate = rec.wrong / total;
      if (rate > worstRate && rate > 0) { worstRate = rate; worst = type; }
    }
    return worst ? { type: worst, wrongRate: worstRate } : null;
  }

  function setSetting(key, value) {
    state.settings[key] = value;
    save();
  }

  function reset() {
    state = JSON.parse(JSON.stringify(DEFAULT));
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
    setSetting: setSetting,
    reset: reset
  };
})(window);
