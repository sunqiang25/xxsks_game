// 游戏主逻辑：科目首页、屏幕切换、地图、答题、结算（数学 + 英语双科）
(function (global) {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const app = () => $('#app');

  let session = null;
  let curSubject = 'math'; // 当前科目

  function show(html) {
    const root = app();
    root.innerHTML = html;
    root.scrollTop = 0;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ================= 科目首页 =================
  function renderHome() {
    stopTimer();
    session = null;
    const cards = Subjects.all().map(sub => {
      let ts, ms;
      if (sub.virtual) {
        ts = Subjects.englishSubs().reduce((a, s) => a + Store.totalStars(s.id), 0);
        ms = Subjects.englishSubs().reduce((a, s) => a + Store.maxStars(s.id), 0);
      } else {
        ts = Store.totalStars(sub.id);
        ms = Store.maxStars(sub.id);
      }
      return '<button class="subject-card" data-sub="' + sub.id + '" style="--sc:' + sub.color + '">' +
        '<div class="subject-emoji">' + sub.emoji + '</div>' +
        '<div class="subject-name">' + sub.name + '</div>' +
        '<div class="subject-tag">' + sub.tagline + '</div>' +
        '<div class="subject-stars">⭐ ' + ts + ' / ' + ms + '</div>' +
      '</button>';
    }).join('');

    show(
      '<div class="home">' +
        '<div class="home-hero">' +
          '<div class="home-title">🌌 学习大冒险</div>' +
          '<div class="home-sub">选择今天想闯关的科目吧！</div>' +
          '<button class="coin-balance" id="homeShop">🪙 ' + Store.getCoins() + ' 金币 · 去奖励商店 🎁</button>' +
        '</div>' +
        '<div class="subject-grid">' + cards + '</div>' +
        '<footer class="tip">💡 数学和英语进度各自独立，随时切换～<br><button class="help-link" id="homeHelp">❓ 新手教程 & 攻略</button></footer>' +
      '</div>'
    );
    const shopBtn = $('#homeShop');
    if (shopBtn) shopBtn.addEventListener('click', () => { Sound.unlock(); Sound.SFX.click(); renderRewardShop(); });
    const helpBtn = $('#homeHelp');
    if (helpBtn) helpBtn.addEventListener('click', () => { Sound.unlock(); Sound.SFX.click(); renderHelp(); });
    $$('.subject-card').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.unlock();
        Sound.SFX.click();
        const id = btn.dataset.sub;
        if (Subjects.get(id).virtual) { renderEnglishPick(); return; }
        curSubject = id;
        renderMap();
      });
    });
  }

  // ================= 英语教材选择页（译林 / 新思维） =================
  function renderEnglishPick() {
    stopTimer();
    session = null;
    const cards = Subjects.englishSubs().map(sub => {
      const ts = Store.totalStars(sub.id);
      const ms = Store.maxStars(sub.id);
      return '<button class="subject-card" data-sub="' + sub.id + '" style="--sc:' + sub.color + '">' +
        '<div class="subject-emoji">' + sub.emoji + '</div>' +
        '<div class="subject-name">' + sub.name + '</div>' +
        '<div class="subject-tag">' + sub.tagline + '</div>' +
        '<div class="subject-stars">⭐ ' + ts + ' / ' + ms + '</div>' +
      '</button>';
    }).join('');

    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnHome" title="返回">⬅️</button>' +
        '<div class="brand">🔤 英语大冒险</div>' +
        '<div class="topbar-right"></div>' +
      '</header>' +
      '<div class="home">' +
        '<div class="home-hero">' +
          '<div class="home-title">选择你的英语教材</div>' +
          '<div class="home-sub">译林版和新思维进度各自独立哦～</div>' +
        '</div>' +
        '<div class="subject-grid">' + cards + '</div>' +
        '<footer class="tip">💡 用哪套教材就选哪个，两套都能玩～</footer>' +
      '</div>'
    );
    $$('.subject-card').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.unlock();
        Sound.SFX.click();
        curSubject = btn.dataset.sub;
        renderMap();
      });
    });
    $('#btnHome').addEventListener('click', () => { Sound.SFX.click(); renderHome(); });
  }

  // ================= 关卡地图（按当前科目） =================
  function renderMap() {
    stopTimer();
    session = null;
    const sub = Subjects.get(curSubject);
    const total = Store.totalStars(curSubject);
    const max = Store.maxStars(curSubject);
    let worldsHtml = '';

    sub.worlds.forEach(w => {
      let levelsHtml = '';
      w.levels.forEach(l => {
        const unlocked = Store.isUnlocked(curSubject, l.id);
        const rec = Store.levelRecord(curSubject, l.id);
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
        '<button class="icon-btn" id="btnHome" title="切换科目">🏠</button>' +
        '<div class="brand">' + sub.emoji + ' ' + sub.name + '</div>' +
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
    $('#btnHome').addEventListener('click', () => {
      Sound.SFX.click();
      if (Subjects.get(curSubject).parent === 'english') renderEnglishPick();
      else renderHome();
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
    const el = $('#btnSound');
    if (el) el.textContent = !cur ? '🔊' : '🔇';
  }

  // 难度挡位 → 时间倍率（乘到每题建议秒数上）
  const DIFF_OPTS = [
    { v: 'easy', label: '轻松', emoji: '🐢', mult: 1.5 },
    { v: 'std', label: '标准', emoji: '⭐', mult: 1.0 },
    { v: 'hard', label: '挑战', emoji: '🔥', mult: 0.7 }
  ];
  function diffMult(v) {
    const d = DIFF_OPTS.find(o => o.v === v);
    return d ? d.mult : 1.0;
  }
  function diffLabel(v) {
    const d = DIFF_OPTS.find(o => o.v === v);
    return d ? (d.emoji + ' ' + d.label) : '⭐ 标准';
  }
  // 每题倒计时秒数 = 题目建议 sec × 难度倍率；无 sec 时按题型兜底
  function questionSec(q, difficulty) {
    let base = q.sec;
    if (!base) {
      if (q.inputMode === 'spell') base = 20;
      else if (q.long) base = 30;
      else base = 12;
    }
    return Math.max(3, Math.ceil(base * diffMult(difficulty)));
  }

  // ================= 关卡开始前介绍 =================
  function renderLevelIntro(levelId) {
    const level = Subjects.findLevel(curSubject, levelId);
    const rec = Store.levelRecord(curSubject, levelId);
    const savedDiff = Store.get().settings.difficulty || 'std';
    const diffBtns = DIFF_OPTS.map(o =>
      '<button class="time-opt' + (o.v === savedDiff ? ' active' : '') + '" data-d="' + o.v + '">' +
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
            '<div class="time-label">🎚️ 选择难度（每题都有倒计时）</div>' +
            '<div class="time-opts">' + diffBtns + '</div>' +
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
        Store.setSetting('difficulty', btn.dataset.d);
      });
    });
    $('#btnStart').addEventListener('click', () => { Sound.SFX.click(); startLevel(level); });
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }

  // ================= 答题会话 =================
  function startLevel(level) {
    const sub = Subjects.get(curSubject);
    const questions = sub.gen(level.type, level.count);
    session = {
      subjectId: curSubject,
      level: level,
      questions: questions,
      idx: 0,
      correct: 0,
      wrong: 0,
      combo: 0,
      maxCombo: 0,
      score: 0,
      startAt: performance.now(),
      difficulty: Store.get().settings.difficulty || 'std',
      timedOut: 0,
      wrongItems: []
    };
    renderQuestion();
  }

  function isEnglish() { return session && (session.subjectId === 'en_yl' || session.subjectId === 'en_ns'); }

  function renderQuestion() {
    const s = session;
    const q = s.questions[s.idx];
    const progress = Math.round((s.idx / s.questions.length) * 100);

    let inputArea;
    if (q.inputMode === 'spell') {
      inputArea = spellArea(q);
    } else if (q.inputMode === 'choice') {
      inputArea =
        '<div class="choices' + (q.long ? ' choices-col' : '') + '">' +
          q.options.map((o, i) =>
            '<button class="choice" data-val="' + encodeURIComponent(o) + '">' +
              '<span class="choice-key">' + 'ABCD'[i] + '</span><span class="choice-txt">' + esc(o) + '</span>' +
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

    // 题干区：英语题带发音按钮（有 speak 内容就显示，点了再判断能否发音）
    const hasSpeakText = isEnglish() && !!q.speak;
    const canSpeak = hasSpeakText && Sound.supportsSpeech();
    const speakBtn = hasSpeakText
      ? '<button class="speak-btn" id="btnSpeak" title="听发音">🔊</button>'
      : '';
    const qClass = isEnglish() ? 'question en pop' : 'question pop';
    const qSuffix = isEnglish() ? '' : ' =';

    s.curSec = questionSec(q, s.difficulty);
    show(
      '<div class="quiz">' +
        '<div class="quiz-top">' +
          '<button class="icon-btn" id="btnQuit" title="退出">✖</button>' +
          '<div class="pbar"><div class="pbar-fill" style="width:' + progress + '%"></div></div>' +
          '<div class="qcount">' + (s.idx + 1) + '/' + s.questions.length + '</div>' +
        '</div>' +
        timerHtml(s.curSec) +
        '<div class="combo-area">' + comboHtml(s.combo) + '</div>' +
        (q.hint ? '<div class="q-hint">' + q.hint + '</div>' : '') +
        '<div class="' + qClass + '" id="qText">' + q.text + qSuffix + speakBtn + '</div>' +
        inputArea +
        '<div class="feedback" id="feedback"></div>' +
      '</div>'
    );

    $('#btnQuit').addEventListener('click', () => {
      Sound.SFX.click();
      stopTimer();
      if (confirm('确定退出本关吗？进度不会保存哦～')) renderMap();
      else if (!s.locked) startTimer();
    });

    if (hasSpeakText) {
      const sb = $('#btnSpeak');
      if (sb) sb.addEventListener('click', (e) => {
        e.stopPropagation();
        Sound.unlock();
        if (!Sound.supportsSpeech()) { toast('😥 当前浏览器不支持朗读，请用 Safari/Chrome 打开'); return; }
        const ok = Sound.speak(q.speak);
        if (!ok) toast('🔇 请先打开右上角音效，或用系统浏览器打开');
      });
      // 进入题目自动读一次（手机可能拦截，点 🔊 一定能读）
      if (canSpeak) {
        setTimeout(() => Sound.speak(q.speak), 400);
      }
    }

    if (q.inputMode === 'spell') {
      bindSpell(q);
    } else if (q.inputMode === 'choice') {
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
    startTimer();
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
    if (!s || !s.curSec || s.curSec <= 0) return;
    stopTimer();
    const arc = $('#timerArc');
    const numEl = $('#timerNum');
    const timerEl = $('#timer');
    const CIRC = 2 * Math.PI * 19;
    if (arc) { arc.style.strokeDasharray = CIRC; arc.style.strokeDashoffset = '0'; }

    const totalMs = s.curSec * 1000;
    s.timerStart = performance.now();
    let lastTick = s.curSec;

    s._timer = setInterval(() => {
      const elapsed = performance.now() - s.timerStart;
      const remain = Math.max(0, totalMs - elapsed);
      const ratio = remain / totalMs;
      const secLeft = Math.ceil(remain / 1000);

      if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - ratio));
      if (numEl) numEl.textContent = secLeft;

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
    submitAnswer(null, null, true);
  }

  function comboHtml(combo) {
    if (combo < 2) return '';
    return '<div class="combo-badge pop">🔥 连击 ×' + combo + '</div>';
  }

  // ---------- 数字键盘（数学） ----------
  function keypadHtml(q) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let grid = keys.map(k => '<button class="key" data-k="' + k + '">' + k + '</button>').join('');
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

  // ---------- 字母键盘（英语拼写） ----------
  function spellArea(q) {
    const keys = q.letters.map((c, i) =>
      '<button class="lkey" data-c="' + c + '" data-i="' + i + '">' + c + '</button>'
    ).join('');
    return '<div class="answer-box">' +
        '<div class="answer-display spell" id="ansDisplay"><span class="placeholder">_ _ _</span></div>' +
        '<div class="letter-pad">' + keys + '</div>' +
        '<div class="spell-btns">' +
          '<button class="btn" id="btnClear">清空</button>' +
          '<button class="btn primary big" id="btnSubmit" disabled>确定</button>' +
        '</div>' +
      '</div>';
  }

  function bindSpell(q) {
    let val = '';
    const usedIdx = [];
    const display = $('#ansDisplay');
    const submit = $('#btnSubmit');

    function refresh() {
      display.innerHTML = val === '' ? '<span class="placeholder">_ _ _</span>' : esc(val);
      submit.disabled = val.length === 0;
    }
    $$('.lkey').forEach(key => {
      key.addEventListener('click', () => {
        if (key.classList.contains('used')) return;
        if (val.length >= 12) return;
        val += key.dataset.c;
        key.classList.add('used');
        usedIdx.push(key);
        Sound.SFX.click();
        refresh();
      });
    });
    $('#btnClear').addEventListener('click', () => {
      val = '';
      usedIdx.splice(0).forEach(k => k.classList.remove('used'));
      Sound.SFX.click();
      refresh();
    });
    submit.addEventListener('click', () => submitAnswer(val, submit));
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
      // 英语答对后，读出正确英文（强化记忆）
      if (isEnglish()) speakReveal(q);
      if (comboBadges.length) toastBadge(comboBadges[0]);
    } else {
      s.wrong++;
      s.combo = 0;
      s.wrongItems.push({ text: plainQ(q), answer: displayAnswer(q) });
      Sound.SFX.wrong();
      const reason = isTimeout ? '⏰ 时间到！正确答案是 <b>' : '❌ 正确答案是 <b>';
      fb.innerHTML = '<div class="fb no pop">' + reason + esc(displayAnswer(q)) + '</b></div>';
      if (srcEl) srcEl.classList.add('wrong-flash');
      shake();
      const timerEl = $('#timer');
      if (timerEl) timerEl.classList.add('danger');
      if (isEnglish()) speakReveal(q);
      if (q.inputMode === 'choice') {
        $$('.choice').forEach(b => {
          if (decodeURIComponent(b.dataset.val) === String(q.answer)) b.classList.add('correct-flash');
          b.disabled = true;
        });
      }
    }
    $$('.key, .choice, .lkey, #btnSubmit, #btnClear').forEach(b => b.disabled = true);

    const delay = isCorrect ? (isEnglish() ? 950 : 750) : 1600;
    setTimeout(() => {
      s.idx++;
      s.locked = false;
      if (s.idx >= s.questions.length) finishLevel();
      else renderQuestion();
    }, delay);
  }

  // 揭示时朗读正确英文（词义题读英文答案；拼写/对话读 speak）
  function speakReveal(q) {
    const text = q.speakOnReveal || q.speak || (/^[a-zA-Z' .!?]+$/.test(String(q.answer)) ? q.answer : '');
    if (text) setTimeout(() => Sound.speak(text), 150);
  }

  function checkAnswer(q, rawVal) {
    if (q.inputMode === 'spell') {
      return String(rawVal).toLowerCase().trim() === String(q.answer).toLowerCase().trim();
    }
    if (q.inputMode === 'choice') return String(rawVal) === String(q.answer);
    const num = parseFloat(rawVal);
    if (isNaN(num)) return false;
    if (q.decimals > 0) return Math.abs(num - q.answer) < 0.001;
    return num === q.answer;
  }

  function displayAnswer(q) {
    if (q.inputMode === 'choice' || q.inputMode === 'spell') return String(q.answer);
    return q.decimals > 0 ? q.answer.toFixed(q.decimals) : String(q.answer);
  }

  // 错题回顾里题干去掉 HTML 标签
  function plainQ(q) {
    return String(q.text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
    const result = Store.recordResult(s.subjectId, s.level.id, s.level.type, s.correct, total, avgSec, s.difficulty);
    const stars = result.newStars;

    if (stars >= 1) Sound.SFX.win(); else Sound.SFX.wrong();

    const nextLevel = getNextLevel(s.subjectId, s.level.id);
    const canNext = nextLevel && Store.isUnlocked(s.subjectId, nextLevel.id);

    let badgeHtml = '';
    if (result.newBadges && result.newBadges.length) {
      badgeHtml = '<div class="earned-badges">' +
        result.newBadges.map(b => '<span class="earned pop">' + b.emoji + ' ' + b.name + '</span>').join('') +
        '</div>';
      setTimeout(() => Sound.SFX.badge(), 600);
    }

    const wrongReview = s.wrongItems.length
      ? '<details class="wrong-review"><summary>看看错题 (' + s.wrongItems.length + ')</summary>' +
        s.wrongItems.map(w => '<div class="wrong-row">' + esc(w.text) + ' → <b>' + esc(w.answer) + '</b></div>').join('') +
        '</details>'
      : '<div class="all-correct">🎉 全部答对，太厉害啦！</div>';

    const coinHtml = result.coinsEarned
      ? '<div class="coin-earned pop">🪙 +' + result.coinsEarned + ' 金币！<span class="coin-total">（共 ' + Store.getCoins() + '）</span></div>'
      : (result.replayNoCoin
          ? '<div class="coin-none">🪙 这关已拿过金币啦～<br>拿到更多星星或挑战更高年级/难度才有新金币哦！</div>'
          : '');

    show(
      '<div class="screen center">' +
        '<div class="result-card pop">' +
          '<div class="result-stars" id="resultStars">' + bigStars(stars) + '</div>' +
          '<h1>' + (stars >= 1 ? '闯关成功！' : '再试一次吧') + '</h1>' +
          '<div class="mode-tag">🎚️ 难度：' + diffLabel(s.difficulty) + '</div>' +
          '<div class="result-stats">' +
            '<div><span>' + s.correct + '/' + total + '</span>答对</div>' +
            '<div><span>' + s.score + '</span>得分</div>' +
            '<div><span>' + s.maxCombo + '</span>最高连击</div>' +
            '<div><span>' + elapsed.toFixed(0) + 's</span>用时</div>' +
          '</div>' +
          (s.timedOut > 0 ? '<div class="timeout-note">⏰ 有 ' + s.timedOut + ' 题超时了，下次手要快一点哦！</div>' : '') +
          (result.fast && stars >= 2 ? '<div class="fast-medal pop">⚡ 速度奖章：手速飞快！</div>' : '') +
          coinHtml +
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
    animateResultStars(stars);
    if (result.coinsEarned) setTimeout(() => Sound.SFX.star(), 900);

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

  function getNextLevel(subjectId, levelId) {
    const worlds = Subjects.get(subjectId).worlds;
    for (const w of worlds) {
      const idx = w.levels.findIndex(l => l.id === levelId);
      if (idx === -1) continue;
      if (idx < w.levels.length - 1) return Object.assign({ worldId: w.id }, w.levels[idx + 1]);
      return null;
    }
    return null;
  }

  // ================= 徽章墙（当前科目） =================
  function renderBadges() {
    const defs = Store.badgeDefs(curSubject);
    const cards = defs.map(b => {
      const owned = Store.hasBadge(b.id);
      return '<div class="badge-card' + (owned ? ' owned' : '') + '">' +
        '<div class="badge-emoji">' + (owned ? b.emoji : '🔒') + '</div>' +
        '<div class="badge-name">' + b.name + '</div>' +
      '</div>';
    }).join('');

    const weak = Store.weakestType(curSubject);
    let weakHtml = '';
    if (weak) {
      const lvl = Subjects.flatLevels(curSubject).find(l => l.type === weak.type);
      weakHtml = '<div class="weak-tip">📊 需要加强：<b>' + (lvl ? lvl.name : weak.type) +
        '</b>（错误率 ' + Math.round(weak.wrongRate * 100) + '%），多练练就掌握啦！</div>';
    }

    const sub = Subjects.get(curSubject);
    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnBack">⬅️</button>' +
        '<div class="brand">🏅 ' + sub.name + '徽章墙</div>' +
        '<div class="topbar-right"><span class="star-count">⭐ ' + Store.totalStars(curSubject) + '</span></div>' +
      '</header>' +
      '<div class="badge-wall">' + cards + '</div>' +
      weakHtml +
      '<div class="stat-summary">累计答对 <b>' + Store.totalCorrectOf(curSubject) + '</b> 题</div>'
    );
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }

  // ================= 家长验证锁 =================
  function parentGate(onPass) {
    const a = 6 + Math.floor((s_seed() % 4)); // 6-9
    const b = 6 + Math.floor((s_seed() % 4));
    const ans = window.prompt('👨‍👩‍👧 家长验证\n请算出 ' + a + ' × ' + b + ' = ?');
    if (ans === null) return; // 取消
    if (parseInt(ans, 10) === a * b) { onPass(); }
    else { toast('❌ 答案不对，需要家长来操作哦'); }
  }
  // 简单伪随机（避免 Math.random 的一致性问题，这里用时间片充分够用）
  let _seedN = 0;
  function s_seed() { _seedN = (_seedN + 7) % 97; return (performance.now() | 0) + _seedN; }

  // ================= 奖励商店 =================
  function renderRewardShop() {
    const coins = Store.getCoins();
    const wishes = Store.getWishes();
    const cards = wishes.map(w => {
      const afford = coins >= w.cost;
      return '<div class="wish-card' + (afford ? ' affordable' : ' locked') + '">' +
        '<div class="wish-emoji">' + w.emoji + '</div>' +
        '<div class="wish-name">' + esc(w.name) + '</div>' +
        '<div class="wish-cost">🪙 ' + w.cost + '</div>' +
        '<button class="btn primary wish-buy" data-id="' + w.id + '"' + (afford ? '' : ' disabled') + '>' +
          (afford ? '兑换' : '金币不够') + '</button>' +
      '</div>';
    }).join('');

    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnBack">⬅️</button>' +
        '<div class="brand">🎁 奖励商店</div>' +
        '<div class="topbar-right"><span class="coin-count">🪙 ' + coins + '</span></div>' +
      '</header>' +
      '<div class="shop-tip">💪 闯关赚金币，换取心愿奖励！攒够就找爸爸妈妈兑现～</div>' +
      '<div class="badge-wall">' + (cards || '<div class="stat-summary">还没有奖励，去家长管理里添加吧～</div>') + '</div>' +
      '<div class="shop-actions">' +
        '<button class="btn" id="btnRedeemed">📜 已兑换记录</button>' +
        '<button class="btn ghost" id="btnParent">👨‍👩‍👧 家长管理</button>' +
      '</div>'
    );
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
    $('#btnRedeemed').addEventListener('click', () => { Sound.SFX.click(); renderRedeemed(); });
    $('#btnParent').addEventListener('click', () => { Sound.SFX.click(); parentGate(renderWishEdit); });
    $$('.wish-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const w = Store.getWishes().find(x => x.id === id);
        if (!w) return;
        Sound.SFX.click();
        if (!confirm('确定用 ' + w.cost + ' 金币兑换「' + w.name + '」吗？')) return;
        parentGate(() => {
          if (Store.spendCoins(w.cost)) {
            Store.pushRedeemed({ wishId: w.id, name: w.name, emoji: w.emoji });
            Sound.SFX.win();
            toast('🎉 兑换成功！请找爸爸妈妈兑现「' + w.name + '」');
            renderRewardShop();
          } else {
            toast('金币不够啦，再去闯几关吧！');
          }
        });
      });
    });
  }

  // 已兑换记录
  function renderRedeemed() {
    const list = Store.getRedeemed();
    const rows = list.length
      ? list.map(r => '<div class="redeem-row">' + r.emoji + ' ' + esc(r.name) + '</div>').join('')
      : '<div class="stat-summary">还没有兑换记录，加油攒金币～</div>';
    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnBack">⬅️</button>' +
        '<div class="brand">📜 已兑换记录</div>' +
        '<div class="topbar-right"><span class="coin-count">🪙 ' + Store.getCoins() + '</span></div>' +
      '</header>' +
      '<div class="redeem-list">' + rows + '</div>' +
      '<div class="shop-tip">💡 兑换后请家长实际兑现奖励哦～</div>'
    );
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderRewardShop(); });
  }

  // 家长管理：编辑愿望清单
  function renderWishEdit() {
    const wishes = Store.getWishes();
    const rows = wishes.map(w =>
      '<div class="wish-edit-row">' +
        '<span class="wish-edit-emoji">' + w.emoji + '</span>' +
        '<span class="wish-edit-name">' + esc(w.name) + '</span>' +
        '<span class="wish-edit-cost">🪙' + w.cost + '</span>' +
        '<button class="mini-btn" data-act="rename" data-id="' + w.id + '">改名</button>' +
        '<button class="mini-btn" data-act="price" data-id="' + w.id + '">改价</button>' +
        '<button class="mini-btn danger" data-act="del" data-id="' + w.id + '">删</button>' +
      '</div>'
    ).join('');
    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnBack">⬅️</button>' +
        '<div class="brand">👨‍👩‍👧 家长管理</div>' +
        '<div class="topbar-right"></div>' +
      '</header>' +
      '<div class="shop-tip">在这里设置奖励和所需金币，孩子攒够就能兑换。</div>' +
      '<div class="wish-edit-list">' + rows + '</div>' +
      '<div class="shop-actions">' +
        '<button class="btn primary" id="btnAdd">➕ 添加奖励</button>' +
        '<button class="btn ghost" id="btnBack2">返回商店</button>' +
      '</div>'
    );
    const back = () => { Sound.SFX.click(); renderRewardShop(); };
    $('#btnBack').addEventListener('click', back);
    $('#btnBack2').addEventListener('click', back);
    $('#btnAdd').addEventListener('click', () => {
      const name = (window.prompt('奖励名称（如：看电视30分钟）') || '').trim();
      if (!name) return;
      const emoji = (window.prompt('给它一个emoji图标（如 📺，可留空）') || '🎁').trim() || '🎁';
      const cost = parseInt(window.prompt('需要多少金币兑换？（数字）', '50'), 10);
      if (!cost || cost <= 0) { toast('价格要填正整数哦'); return; }
      const arr = Store.getWishes().slice();
      arr.push({ id: 'w_' + (performance.now() | 0) + '_' + arr.length, name: name, emoji: emoji, cost: cost });
      Store.setWishes(arr);
      Sound.SFX.click();
      renderWishEdit();
    });
    $$('.mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id, act = btn.dataset.act;
        const arr = Store.getWishes().slice();
        const i = arr.findIndex(x => x.id === id);
        if (i < 0) return;
        if (act === 'rename') {
          const nn = (window.prompt('新名称', arr[i].name) || '').trim();
          if (nn) { arr[i] = Object.assign({}, arr[i], { name: nn }); Store.setWishes(arr); renderWishEdit(); }
        } else if (act === 'price') {
          const np = parseInt(window.prompt('新价格（金币数）', String(arr[i].cost)), 10);
          if (np && np > 0) { arr[i] = Object.assign({}, arr[i], { cost: np }); Store.setWishes(arr); renderWishEdit(); }
        } else if (act === 'del') {
          if (confirm('删除奖励「' + arr[i].name + '」？')) { arr.splice(i, 1); Store.setWishes(arr); renderWishEdit(); }
        }
      });
    });
  }


  // ================= 玩法教程 & 攻略 =================
  const HELP_TABS = {
    kid: {
      title: '🧒 怎么玩',
      html:
        '<div class="help-step"><b>1. 选科目</b><br>首页点「🚀 口算大冒险」或「🔤 英语大冒险」。英语还要再选译林版或新思维。</div>' +
        '<div class="help-step"><b>2. 选关卡</b><br>每个年级第一关直接能玩。星图里点亮的关卡就能进，🔒 锁住的要先通过前一关。</div>' +
        '<div class="help-step"><b>3. 选难度</b><br>开始前选 🐢轻松 / ⭐标准 / 🔥挑战。越难时间越短、金币一样，先从标准开始。</div>' +
        '<div class="help-step"><b>4. 答题</b><br>数学用数字键盘输入答案点「确定」；选择题直接点选项。英语点题目旁的 🔊 能听发音。</div>' +
        '<div class="help-step"><b>5. 看结果</b><br>答对越多星星越多：全对 3⭐、八成 2⭐、过关 1⭐。还能拿金币 🪙！</div>' +
        '<div class="help-step"><b>6. 换奖励</b><br>金币攒够了，去「🎁 奖励商店」换爸爸妈妈准备的奖励（要爸妈帮忙确认哦）。</div>'
    },
    parent: {
      title: '👨‍👩‍👧 家长说明',
      html:
        '<div class="help-step"><b>🪙 金币规则</b><br>孩子每关按星级得金币：首次通关 1⭐=10、2⭐=20、3⭐=40 金币；从低星刷到高星会补差价；重玩已通关的关卡只给 2 金币（防刷）。</div>' +
        '<div class="help-step"><b>🎁 设置奖励</b><br>奖励商店 →「👨‍👩‍👧 家长管理」，可以改奖励名称、价格（金币数）、增删。预置了看电视/玩手机/冰淇淋/去公园。</div>' +
        '<div class="help-step"><b>🔒 家长锁</b><br>改奖励清单、确认兑换时会弹一道乘法题（如 7×8），答对才放行，防止孩子自己乱改或白领奖励。</div>' +
        '<div class="help-step"><b>📊 看弱项</b><br>「🏅 徽章墙」底部会显示孩子错得最多的题型，可以针对性多练那一关。</div>' +
        '<div class="help-step"><b>💾 进度保存</b><br>进度存在这个浏览器本地。换浏览器/清缓存会清空。别在微信里打开（微信屏蔽），用 Safari/Chrome/夸克。</div>'
    },
    tips: {
      title: '🏆 高分攻略',
      html:
        '<div class="help-step"><b>⭐ 怎么拿 3 星</b><br>3 星要求全部答对。想满分就选 🐢轻松 挡，时间充足、看清楚再答。</div>' +
        '<div class="help-step"><b>🔥 连击加分</b><br>连续答对会触发连击，越连越多分，还有「十连击」徽章。别急着抢答，稳住连对更划算。</div>' +
        '<div class="help-step"><b>💰 最快攒金币</b><br>金币看首次通关的星级。优先去还没通关的新关卡拿首通大奖（3⭐=40），比重玩老关卡（只有2）快得多。</div>' +
        '<div class="help-step"><b>⚡ 速度奖章</b><br>标准/挑战挡下又快又准（2⭐以上且平均每题够快）能拿速度奖章。</div>' +
        '<div class="help-step"><b>📖 应用题/图形题</b><br>题干会有多行，别被吓到。先读中文，圈出数字，想清楚是加还是减再动手。这类题时间给得更长。</div>' +
        '<div class="help-step"><b>🔤 英语听发音</b><br>不认识的单词先点 🔊 听一遍再选。答完还会再读一次正确答案，跟着念记得牢。</div>'
    }
  };
  function renderHelp(tab) {
    tab = tab || 'kid';
    const t = HELP_TABS[tab] || HELP_TABS.kid;
    const tabBtns = Object.keys(HELP_TABS).map(k =>
      '<button class="help-tab' + (k === tab ? ' active' : '') + '" data-tab="' + k + '">' + HELP_TABS[k].title + '</button>'
    ).join('');
    show(
      '<header class="topbar">' +
        '<button class="icon-btn" id="btnBack">⬅️</button>' +
        '<div class="brand">❓ 教程 & 攻略</div>' +
        '<div class="topbar-right"></div>' +
      '</header>' +
      '<div class="help-tabs">' + tabBtns + '</div>' +
      '<div class="help-body">' + t.html + '</div>' +
      '<div class="shop-tip">🌐 分享给别人：把网址复制到 Safari/Chrome/夸克打开（微信里打不开哦）</div>'
    );
    $('#btnBack').addEventListener('click', () => { Sound.SFX.click(); renderHome(); });
    $$('.help-tab').forEach(btn => {
      btn.addEventListener('click', () => { Sound.SFX.click(); renderHelp(btn.dataset.tab); });
    });
  }

  // ================= 设置菜单 =================
  function renderMenu() {
    show(
      '<div class="screen center">' +
        '<div class="intro-card pop">' +
          '<h1>⚙️ 设置</h1>' +
          '<div class="menu-list">' +
            '<button class="btn primary" id="mShop">🎁 奖励商店（' + Store.getCoins() + ' 🪙）</button>' +
            '<button class="btn" id="mHelp">❓ 玩法教程 & 攻略</button>' +
            '<button class="btn" id="mSound">' + (Store.get().settings.sound ? '🔊 音效：开' : '🔇 音效：关') + '</button>' +
            '<button class="btn" id="mBadges">🏅 查看徽章墙</button>' +
            '<button class="btn" id="mBackup">💾 存档备份 / 恢复</button>' +
            '<button class="btn" id="mResetSub">🧹 清空本科目进度</button>' +
            '<button class="btn danger" id="mReset">🗑️ 清空全部进度</button>' +
          '</div>' +
          '<button class="btn ghost" id="mBack">返回地图</button>' +
          '<p class="version">学习大冒险 v2.0 · 数学 + 英语 · 纯本地存档</p>' +
        '</div>' +
      '</div>'
    );
    $('#mShop').addEventListener('click', () => { Sound.SFX.click(); renderRewardShop(); });
    $('#mHelp').addEventListener('click', () => { Sound.SFX.click(); renderHelp(); });
    $('#mSound').addEventListener('click', () => {
      toggleSoundSilent();
      $('#mSound').textContent = Store.get().settings.sound ? '🔊 音效：开' : '🔇 音效：关';
    });
    $('#mBadges').addEventListener('click', () => { Sound.SFX.click(); renderBadges(); });
    $('#mBackup').addEventListener('click', () => { Sound.SFX.click(); renderBackup(); });
    $('#mResetSub').addEventListener('click', () => {
      const name = Subjects.get(curSubject).name;
      if (confirm('确定清空【' + name + '】的全部进度和徽章吗？此操作无法撤销！')) {
        Store.reset(curSubject);
        renderMap();
      }
    });
    $('#mReset').addEventListener('click', () => {
      if (confirm('确定清空数学和英语的全部进度吗？此操作无法撤销！')) {
        Store.reset();
        renderHome();
      }
    });
    $('#mBack').addEventListener('click', () => { Sound.SFX.click(); renderMap(); });
  }

  // ================= 存档备份 / 恢复 =================
  function renderBackup() {
    const code = Store.exportSave();
    show(
      '<div class="screen center">' +
        '<div class="intro-card pop backup-card">' +
          '<h1>💾 存档备份 / 恢复</h1>' +
          '<p class="backup-tip">换手机、清了浏览器、或进度丢了，用这里找回。<br><b>建议家长把存档码复制保存好。</b></p>' +
          '<div class="backup-block">' +
            '<div class="backup-label">📤 我的存档码（复制保存）</div>' +
            '<textarea id="bkOut" class="backup-text" readonly rows="4">' + code + '</textarea>' +
            '<button class="btn primary" id="bkCopy">📋 复制存档码</button>' +
          '</div>' +
          '<div class="backup-block">' +
            '<div class="backup-label">📥 恢复存档（粘贴存档码）</div>' +
            '<textarea id="bkIn" class="backup-text" rows="4" placeholder="把之前保存的存档码粘到这里…"></textarea>' +
            '<button class="btn" id="bkImport">✅ 恢复这份存档</button>' +
            '<p class="backup-warn">⚠️ 恢复会覆盖当前进度，请确认存档码正确。</p>' +
          '</div>' +
          '<button class="btn ghost" id="bkBack">返回</button>' +
        '</div>' +
      '</div>'
    );
    $('#bkCopy').addEventListener('click', () => {
      const ta = $('#bkOut');
      ta.select(); ta.setSelectionRange(0, 99999);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      if (navigator.clipboard) { navigator.clipboard.writeText(ta.value).catch(() => {}); ok = true; }
      Sound.SFX.click();
      toast(ok ? '📋 已复制！请粘贴到备忘录保存好' : '请长按选中后手动复制');
    });
    $('#bkImport').addEventListener('click', () => {
      const val = $('#bkIn').value.trim();
      if (!val) { toast('请先粘贴存档码'); return; }
      if (!confirm('恢复存档会覆盖当前所有进度和金币，确定吗？')) return;
      if (Store.importSave(val)) {
        Sound.SFX.win();
        toast('🎉 存档恢复成功！');
        setTimeout(() => renderHome(), 800);
      } else {
        Sound.SFX.wrong();
        toast('❌ 存档码无效，请检查是否复制完整');
      }
    });
    $('#bkBack').addEventListener('click', () => { Sound.SFX.click(); renderMenu(); });
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
  // 通用提示 toast（如发音不可用时的说明）
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'badge-toast pop';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2800);
  }

  // ================= 首次进入引导 =================
  function maybeShowWelcome() {
    if (Store.get().settings.seenTutorial) return;
    Store.setSetting('seenTutorial', true);
    const ov = document.createElement('div');
    ov.className = 'welcome-mask';
    ov.innerHTML =
      '<div class="welcome-card pop">' +
        '<div class="welcome-emoji">🚀</div>' +
        '<h1>欢迎来到学习大冒险！</h1>' +
        '<p>数学口算 + 英语闯关，答对赚金币🪙，还能换取爸爸妈妈准备的奖励！</p>' +
        '<p class="welcome-sub">第一次玩？先花 1 分钟看看怎么玩吧～</p>' +
        '<div class="welcome-btns">' +
          '<button class="btn primary big" id="wcHelp">📖 查看教程</button>' +
          '<button class="btn ghost" id="wcSkip">直接开始玩 ➡️</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    const close = () => { ov.remove(); };
    $('#wcHelp').addEventListener('click', () => { Sound.unlock(); Sound.SFX.click(); close(); renderHelp(); });
    $('#wcSkip').addEventListener('click', () => { Sound.unlock(); Sound.SFX.click(); close(); });
  }

  // ================= 启动 =================
  function init() {
    renderHome();
    maybeShowWelcome();
    document.body.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
  }

  global.Game = { init: init };
})(window);
