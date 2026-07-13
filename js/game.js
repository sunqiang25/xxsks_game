// 游戏主逻辑：屏幕切换、地图、答题、结算
(function (global) {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const app = () => $('#app');

  // 当前答题会话
  let session = null;

  // ---------- 屏幕切换 ----------
  function show(html) {
    const root = app();
    root.innerHTML = html;
    root.scrollTop = 0;
  }

  function emojiStars(n) {
    return '★★★'.slice(0, n).padEnd(3, '☆');
  }

  // ================= 主菜单 / 地图 =================
  function renderMap() {
    stopTimer();
    session = null;
    const total = Store.totalStars();
    const max = Store.maxStars();
    let worldsHtml = '';

    Levels.WORLDS.forEach(w => {
      let levelsHtml = '';
      w.levels.forEach(l => {
        const unlocked = Store.isUnlocked(l.id);
        const rec = Store.levelRecord(l.id);
        const stars = rec.stars || 0;
        const cls = 'node' + (unlocked ? '' : ' locked') + (stars === 3 ? ' perfect' : '');
        const starHtml = unlocked
          ? '<span class="node-stars">' + renderStarIcons(stars) + '</span>'
          : '<span class="lock">🔒</span>';
        levelsHtml +=
          '<button class="' + cls + '" ' + (unlocked ? '' : 'disabled') +
          ' data-level="' + l.id + '" title="' + l.name + '">' +
            '<span class="node-emoji">' + (unlocked ? l.emoji : '🔒') + '</span>' +
            '<span class="node-name">' + l.name + '</span>' +
            starHtml +
          '</button>';
      });
      worldsHtml +=
        '<section class="world" style="--wc:' + w.color + '">' +
          '<div class="world-head">' +
            '<span class="world-emoji">' + w.emoji + '</span>' +
            '<div><h2>' + w.name + '</h2><p>' + w.grade + ' · ' + w.desc + '</p></div>' +
          '</div>' +
          '<div class="nodes">' + levelsHtml + '</div>' +
        '</section>';
    });

    show(
      '<header class="topbar">' +
        '<div class="brand">🚀 口算太空大冒险</div>' +
        '<div class="topbar-right">' +
          '<span class="star-count">⭐ ' + total + ' / ' + max + '</span>' +
          '<button class="icon-btn" id="btnBadges" title="徽章墙">🏅</button>' +
          '<button class="icon-btn" id="btnSound" title="音效开关">' + (Store.get().settings.sound ? '🔊' : '🔇') + '</button>' +
          '<button class="icon-btn" id="btnMenu" title="更多">⚙️</button>' +
        '</div>' +
      '</header>' +
      '<div class="map">' + worldsHtml + '</div>' +
      '<footer class="tip">💡 小提示：连续答对可以触发连击加分哦！</footer>'
    );

    $$('.node:not(.locked)').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.unlock();
        Sound.SFX.click();
        renderLevelIntro(btn.dataset.level);
      });
    });
    $('#btnBadges').addEventListener('click', () => { Sound.SFX.click(); renderBadges(); });
    $('#btnSound').addEventListener('click', toggleSound);
    $('#btnMenu').addEventListener('click', () => { Sound.SFX.click(); renderMenu(); });
  }

  function renderStarIcons(n) {
    let s = '';
    for (let i = 0; i < 3; i++) s += '<i class="star' + (i < n ? ' on' : '') + '">★</i>';
    return s;
  }

  function toggleSound() {
    const cur = Store.get().settings.sound;
    Store.setSetting('sound', !cur);
    Sound.unlock();
    if (!cur) Sound.SFX.click();
    $('#btnSound').textContent = !cur ? '🔊' : '🔇';
  }

  // ================= 关卡开始前介绍 =================
  function renderLevelIntro(levelId) {
    const level = Levels.findLevel(levelId);
    const rec = Store.levelRecord(levelId);
    const savedLimit = Store.get().settings.timeLimit || 0;
    const TIME_OPTS = [
      { v: 0, label: '不限时', emoji: '🐢' },
      { v: 5, label: '5秒', emoji: '⚡' },
      { v: 10, label: '10秒', emoji: '🔥' },
      { v: 20, label: '20秒', emoji: '⏱️' },
      { v: 30, label: '30秒', emoji: '🕐' }
    ];
    const timeBtns = TIME_OPTS.map(o =>
      '<button class="time-opt' + (o.v === savedLimit ? ' active' : '') + '" data-t="' + o.v + '">' +
        '<span class="time-emoji">' + o.emoji + '</span>' + o.label +
      '</button>'
    ).join('');

    show(
      '<div class="screen center">' +
        '<div class="intro-card pop">' +
          '<div class="intro-emoji">' + level.emoji + '</div>' +
          '<h1>' + level.name + '</h1>' +
          '<p class="intro-sub">' + level.worldName + ' · 共 ' + level.count + ' 题</p>' +
          '<div class="intro-stars">当前最好：' + renderStarIcons(rec.stars || 0) +
            (rec.best ? ' <span class="best">最高分 ' + rec.best + '</span>' : '') + '</div>' +
          '<div class="time-picker">' +
            '<div class="time-label">⏳ 每题倒计时</div>' +
            '<div class="time-opts">' + timeBtns + '</div>' +
          '</div>' +
          '<div class="intro-rules">🎯 全对得 <b>3⭐</b>　答对八成 <b>2⭐</b>　过关 <b>1⭐</b></div>' +
          '<div class="intro-btns">' +
            '<button class="btn primary big" id="btnStart">开始闯关 🚀</button>' +
            '<button class="btn ghost" id="btnBack">返回地图</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    $$('.time-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.SFX.click();
        $$('.time-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Store.setSetting('timeLimit', parseInt(btn.dataset.t, 10));
      });
    });
    $('#btnStart').addEventListener('click', () => { Sound.SFX.click(); startLevel(level); });
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }

  // ================= 答题会话 =================
  function startLevel(level) {
    const questions = Questions.generate(level.type, level.count);
    session = {
      level: level,
      questions: questions,
      idx: 0,
      correct: 0,
      wrong: 0,
      combo: 0,
      maxCombo: 0,
      score: 0,
      startAt: performance.now(),
      timeLimit: Store.get().settings.timeLimit || 0,
      timedOut: 0,
      wrongItems: []
    };
    renderQuestion();
  }

  function renderQuestion() {
    const s = session;
    const q = s.questions[s.idx];
    const progress = Math.round((s.idx / s.questions.length) * 100);

    let inputArea;
    if (q.inputMode === 'choice') {
      inputArea =
        '<div class="choices">' +
          q.options.map((o, i) =>
            '<button class="choice" data-val="' + encodeURIComponent(o) + '">' +
              '<span class="choice-key">' + 'ABCD'[i] + '</span>' + o +
            '</button>'
          ).join('') +
        '</div>';
    } else {
      inputArea =
        '<div class="answer-box">' +
          '<div class="answer-display" id="ansDisplay"><span class="placeholder">?</span></div>' +
          keypadHtml(q) +
        '</div>';
    }

    show(
      '<div class="quiz">' +
        '<div class="quiz-top">' +
          '<button class="icon-btn" id="btnQuit" title="退出">✖</button>' +
          '<div class="pbar"><div class="pbar-fill" style="width:' + progress + '%"></div></div>' +
          '<div class="qcount">' + (s.idx + 1) + '/' + s.questions.length + '</div>' +
        '</div>' +
        (s.timeLimit > 0 ? timerHtml(s.timeLimit) : '') +
        '<div class="combo-area">' + comboHtml(s.combo) + '</div>' +
        '<div class="question pop" id="qText">' + q.text + ' =</div>' +
        inputArea +
        '<div class="feedback" id="feedback"></div>' +
      '</div>'
    );

    $('#btnQuit').addEventListener('click', () => {
      Sound.SFX.click();
      stopTimer();
      if (confirm('确定退出本关吗？进度不会保存哦～')) renderMap();
      else if (s.timeLimit > 0 && !s.locked) startTimer(); // 取消退出则恢复计时
    });

    if (q.inputMode === 'choice') {
      $$('.choice').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = decodeURIComponent(btn.dataset.val);
          submitAnswer(val, btn);
        });
      });
    } else {
      bindKeypad(q);
    }
    s.qStartAt = performance.now();
    if (s.timeLimit > 0) startTimer();
  }

  // ---------- 倒计时 ----------
  function timerHtml(limit) {
    return '<div class="timer" id="timer">' +
      '<svg viewBox="0 0 44 44" class="timer-ring">' +
        '<circle class="timer-track" cx="22" cy="22" r="19"></circle>' +
        '<circle class="timer-arc" id="timerArc" cx="22" cy="22" r="19"></circle>' +
      '</svg>' +
      '<span class="timer-num" id="timerNum">' + limit + '</span>' +
    '</div>';
  }

  function startTimer() {
    const s = session;
    if (!s || s.timeLimit <= 0) return;
    stopTimer();
    const arc = $('#timerArc');
    const numEl = $('#timerNum');
    const timerEl = $('#timer');
    const CIRC = 2 * Math.PI * 19; // 周长
    if (arc) { arc.style.strokeDasharray = CIRC; arc.style.strokeDashoffset = '0'; }

    const totalMs = s.timeLimit * 1000;
    s.timerStart = performance.now();
    let lastTick = s.timeLimit;

    s._timer = setInterval(() => {
      const elapsed = performance.now() - s.timerStart;
      const remain = Math.max(0, totalMs - elapsed);
      const ratio = remain / totalMs;
      const secLeft = Math.ceil(remain / 1000);

      if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - ratio));
      if (numEl) numEl.textContent = secLeft;

      // 最后 3 秒告警：变红 + 每秒滴答
      if (timerEl) {
        if (secLeft <= 3 && remain > 0) {
          timerEl.classList.add('danger');
          if (secLeft !== lastTick) Sound.SFX.tick();
        } else {
          timerEl.classList.remove('danger');
        }
      }
      lastTick = secLeft;

      if (remain <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 100);
  }

  function stopTimer() {
    if (session && session._timer) {
      clearInterval(session._timer);
      session._timer = null;
    }
  }

  function onTimeout() {
    const s = session;
    if (!s || s.locked) return;
    s.timedOut++;
    submitAnswer(null, null, true); // 第三参数标记超时
  }

  function comboHtml(combo) {
    if (combo < 2) return '';
    return '<div class="combo-badge pop">🔥 连击 ×' + combo + '</div>';
  }

  // ---------- keypad ----------
  function keypadHtml(q) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let grid = keys.map(k => '<button class="key" data-k="' + k + '">' + k + '</button>').join('');
    // 底排：小数点(按需) / 0 / 退格
    const dot = q.decimals > 0 ? '<button class="key" data-k=".">.</button>' : '<button class="key ghostkey" disabled></button>';
    grid += dot + '<button class="key" data-k="0">0</button>' +
            '<button class="key back" data-k="back">⌫</button>';
    return '<div class="keypad">' + grid + '</div>' +
           '<button class="btn primary big" id="btnSubmit" disabled>确定</button>';
  }

  function bindKeypad(q) {
    let val = '';
    const display = $('#ansDisplay');
    const submit = $('#btnSubmit');

    function refresh() {
      display.innerHTML = val === '' ? '<span class="placeholder">?</span>' : val;
      submit.disabled = val === '' || val === '.' || val === '-';
    }
    $$('.key').forEach(key => {
      key.addEventListener('click', () => {
        const k = key.dataset.k;
        if (k === 'back') { val = val.slice(0, -1); }
        else if (k === '.') { if (!val.includes('.') && val !== '') val += '.'; }
        else { if (val.length < 8) val += k; }
        Sound.SFX.click();
        refresh();
      });
    });
    submit.addEventListener('click', () => submitAnswer(val, submit));

    // 物理键盘支持
    const onKey = (e) => {
      if (!session) return;
      if (e.key >= '0' && e.key <= '9') { if (val.length < 8) val += e.key; refresh(); }
      else if (e.key === '.' && q.decimals > 0) { if (!val.includes('.') && val !== '') { val += '.'; refresh(); } }
      else if (e.key === 'Backspace') { val = val.slice(0, -1); refresh(); }
      else if (e.key === 'Enter' && !submit.disabled) { submitAnswer(val, submit); }
    };
    document.addEventListener('keydown', onKey);
    session._keyHandler = onKey;
    refresh();
  }

  function clearKeyHandler() {
    if (session && session._keyHandler) {
      document.removeEventListener('keydown', session._keyHandler);
      session._keyHandler = null;
    }
  }

  // ---------- 判定 ----------
  function submitAnswer(rawVal, srcEl, isTimeout) {
    const s = session;
    if (!s || s.locked) return;
    s.locked = true;
    stopTimer();
    clearKeyHandler();

    const q = s.questions[s.idx];
    const isCorrect = !isTimeout && checkAnswer(q, rawVal);
    const fb = $('#feedback');

    if (isCorrect) {
      s.correct++;
      s.combo++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      const bonus = s.combo >= 2 ? (s.combo - 1) * 2 : 0;
      s.score += 10 + bonus;
      if (s.combo >= 2) Sound.SFX.combo(s.combo); else Sound.SFX.correct();

      const comboBadges = Store.grantComboBadge(s.combo);
      fb.innerHTML = '<div class="fb ok pop">✅ 太棒了！' + (bonus ? ' <span class="bonus">连击+' + bonus + '</span>' : '') + '</div>';
      if (srcEl) srcEl.classList.add('correct-flash');
      spawnStars();
      if (comboBadges.length) toastBadge(comboBadges[0]);
    } else {
      s.wrong++;
      s.combo = 0;
      s.wrongItems.push({ text: q.text, answer: displayAnswer(q) });
      Sound.SFX.wrong();
      const reason = isTimeout ? '⏰ 时间到！正确答案是 <b>' : '❌ 正确答案是 <b>';
      fb.innerHTML = '<div class="fb no pop">' + reason + displayAnswer(q) + '</b></div>';
      if (srcEl) srcEl.classList.add('wrong-flash');
      shake();
      // 超时也高亮计时器
      const timerEl = $('#timer');
      if (timerEl) timerEl.classList.add('danger');
      // 高亮正确选项
      if (q.inputMode === 'choice') {
        $$('.choice').forEach(b => {
          if (decodeURIComponent(b.dataset.val) === String(q.answer)) b.classList.add('correct-flash');
          b.disabled = true;
        });
      }
    }
    // 禁用输入
    $$('.key, .choice, #btnSubmit').forEach(b => b.disabled = true);

    const delay = isCorrect ? 750 : 1500;
    setTimeout(() => {
      s.idx++;
      s.locked = false;
      if (s.idx >= s.questions.length) finishLevel();
      else renderQuestion();
    }, delay);
  }

  function checkAnswer(q, rawVal) {
    if (q.inputMode === 'choice') return String(rawVal) === String(q.answer);
    const num = parseFloat(rawVal);
    if (isNaN(num)) return false;
    if (q.decimals > 0) return Math.abs(num - q.answer) < 0.001;
    return num === q.answer;
  }

  function displayAnswer(q) {
    if (q.inputMode === 'choice') return String(q.answer);
    return q.decimals > 0 ? q.answer.toFixed(q.decimals) : String(q.answer);
  }

  // ================= 结算 =================
  function finishLevel() {
    const s = session;
    stopTimer();
    clearKeyHandler();
    const total = s.questions.length;
    const accuracy = s.correct / total;
    const elapsed = (performance.now() - s.startAt) / 1000;
    const avgSec = elapsed / total;
    const result = Store.recordResult(s.level.id, s.level.type, s.correct, total, avgSec);
    const stars = result.newStars;

    if (stars >= 1) Sound.SFX.win(); else Sound.SFX.wrong();

    const nextLevel = getNextLevel(s.level.id);
    const canNext = nextLevel && Store.isUnlocked(nextLevel.id);

    let badgeHtml = '';
    if (result.newBadges && result.newBadges.length) {
      badgeHtml = '<div class="earned-badges">' +
        result.newBadges.map(b => '<span class="earned pop">' + b.emoji + ' ' + b.name + '</span>').join('') +
        '</div>';
      setTimeout(() => Sound.SFX.badge(), 600);
    }

    const wrongReview = s.wrongItems.length
      ? '<details class="wrong-review"><summary>看看错题 (' + s.wrongItems.length + ')</summary>' +
        s.wrongItems.map(w => '<div class="wrong-row">' + w.text + ' = <b>' + w.answer + '</b></div>').join('') +
        '</details>'
      : '<div class="all-correct">🎉 全部答对，太厉害啦！</div>';

    show(
      '<div class="screen center">' +
        '<div class="result-card pop">' +
          '<div class="result-stars" id="resultStars">' + bigStars(stars) + '</div>' +
          '<h1>' + (stars >= 1 ? '闯关成功！' : '再试一次吧') + '</h1>' +
          (s.timeLimit > 0 ? '<div class="mode-tag">⏳ 限时模式 · 每题 ' + s.timeLimit + ' 秒</div>' : '') +
          '<div class="result-stats">' +
            '<div><span>' + s.correct + '/' + total + '</span>答对</div>' +
            '<div><span>' + s.score + '</span>得分</div>' +
            '<div><span>' + s.maxCombo + '</span>最高连击</div>' +
            '<div><span>' + elapsed.toFixed(0) + 's</span>用时</div>' +
          '</div>' +
          (s.timedOut > 0 ? '<div class="timeout-note">⏰ 有 ' + s.timedOut + ' 题超时了，下次手要快一点哦！</div>' : '') +
          (result.fast && stars >= 2 ? '<div class="fast-medal pop">⚡ 速度奖章：手速飞快！</div>' : '') +
          badgeHtml +
          wrongReview +
          '<div class="intro-btns">' +
            (canNext ? '<button class="btn primary big" id="btnNext">下一关 ➡️</button>' : '') +
            '<button class="btn" id="btnRetry">再玩一次 🔄</button>' +
            '<button class="btn ghost" id="btnMap">返回地图</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    if (stars >= 1) burstConfetti();
    // 星星逐个点亮动画
    animateResultStars(stars);

    if (canNext) $('#btnNext').addEventListener('click', () => { Sound.SFX.click(); renderLevelIntro(nextLevel.id); });
    $('#btnRetry').addEventListener('click', () => { Sound.SFX.click(); startLevel(s.level); });
    $('#btnMap').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }

  function bigStars(n) {
    let s = '';
    for (let i = 0; i < 3; i++) s += '<i class="bigstar' + (i < n ? ' on' : '') + '" data-i="' + i + '">★</i>';
    return s;
  }
  function animateResultStars(n) {
    const stars = $$('#resultStars .bigstar.on');
    stars.forEach((st, i) => {
      setTimeout(() => { st.classList.add('drop'); Sound.SFX.star(); }, 300 + i * 350);
    });
  }

  function getNextLevel(levelId) {
    // 只在同一年级(世界)内找下一关；年级最后一关无“下一关”，引导回地图
    for (const w of Levels.WORLDS) {
      const idx = w.levels.findIndex(l => l.id === levelId);
      if (idx === -1) continue;
      if (idx < w.levels.length - 1) {
        return Object.assign({ worldId: w.id }, w.levels[idx + 1]);
      }
      return null;
    }
    return null;
  }

  // ================= 徽章墙 =================
  function renderBadges() {
    const defs = Store.badgeDefs();
    const cards = defs.map(b => {
      const owned = Store.hasBadge(b.id);
      return '<div class="badge-card' + (owned ? ' owned' : '') + '">' +
        '<div class="badge-emoji">' + (owned ? b.emoji : '🔒') + '</div>' +
        '<div class="badge-name">' + b.name + '</div>' +
      '</div>';
    }).join('');

    const weak = Store.weakestType();
    let weakHtml = '';
    if (weak) {
      const lvl = Levels.flatLevels().find(l => l.type === weak.type);
      weakHtml = '<div class="weak-tip">📊 需要加强：<b>' + (lvl ? lvl.name : weak.type) +
        '</b>（错误率 ' + Math.round(weak.wrongRate * 100) + '%），多练练就掌握啦！</div>';
    }

    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnBack">⬅️</button>' +
        '<div class="brand">🏅 我的徽章墙</div>' +
        '<div class="topbar-right"><span class="star-count">⭐ ' + Store.totalStars() + '</span></div>' +
      '</header>' +
      '<div class="badge-wall">' + cards + '</div>' +
      weakHtml +
      '<div class="stat-summary">累计答对 <b>' + Store.get().stats.totalCorrect + '</b> 题</div>'
    );
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }

  // ================= 设置菜单 =================
  function renderMenu() {
    show(
      '<div class="screen center">' +
        '<div class="intro-card pop">' +
          '<h1>⚙️ 设置</h1>' +
          '<div class="menu-list">' +
            '<button class="btn" id="mSound">' + (Store.get().settings.sound ? '🔊 音效：开' : '🔇 音效：关') + '</button>' +
            '<button class="btn" id="mBadges">🏅 查看徽章墙</button>' +
            '<button class="btn danger" id="mReset">🗑️ 清空所有进度</button>' +
          '</div>' +
          '<button class="btn ghost" id="mBack">返回地图</button>' +
          '<p class="version">口算太空大冒险 v1.0 · 纯本地存档</p>' +
        '</div>' +
      '</div>'
    );
    $('#mSound').addEventListener('click', () => {
      toggleSoundSilent();
      $('#mSound').textContent = Store.get().settings.sound ? '🔊 音效：开' : '🔇 音效：关';
    });
    $('#mBadges').addEventListener('click', () => { Sound.SFX.click(); renderBadges(); });
    $('#mReset').addEventListener('click', () => {
      if (confirm('确定清空全部闯关进度和徽章吗？此操作无法撤销！')) {
        Store.reset();
        renderMap();
      }
    });
    $('#mBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }
  function toggleSoundSilent() {
    const cur = Store.get().settings.sound;
    Store.setSetting('sound', !cur);
    Sound.unlock();
    if (!cur) Sound.SFX.click();
  }

  // ================= 动画效果 =================
  function spawnStars() {
    const layer = ensureFxLayer();
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('div');
      s.className = 'fx-star';
      s.textContent = ['⭐', '✨', '🌟'][i % 3];
      s.style.left = (40 + Math.random() * 20) + '%';
      s.style.top = '45%';
      s.style.setProperty('--dx', (Math.random() * 240 - 120) + 'px');
      s.style.setProperty('--dy', (-Math.random() * 180 - 60) + 'px');
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }
  function burstConfetti() {
    const layer = ensureFxLayer();
    const colors = ['#ffd93d', '#ff6bcb', '#6bcbff', '#7dff9b', '#ff9d5c'];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      layer.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }
  function ensureFxLayer() {
    let layer = $('#fxLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'fxLayer';
      layer.className = 'fx-layer';
      document.body.appendChild(layer);
    }
    return layer;
  }
  function shake() {
    const q = $('.quiz');
    if (!q) return;
    q.classList.remove('shake');
    void q.offsetWidth;
    q.classList.add('shake');
  }
  function toastBadge(b) {
    const t = document.createElement('div');
    t.className = 'badge-toast pop';
    t.innerHTML = b.emoji + ' 获得徽章：' + b.name;
    document.body.appendChild(t);
    Sound.SFX.badge();
    setTimeout(() => t.classList.add('out'), 1600);
    setTimeout(() => t.remove(), 2200);
  }

  // ================= 启动 =================
  function init() {
    renderMap();
    // 首次任意点击唤醒音频
    document.body.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
  }

  global.Game = { init: init };
})(window);
