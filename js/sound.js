// 音效：WebAudio 合成，无需任何音频文件
(function (global) {
  'use strict';

  let ctx = null;
  function ac() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    return ctx;
  }

  function enabled() {
    return global.Store ? global.Store.get().settings.sound : true;
  }

  // 播放一个音符
  function tone(freq, start, dur, type, gain) {
    const c = ac();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = c.currentTime + start;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function seq(notes) { // notes: [{f,d,t}]
    if (!enabled()) return;
    const c = ac();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    let acc = 0;
    notes.forEach(n => {
      tone(n.f, acc, n.d, n.type, n.g);
      acc += (n.step != null ? n.step : n.d);
    });
  }

  const SFX = {
    correct() { seq([{ f: 660, d: 0.12 }, { f: 880, d: 0.16 }]); },
    combo(level) { // 连对越高音越亮
      const base = 660 + Math.min(level, 8) * 40;
      seq([{ f: base, d: 0.1 }, { f: base * 1.25, d: 0.12 }, { f: base * 1.5, d: 0.14 }]);
    },
    wrong() { seq([{ f: 300, d: 0.18, type: 'triangle' }, { f: 200, d: 0.22, type: 'triangle' }]); },
    tick() { seq([{ f: 880, d: 0.06, type: 'square', g: 0.14 }]); },
    click() { seq([{ f: 520, d: 0.05, g: 0.12 }]); },
    win() { seq([{ f: 523, d: 0.14 }, { f: 659, d: 0.14 }, { f: 784, d: 0.14 }, { f: 1047, d: 0.3 }]); },
    star() { seq([{ f: 988, d: 0.1 }, { f: 1319, d: 0.18 }]); },
    badge() { seq([{ f: 784, d: 0.12 }, { f: 988, d: 0.12 }, { f: 1319, d: 0.25 }]); }
  };

  // 用户首次交互时唤醒音频上下文（浏览器策略）
  function unlock() {
    const c = ac();
    if (c && c.state === 'suspended') c.resume();
  }

  // ---------- 英文朗读：Web Speech API ----------
  let enVoice = null;
  let voicesReady = false;
  function pickVoice() {
    const synth = global.speechSynthesis;
    if (!synth) return;
    const list = synth.getVoices() || [];
    if (!list.length) return;
    // 优先英式/美式女声，其次任意 en 嗓音
    enVoice =
      list.find(v => /en(-|_)?(US|GB)/i.test(v.lang) && /female|Samantha|Karen|Google US/i.test(v.name)) ||
      list.find(v => /^en/i.test(v.lang)) ||
      null;
    voicesReady = true;
  }
  if (global.speechSynthesis) {
    pickVoice();
    // 部分浏览器嗓音异步加载
    global.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function supportsSpeech() { return !!global.speechSynthesis && !!global.SpeechSynthesisUtterance; }

  // 朗读英文单词/句子（受音效开关控制）
  function speak(text, opts) {
    if (!text || !enabled() || !supportsSpeech()) return false;
    try {
      const synth = global.speechSynthesis;
      synth.cancel(); // 打断上一段，避免堆积
      if (!voicesReady) pickVoice();
      const u = new global.SpeechSynthesisUtterance(String(text));
      u.lang = (enVoice && enVoice.lang) || 'en-US';
      if (enVoice) u.voice = enVoice;
      u.rate = (opts && opts.rate) || 0.85; // 稍慢，便于小朋友听清
      u.pitch = (opts && opts.pitch) || 1.05;
      u.volume = 1;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }

  global.Sound = { SFX: SFX, unlock: unlock, speak: speak, supportsSpeech: supportsSpeech };
})(window);
