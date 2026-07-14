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
        '</div>' +
        '<div class="subject-grid">' + cards + '</div>' +
        '<footer class="tip">💡 数学和英语进度各自独立，随时切换～</footer>' +
      '</div>'
    );
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

    // 题干区：英语题带发音按钮（若该题有 speak 内容）
    const canSpeak = isEnglish() && q.speak && Sound.supportsSpeech();
    const speakBtn = canSpeak
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

    if (canSpeak) {
      const sb = $('#btnSpeak');
      if (sb) sb.addEventListener('click', (e) => { e.stopPropagation(); Sound.speak(q.speak); });
      // 进入题目自动读一次（词汇/拼写题）
      if (q.inputMode !== 'choice' || q.speak) {
        setTimeout(() => Sound.speak(q.speak), 350);
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
    const result = Store.recordResult(s.subjectId, s.level.id, s.level.type, s.correct, total, avgSec);
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

  // ================= 设置菜单 =================
  function renderMenu() {
    show(
      '<div class="screen center">' +
        '<div class="intro-card pop">' +
          '<h1>⚙️ 设置</h1>' +
          '<div class="menu-list">' +
            '<button class="btn" id="mSound">' + (Store.get().settings.sound ? '🔊 音效：开' : '🔇 音效：关') + '</button>' +
            '<button class="btn" id="mBadges">🏅 查看徽章墙</button>' +
            '<button class="btn" id="mResetSub">🧹 清空本科目进度</button>' +
            '<button class="btn danger" id="mReset">🗑️ 清空全部进度</button>' +
          '</div>' +
          '<button class="btn ghost" id="mBack">返回地图</button>' +
          '<p class="version">学习大冒险 v2.0 · 数学 + 英语 · 纯本地存档</p>' +
        '</div>' +
      '</div>'
    );
    $('#mSound').addEventListener('click', () => {
      toggleSoundSilent();
      $('#mSound').textContent = Store.get().settings.sound ? '🔊 音效：开' : '🔇 音效：关';
    });
    $('#mBadges').addEventListener('click', () => { Sound.SFX.click(); renderBadges(); });
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
    renderHome();
    document.body.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
  }

  global.Game = { init: init };
})(window);
