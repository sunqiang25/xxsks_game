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

  global.Sound = { SFX: SFX, unlock: unlock };
})(window);
