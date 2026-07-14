// 科目聚合：数学 + 英语(译林 / 新思维两套教材)
// Subject: { id, name, emoji, color, tagline, worlds, gen, starsFor, fastSec, parent?, virtual? }
// 英语拆两套：en_yl(译林,偏话题交际) / en_ns(新思维,偏拼读拼写语法)，各自独立进度。
// 首页只显示 math + english(虚拟入口)；点 english 进二级页选 en_yl / en_ns。

(function (global) {
  'use strict';

  // 关卡工厂：给定 id 前缀，生成一套 6 年级关卡
  function W(prefix, defs) {
    return defs.map(function (w, wi) {
      return {
        id: prefix + 'w' + (wi + 1),
        grade: w.grade, name: w.name, emoji: w.emoji, color: w.color, desc: w.desc,
        levels: w.levels.map(function (l, li) {
          return { id: prefix + 'w' + (wi + 1) + 'l' + (li + 1), name: l[0], type: l[1], count: l[2], emoji: l[3] };
        })
      };
    });
  }

  // ---------- 译林版：话题交际为主 ----------
  var YL_WORLDS = W('yl', [
    { grade: '一年级', name: '字母星球', emoji: '🌟', color: '#8ec5ff', desc: '颜色·数字·动物·水果',
      levels: [['缤纷颜色','en_g1_color',10,'🎨'],['可爱动物','en_g1_animal',10,'🐱'],['数字 1-10','en_g1_number',10,'🔢'],['美味水果','en_g1_fruit',10,'🍎']] },
    { grade: '二年级', name: '词汇森林', emoji: '🌳', color: '#7dff9b', desc: '文具·身体·家庭·拼写',
      levels: [['学习文具','en_g2_stationery',10,'✏️'],['身体部位','en_g2_body',10,'👀'],['我的家人','en_g2_family',10,'👨‍👩‍👧'],['拼写小试','en_g2_spell',8,'🔤']] },
    { grade: '三年级', name: '交流小镇', emoji: '🏘️', color: '#ffd36c', desc: '玩具·交通·日常对话',
      levels: [['好玩玩具','en_g3_toy',10,'🧸'],['交通工具','en_g3_transport',10,'🚌'],['日常对话','en_g3_dialog',8,'💬'],['拼写进阶','en_g3_spell',8,'✍️']] },
    { grade: '四年级', name: '生活城市', emoji: '🏙️', color: '#c9a0ff', desc: '房间·衣服·职业',
      levels: [['房间物品','en_g4_room',10,'🛏️'],['各种衣服','en_g4_clothes',10,'👕'],['职业称呼','en_g4_job',10,'👩‍🏫'],['拼写挑战','en_g4_spell',8,'🔡']] },
    { grade: '五年级', name: '交际山谷', emoji: '⛰️', color: '#6cc6ff', desc: '动词·地点·情景对话',
      levels: [['动作单词','en_g5_verb',10,'🏃'],['地点场所','en_g5_place',10,'🏫'],['情景对话','en_g5_dialog',8,'🗣️'],['语法入门','en_g5_grammar',8,'📘']] },
    { grade: '六年级', name: '综合王国', emoji: '👑', color: '#ff7eb6', desc: '自然·综合对话·语法',
      levels: [['自然万物','en_g6_nature',10,'🌍'],['综合对话','en_g6_dialog',8,'💭'],['拼写高手','en_g6_spell',8,'🏆'],['语法综合','en_g6_grammar',8,'📚']] }
  ]);

  // ---------- 新思维：拼读/拼写/语法更重 ----------
  var NS_WORLDS = W('ns', [
    { grade: '一年级', name: '拼读乐园', emoji: '🔠', color: '#8ec5ff', desc: '颜色·动物·自然拼读',
      levels: [['缤纷颜色','en_g1_color',10,'🎨'],['可爱动物','en_g1_animal',10,'🐱'],['自然拼读','en_phonics',10,'🔠'],['美味水果','en_g1_fruit',10,'🍎']] },
    { grade: '二年级', name: '拼写森林', emoji: '🌳', color: '#7dff9b', desc: '文具·身体·拼读拼写',
      levels: [['学习文具','en_g2_stationery',10,'✏️'],['身体部位','en_g2_body',10,'👀'],['自然拼读','en_phonics',10,'🔠'],['拼写小试','en_g2_spell',8,'🔤']] },
    { grade: '三年级', name: '词汇小镇', emoji: '🏘️', color: '#ffd36c', desc: '玩具·交通·拼写',
      levels: [['好玩玩具','en_g3_toy',10,'🧸'],['交通工具','en_g3_transport',10,'🚌'],['拼写进阶','en_g3_spell',10,'✍️'],['日常对话','en_g3_dialog',8,'💬']] },
    { grade: '四年级', name: '构词城市', emoji: '🏙️', color: '#c9a0ff', desc: '衣服·职业·拼写挑战',
      levels: [['各种衣服','en_g4_clothes',10,'👕'],['职业称呼','en_g4_job',10,'👩‍🏫'],['房间物品','en_g4_room',10,'🛏️'],['拼写挑战','en_g4_spell',10,'🔡']] },
    { grade: '五年级', name: '语法山谷', emoji: '⛰️', color: '#6cc6ff', desc: '动词·语法·拼写',
      levels: [['动作单词','en_g5_verb',10,'🏃'],['语法入门','en_g5_grammar',10,'📘'],['地点场所','en_g5_place',10,'🏫'],['拼写强化','en_g6_spell',8,'✍️']] },
    { grade: '六年级', name: '综合王国', emoji: '👑', color: '#ff7eb6', desc: '语法·拼写·综合对话',
      levels: [['语法综合','en_g6_grammar',10,'📚'],['拼写高手','en_g6_spell',10,'🏆'],['自然万物','en_g6_nature',10,'🌍'],['综合对话','en_g6_dialog',8,'💭']] }
  ]);

  var EN_STAR = { three: 1.0, two: 0.8, one: 0.6 };
  function enStarsFor(acc) {
    if (acc >= EN_STAR.three) return 3;
    if (acc >= EN_STAR.two) return 2;
    if (acc >= EN_STAR.one) return 1;
    return 0;
  }
  function enGen(type, count) { return global.English.generate(type, count); }
  function enFast() { return 8; }

  var SUBJECTS = {
    math: {
      id: 'math', name: '口算大冒险', emoji: '🚀', color: '#ffd93d',
      tagline: '太空探险 · 1-6年级口算闯关',
      get worlds() { return global.Levels.WORLDS; },
      gen: function (t, c) { return global.Questions.generate(t, c); },
      starsFor: function (a) { return global.Levels.starsFor(a); },
      fastSec: function () { return global.Levels.FAST_SEC; }
    },
    english: {
      id: 'english', name: '英语大冒险', emoji: '🔤', color: '#6bcbff',
      tagline: '译林 / 新思维 · 点击选择教材', virtual: true,
      worlds: [], gen: enGen, starsFor: enStarsFor, fastSec: enFast
    },
    en_yl: {
      id: 'en_yl', name: '英语·译林版', emoji: '📗', color: '#7dff9b',
      tagline: '译林版 · 话题交际·单词句型', parent: 'english',
      worlds: YL_WORLDS, gen: enGen, starsFor: enStarsFor, fastSec: enFast
    },
    en_ns: {
      id: 'en_ns', name: '英语·新思维', emoji: '📘', color: '#6bcbff',
      tagline: '新思维 · 自然拼读·拼写语法', parent: 'english',
      worlds: NS_WORLDS, gen: enGen, starsFor: enStarsFor, fastSec: enFast
    }
  };

  var HOME_ORDER = ['math', 'english'];
  var EN_SUBS = ['en_yl', 'en_ns'];

  function get(id) { return SUBJECTS[id] || SUBJECTS.math; }
  function all() { return HOME_ORDER.map(function (id) { return SUBJECTS[id]; }); }
  function englishSubs() { return EN_SUBS.map(function (id) { return SUBJECTS[id]; }); }

  function findLevel(subjectId, levelId) {
    var sub = get(subjectId);
    for (var i = 0; i < sub.worlds.length; i++) {
      var w = sub.worlds[i];
      for (var j = 0; j < w.levels.length; j++) {
        if (w.levels[j].id === levelId) {
          return Object.assign({ worldId: w.id, worldName: w.name, subjectId: subjectId }, w.levels[j]);
        }
      }
    }
    return null;
  }

  function flatLevels(subjectId) {
    var sub = get(subjectId);
    var out = [];
    sub.worlds.forEach(function (w) { w.levels.forEach(function (l) { out.push(Object.assign({ worldId: w.id }, l)); }); });
    return out;
  }

  global.Subjects = {
    get: get, all: all, englishSubs: englishSubs,
    order: HOME_ORDER, enSubs: EN_SUBS,
    findLevel: findLevel, flatLevels: flatLevels,
    YL_WORLDS: YL_WORLDS, NS_WORLDS: NS_WORLDS
  };
})(window);
