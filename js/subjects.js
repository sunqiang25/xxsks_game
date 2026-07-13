// 科目聚合：把「数学(Levels)」与「英语(English)」统一成 Subject 接口
// 每个 Subject: { id, name, emoji, color, tagline, worlds, gen(type,count), starsFor(acc), fastSec }
// game.js / storage.js 通过 Subjects 工作，实现双科并列、各自独立进度。

(function (global) {
  'use strict';

  // ---------- 英语关卡结构：6 个年级(world)，每年级若干关 ----------
  // type 对应 english.js 里的 GEN key
  const EN_WORLDS = [
    {
      id: 'e1', grade: '一年级', name: '字母星球', emoji: '🌟', color: '#8ec5ff',
      desc: '颜色·数字·动物·水果',
      levels: [
        { id: 'e1l1', name: '缤纷颜色', type: 'en_g1_color', count: 10, emoji: '🎨' },
        { id: 'e1l2', name: '可爱动物', type: 'en_g1_animal', count: 10, emoji: '🐱' },
        { id: 'e1l3', name: '数字 1-10', type: 'en_g1_number', count: 10, emoji: '🔢' },
        { id: 'e1l4', name: '美味水果', type: 'en_g1_fruit', count: 10, emoji: '🍎' }
      ]
    },
    {
      id: 'e2', grade: '二年级', name: '词汇森林', emoji: '🌳', color: '#7dff9b',
      desc: '文具·身体·家庭 + 拼写',
      levels: [
        { id: 'e2l1', name: '学习文具', type: 'en_g2_stationery', count: 10, emoji: '✏️' },
        { id: 'e2l2', name: '身体部位', type: 'en_g2_body', count: 10, emoji: '👀' },
        { id: 'e2l3', name: '我的家人', type: 'en_g2_family', count: 10, emoji: '👨‍👩‍👧' },
        { id: 'e2l4', name: '拼写小试', type: 'en_g2_spell', count: 8, emoji: '🔤' }
      ]
    },
    {
      id: 'e3', grade: '三年级', name: '交流小镇', emoji: '🏘️', color: '#ffd36c',
      desc: '玩具·交通·拼写·对话',
      levels: [
        { id: 'e3l1', name: '好玩玩具', type: 'en_g3_toy', count: 10, emoji: '🧸' },
        { id: 'e3l2', name: '交通工具', type: 'en_g3_transport', count: 10, emoji: '🚌' },
        { id: 'e3l3', name: '拼写进阶', type: 'en_g3_spell', count: 8, emoji: '✍️' },
        { id: 'e3l4', name: '日常对话', type: 'en_g3_dialog', count: 8, emoji: '💬' }
      ]
    },
    {
      id: 'e4', grade: '四年级', name: '生活城市', emoji: '🏙️', color: '#c9a0ff',
      desc: '房间·衣服·职业 + 拼写',
      levels: [
        { id: 'e4l1', name: '房间物品', type: 'en_g4_room', count: 10, emoji: '🛏️' },
        { id: 'e4l2', name: '各种衣服', type: 'en_g4_clothes', count: 10, emoji: '👕' },
        { id: 'e4l3', name: '职业称呼', type: 'en_g4_job', count: 10, emoji: '👩‍🏫' },
        { id: 'e4l4', name: '拼写挑战', type: 'en_g4_spell', count: 8, emoji: '🔡' }
      ]
    },
    {
      id: 'e5', grade: '五年级', name: '语法山谷', emoji: '⛰️', color: '#6cc6ff',
      desc: '动词·地点·对话·语法',
      levels: [
        { id: 'e5l1', name: '动作单词', type: 'en_g5_verb', count: 10, emoji: '🏃' },
        { id: 'e5l2', name: '地点场所', type: 'en_g5_place', count: 10, emoji: '🏫' },
        { id: 'e5l3', name: '情景对话', type: 'en_g5_dialog', count: 8, emoji: '🗣️' },
        { id: 'e5l4', name: '语法入门', type: 'en_g5_grammar', count: 8, emoji: '📘' }
      ]
    },
    {
      id: 'e6', grade: '六年级', name: '综合王国', emoji: '👑', color: '#ff7eb6',
      desc: '自然·拼写·对话·语法综合',
      levels: [
        { id: 'e6l1', name: '自然万物', type: 'en_g6_nature', count: 10, emoji: '🌍' },
        { id: 'e6l2', name: '拼写高手', type: 'en_g6_spell', count: 8, emoji: '🏆' },
        { id: 'e6l3', name: '综合对话', type: 'en_g6_dialog', count: 8, emoji: '💭' },
        { id: 'e6l4', name: '语法综合', type: 'en_g6_grammar', count: 8, emoji: '📚' }
      ]
    }
  ];

  // 英语三星标准
  const EN_STAR = { three: 1.0, two: 0.8, one: 0.6 };
  function enStarsFor(acc) {
    if (acc >= EN_STAR.three) return 3;
    if (acc >= EN_STAR.two) return 2;
    if (acc >= EN_STAR.one) return 1;
    return 0;
  }

  // ---------- 两个 Subject ----------
  const SUBJECTS = {
    math: {
      id: 'math',
      name: '口算大冒险',
      emoji: '🚀',
      color: '#ffd93d',
      tagline: '太空探险 · 1-6年级口算闯关',
      get worlds() { return global.Levels.WORLDS; },
      gen: function (type, count) { return global.Questions.generate(type, count); },
      starsFor: function (acc) { return global.Levels.starsFor(acc); },
      fastSec: function () { return global.Levels.FAST_SEC; }
    },
    english: {
      id: 'english',
      name: '英语大冒险',
      emoji: '🔤',
      color: '#6bcbff',
      tagline: '译林·新思维 · 单词句型闯关',
      worlds: EN_WORLDS,
      gen: function (type, count) { return global.English.generate(type, count); },
      starsFor: enStarsFor,
      fastSec: function () { return 8; }
    }
  };

  const ORDER = ['math', 'english'];

  function get(id) { return SUBJECTS[id] || SUBJECTS.math; }
  function all() { return ORDER.map(id => SUBJECTS[id]); }

  function findLevel(subjectId, levelId) {
    const sub = get(subjectId);
    for (const w of sub.worlds) {
      for (const l of w.levels) {
        if (l.id === levelId) {
          return Object.assign({ worldId: w.id, worldName: w.name, subjectId: subjectId }, l);
        }
      }
    }
    return null;
  }

  function flatLevels(subjectId) {
    const sub = get(subjectId);
    const out = [];
    sub.worlds.forEach(w => w.levels.forEach(l => out.push(Object.assign({ worldId: w.id }, l))));
    return out;
  }

  global.Subjects = {
    get: get,
    all: all,
    order: ORDER,
    findLevel: findLevel,
    flatLevels: flatLevels,
    EN_WORLDS: EN_WORLDS
  };
})(window);
