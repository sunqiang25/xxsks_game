// 关卡配置：星区(world) -> 关卡(level)
// 每关: id, name, type(对应 questions.js 的题型), count, emoji, star 目标
// 三星标准：accuracy(正确率) + avgTime(平均每题秒数)

(function (global) {
  'use strict';

  const WORLDS = [
    {
      id: 'w1', grade: '一年级', name: '月球基地', emoji: '🌙', color: '#8ec5ff',
      desc: '10~20以内的加减法',
      levels: [
        { id: 'w1l1', name: '10以内加法', type: 'add10', count: 10, emoji: '🚀' },
        { id: 'w1l2', name: '10以内减法', type: 'sub10', count: 10, emoji: '🛰️' },
        { id: 'w1l3', name: '20以内进位加', type: 'add20', count: 10, emoji: '⭐' },
        { id: 'w1l4', name: '20以内退位减', type: 'sub20', count: 10, emoji: '🌟' }
      ]
    },
    {
      id: 'w2', grade: '二年级', name: '火星矿场', emoji: '🔴', color: '#ff9d6c',
      desc: '100以内加减 + 乘法口诀',
      levels: [
        { id: 'w2l1', name: '100以内加法', type: 'add100', count: 10, emoji: '⛏️' },
        { id: 'w2l2', name: '100以内减法', type: 'sub100', count: 10, emoji: '🪨' },
        { id: 'w2l3', name: '乘法口诀', type: 'mulTable', count: 12, emoji: '✖️' },
        { id: 'w2l4', name: '表内除法', type: 'divTable', count: 12, emoji: '➗' }
      ]
    },
    {
      id: 'w3', grade: '三年级', name: '木星风暴', emoji: '🟠', color: '#ffd36c',
      desc: '三位数加减 + 一位数乘除',
      levels: [
        { id: 'w3l1', name: '三位数加减', type: 'addSub3', count: 10, emoji: '🌀' },
        { id: 'w3l2', name: '一位×两位数', type: 'mul1by2', count: 10, emoji: '⚡' },
        { id: 'w3l3', name: '除以一位数', type: 'divExact3', count: 10, emoji: '🌩️' }
      ]
    },
    {
      id: 'w4', grade: '四年级', name: '土星光环', emoji: '🪐', color: '#c9a0ff',
      desc: '多位数乘除 + 四则混合',
      levels: [
        { id: 'w4l1', name: '两位×两位数', type: 'mul2by2', count: 8, emoji: '💫' },
        { id: 'w4l2', name: '三位×一位数', type: 'mul3by1', count: 8, emoji: '🔮' },
        { id: 'w4l3', name: '除以两位数', type: 'divByTwo', count: 8, emoji: '🌌' },
        { id: 'w4l4', name: '四则混合', type: 'mixed4', count: 8, emoji: '🎯' }
      ]
    },
    {
      id: 'w5', grade: '五年级', name: '海王星海', emoji: '🔵', color: '#6cc6ff',
      desc: '小数运算 + 同分母分数',
      levels: [
        { id: 'w5l1', name: '小数加减', type: 'decAddSub', count: 10, emoji: '💧' },
        { id: 'w5l2', name: '小数乘法', type: 'decMul', count: 8, emoji: '🌊' },
        { id: 'w5l3', name: '同分母分数', type: 'fracSameDenom', count: 8, emoji: '❄️' }
      ]
    },
    {
      id: 'w6', grade: '六年级', name: '深空星云', emoji: '🌌', color: '#ff7eb6',
      desc: '分数乘法 + 百分数 + 综合',
      levels: [
        { id: 'w6l1', name: '分数乘法', type: 'fracMul', count: 8, emoji: '🌠' },
        { id: 'w6l2', name: '百分数', type: 'percent', count: 8, emoji: '💠' },
        { id: 'w6l3', name: '综合运算', type: 'mixedAdv', count: 8, emoji: '👑' }
      ]
    }
  ];

  // 三星评价标准（对所有关卡通用）：
  // 3星: 正确率 100%
  // 2星: 正确率 >= 80%
  // 1星: 通关(正确率 >= 60%)
  // 额外“速度奖章”：平均每题 <= FAST_SEC 秒
  const STAR_RULES = { three: 1.0, two: 0.8, one: 0.6 };
  const FAST_SEC = 6;

  function starsFor(accuracy) {
    if (accuracy >= STAR_RULES.three) return 3;
    if (accuracy >= STAR_RULES.two) return 2;
    if (accuracy >= STAR_RULES.one) return 1;
    return 0;
  }

  // 所有关卡按解锁顺序展开（跨星区连续解锁）
  function flatLevels() {
    const out = [];
    WORLDS.forEach(w => w.levels.forEach(l => out.push(Object.assign({ worldId: w.id }, l))));
    return out;
  }

  function findLevel(levelId) {
    for (const w of WORLDS) {
      for (const l of w.levels) {
        if (l.id === levelId) return Object.assign({ worldId: w.id, worldName: w.name }, l);
      }
    }
    return null;
  }

  global.Levels = {
    WORLDS: WORLDS,
    FAST_SEC: FAST_SEC,
    starsFor: starsFor,
    flatLevels: flatLevels,
    findLevel: findLevel
  };
})(window);
