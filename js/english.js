// 英语题库：贴合小学「译林版 + 新思维」词表与句型
// 每道题输出与数学同构，供同一答题引擎复用：
//   choice 模式  { text, answer:String, inputMode:'choice', options:[...], speak?:String, textZh?:String }
//   spell 模式   { text, answer:String, inputMode:'spell', letters:[...], speak?:String }  // 字母键盘拼写
// speak 字段：需要朗读的英文（单词或句子），由 Sound.speak 调用浏览器语音合成

(function (global) {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // 从题库同类里挑 3 个干扰词，凑 4 个不重复选项并打乱
  function options4(correct, pool, keyFn) {
    const key = keyFn || (x => String(x));
    const set = [correct];
    const used = new Set([key(correct)]);
    const bag = shuffle(pool);
    for (const item of bag) {
      if (set.length >= 4) break;
      if (!used.has(key(item))) { set.push(item); used.add(key(item)); }
    }
    return shuffle(set);
  }

  // ============ 词表（按主题）：en 英文, zh 中文, emoji 图标 ============
  // 覆盖译林/新思维小学高频四会词：文具、动物、食物、颜色、数字、家庭、身体、水果、玩具、交通、天气、房间等
  const WORDS = {
    // —— 一年级：最基础，看图/中英互选 ——
    color: [
      { en: 'red', zh: '红色', emoji: '🔴' }, { en: 'blue', zh: '蓝色', emoji: '🔵' },
      { en: 'yellow', zh: '黄色', emoji: '🟡' }, { en: 'green', zh: '绿色', emoji: '🟢' },
      { en: 'black', zh: '黑色', emoji: '⚫' }, { en: 'white', zh: '白色', emoji: '⚪' },
      { en: 'orange', zh: '橙色', emoji: '🟠' }, { en: 'purple', zh: '紫色', emoji: '🟣' },
      { en: 'pink', zh: '粉色', emoji: '🌸' }, { en: 'brown', zh: '棕色', emoji: '🟤' }
    ],
    animal: [
      { en: 'cat', zh: '猫', emoji: '🐱' }, { en: 'dog', zh: '狗', emoji: '🐶' },
      { en: 'pig', zh: '猪', emoji: '🐷' }, { en: 'duck', zh: '鸭子', emoji: '🦆' },
      { en: 'bird', zh: '鸟', emoji: '🐦' }, { en: 'fish', zh: '鱼', emoji: '🐟' },
      { en: 'rabbit', zh: '兔子', emoji: '🐰' }, { en: 'tiger', zh: '老虎', emoji: '🐯' },
      { en: 'panda', zh: '熊猫', emoji: '🐼' }, { en: 'monkey', zh: '猴子', emoji: '🐵' },
      { en: 'elephant', zh: '大象', emoji: '🐘' }, { en: 'lion', zh: '狮子', emoji: '🦁' }
    ],
    fruit: [
      { en: 'apple', zh: '苹果', emoji: '🍎' }, { en: 'banana', zh: '香蕉', emoji: '🍌' },
      { en: 'orange', zh: '橙子', emoji: '🍊' }, { en: 'pear', zh: '梨', emoji: '🍐' },
      { en: 'grape', zh: '葡萄', emoji: '🍇' }, { en: 'peach', zh: '桃子', emoji: '🍑' },
      { en: 'watermelon', zh: '西瓜', emoji: '🍉' }, { en: 'strawberry', zh: '草莓', emoji: '🍓' },
      { en: 'lemon', zh: '柠檬', emoji: '🍋' }, { en: 'mango', zh: '芒果', emoji: '🥭' }
    ],
    number: [
      { en: 'one', zh: '一', emoji: '1️⃣' }, { en: 'two', zh: '二', emoji: '2️⃣' },
      { en: 'three', zh: '三', emoji: '3️⃣' }, { en: 'four', zh: '四', emoji: '4️⃣' },
      { en: 'five', zh: '五', emoji: '5️⃣' }, { en: 'six', zh: '六', emoji: '6️⃣' },
      { en: 'seven', zh: '七', emoji: '7️⃣' }, { en: 'eight', zh: '八', emoji: '8️⃣' },
      { en: 'nine', zh: '九', emoji: '9️⃣' }, { en: 'ten', zh: '十', emoji: '🔟' }
    ],
    // —— 二年级：文具、身体、家庭、食物 ——
    stationery: [
      { en: 'pen', zh: '钢笔', emoji: '🖊️' }, { en: 'pencil', zh: '铅笔', emoji: '✏️' },
      { en: 'book', zh: '书', emoji: '📖' }, { en: 'bag', zh: '书包', emoji: '🎒' },
      { en: 'ruler', zh: '尺子', emoji: '📏' }, { en: 'eraser', zh: '橡皮', emoji: '🧽' },
      { en: 'crayon', zh: '蜡笔', emoji: '🖍️' }, { en: 'box', zh: '盒子', emoji: '📦' }
    ],
    body: [
      { en: 'head', zh: '头', emoji: '👤' }, { en: 'hand', zh: '手', emoji: '✋' },
      { en: 'eye', zh: '眼睛', emoji: '👁️' }, { en: 'ear', zh: '耳朵', emoji: '👂' },
      { en: 'nose', zh: '鼻子', emoji: '👃' }, { en: 'mouth', zh: '嘴', emoji: '👄' },
      { en: 'foot', zh: '脚', emoji: '🦶' }, { en: 'leg', zh: '腿', emoji: '🦵' }
    ],
    family: [
      { en: 'father', zh: '爸爸', emoji: '👨' }, { en: 'mother', zh: '妈妈', emoji: '👩' },
      { en: 'brother', zh: '兄弟', emoji: '👦' }, { en: 'sister', zh: '姐妹', emoji: '👧' },
      { en: 'grandpa', zh: '爷爷', emoji: '👴' }, { en: 'grandma', zh: '奶奶', emoji: '👵' },
      { en: 'baby', zh: '宝宝', emoji: '👶' }, { en: 'family', zh: '家庭', emoji: '👨‍👩‍👧' }
    ],
    food: [
      { en: 'rice', zh: '米饭', emoji: '🍚' }, { en: 'bread', zh: '面包', emoji: '🍞' },
      { en: 'egg', zh: '鸡蛋', emoji: '🥚' }, { en: 'milk', zh: '牛奶', emoji: '🥛' },
      { en: 'cake', zh: '蛋糕', emoji: '🍰' }, { en: 'noodles', zh: '面条', emoji: '🍜' },
      { en: 'fish', zh: '鱼', emoji: '🐟' }, { en: 'meat', zh: '肉', emoji: '🍖' },
      { en: 'water', zh: '水', emoji: '💧' }, { en: 'juice', zh: '果汁', emoji: '🧃' }
    ],
    // —— 三年级：玩具、交通、天气、动作 ——
    toy: [
      { en: 'ball', zh: '球', emoji: '⚽' }, { en: 'doll', zh: '洋娃娃', emoji: '🪆' },
      { en: 'kite', zh: '风筝', emoji: '🪁' }, { en: 'car', zh: '玩具车', emoji: '🚗' },
      { en: 'boat', zh: '小船', emoji: '⛵' }, { en: 'plane', zh: '飞机', emoji: '✈️' },
      { en: 'robot', zh: '机器人', emoji: '🤖' }, { en: 'balloon', zh: '气球', emoji: '🎈' }
    ],
    transport: [
      { en: 'bus', zh: '公交车', emoji: '🚌' }, { en: 'bike', zh: '自行车', emoji: '🚲' },
      { en: 'train', zh: '火车', emoji: '🚆' }, { en: 'ship', zh: '轮船', emoji: '🚢' },
      { en: 'taxi', zh: '出租车', emoji: '🚕' }, { en: 'jeep', zh: '吉普车', emoji: '🚙' },
      { en: 'subway', zh: '地铁', emoji: '🚇' }, { en: 'plane', zh: '飞机', emoji: '✈️' }
    ],
    weather: [
      { en: 'sunny', zh: '晴天', emoji: '☀️' }, { en: 'rainy', zh: '雨天', emoji: '🌧️' },
      { en: 'windy', zh: '有风', emoji: '💨' }, { en: 'cloudy', zh: '多云', emoji: '☁️' },
      { en: 'snowy', zh: '下雪', emoji: '❄️' }, { en: 'hot', zh: '热', emoji: '🥵' },
      { en: 'cold', zh: '冷', emoji: '🥶' }, { en: 'warm', zh: '温暖', emoji: '🌤️' }
    ],
    // —— 四年级：房间、衣服、职业、学科 ——
    room: [
      { en: 'bed', zh: '床', emoji: '🛏️' }, { en: 'desk', zh: '书桌', emoji: '🪑' },
      { en: 'door', zh: '门', emoji: '🚪' }, { en: 'window', zh: '窗户', emoji: '🪟' },
      { en: 'chair', zh: '椅子', emoji: '🪑' }, { en: 'clock', zh: '钟', emoji: '🕐' },
      { en: 'sofa', zh: '沙发', emoji: '🛋️' }, { en: 'lamp', zh: '台灯', emoji: '💡' }
    ],
    clothes: [
      { en: 'shirt', zh: '衬衫', emoji: '👕' }, { en: 'coat', zh: '外套', emoji: '🧥' },
      { en: 'dress', zh: '连衣裙', emoji: '👗' }, { en: 'shoes', zh: '鞋子', emoji: '👟' },
      { en: 'hat', zh: '帽子', emoji: '🎩' }, { en: 'socks', zh: '袜子', emoji: '🧦' },
      { en: 'skirt', zh: '裙子', emoji: '👚' }, { en: 'gloves', zh: '手套', emoji: '🧤' }
    ],
    job: [
      { en: 'teacher', zh: '老师', emoji: '👩‍🏫' }, { en: 'doctor', zh: '医生', emoji: '👨‍⚕️' },
      { en: 'nurse', zh: '护士', emoji: '👩‍⚕️' }, { en: 'farmer', zh: '农民', emoji: '👨‍🌾' },
      { en: 'cook', zh: '厨师', emoji: '👨‍🍳' }, { en: 'driver', zh: '司机', emoji: '🧑‍✈️' },
      { en: 'worker', zh: '工人', emoji: '👷' }, { en: 'police', zh: '警察', emoji: '👮' }
    ],
    subject: [
      { en: 'English', zh: '英语', emoji: '🔤' }, { en: 'Chinese', zh: '语文', emoji: '📕' },
      { en: 'math', zh: '数学', emoji: '➗' }, { en: 'music', zh: '音乐', emoji: '🎵' },
      { en: 'art', zh: '美术', emoji: '🎨' }, { en: 'PE', zh: '体育', emoji: '⚽' },
      { en: 'science', zh: '科学', emoji: '🔬' }, { en: 'history', zh: '历史', emoji: '📜' }
    ],
    // —— 五六年级：动词、季节、方位、自然 ——
    verb: [
      { en: 'run', zh: '跑', emoji: '🏃' }, { en: 'jump', zh: '跳', emoji: '🤸' },
      { en: 'swim', zh: '游泳', emoji: '🏊' }, { en: 'read', zh: '读', emoji: '📖' },
      { en: 'write', zh: '写', emoji: '✍️' }, { en: 'sing', zh: '唱歌', emoji: '🎤' },
      { en: 'dance', zh: '跳舞', emoji: '💃' }, { en: 'draw', zh: '画画', emoji: '🖌️' },
      { en: 'eat', zh: '吃', emoji: '🍽️' }, { en: 'sleep', zh: '睡觉', emoji: '😴' }
    ],
    season: [
      { en: 'spring', zh: '春天', emoji: '🌸' }, { en: 'summer', zh: '夏天', emoji: '🌞' },
      { en: 'autumn', zh: '秋天', emoji: '🍂' }, { en: 'winter', zh: '冬天', emoji: '⛄' }
    ],
    place: [
      { en: 'school', zh: '学校', emoji: '🏫' }, { en: 'home', zh: '家', emoji: '🏠' },
      { en: 'park', zh: '公园', emoji: '🏞️' }, { en: 'zoo', zh: '动物园', emoji: '🦓' },
      { en: 'hospital', zh: '医院', emoji: '🏥' }, { en: 'library', zh: '图书馆', emoji: '📚' },
      { en: 'shop', zh: '商店', emoji: '🏪' }, { en: 'farm', zh: '农场', emoji: '🚜' }
    ],
    nature: [
      { en: 'sun', zh: '太阳', emoji: '☀️' }, { en: 'moon', zh: '月亮', emoji: '🌙' },
      { en: 'star', zh: '星星', emoji: '⭐' }, { en: 'tree', zh: '树', emoji: '🌳' },
      { en: 'flower', zh: '花', emoji: '🌷' }, { en: 'river', zh: '河', emoji: '🏞️' },
      { en: 'mountain', zh: '山', emoji: '⛰️' }, { en: 'sky', zh: '天空', emoji: '🌌' }
    ]
  };

  // 汇总一个大池子，用于跨主题干扰项兜底
  const ALL_WORDS = [];
  Object.keys(WORDS).forEach(k => WORDS[k].forEach(w => ALL_WORDS.push(w)));

  // 取若干主题合并成词池
  function poolOf(topics) {
    const out = [];
    topics.forEach(t => { if (WORDS[t]) out.push.apply(out, WORDS[t]); });
    return out;
  }

  // ============ 句型 / 对话库 ============
  // { q: 问句/情景(英), zh: 中文提示, a: 正确答句(英), distractors:[...] }
  const DIALOGS = [
    { q: 'Hello!', zh: '别人跟你打招呼', a: 'Hi!', distractors: ['Bye!', 'No.', 'Thanks.'] },
    { q: 'How are you?', zh: '别人问你好吗', a: "I'm fine, thank you.", distractors: ['My name is Tom.', "I'm ten.", "It's red."] },
    { q: "What's your name?", zh: '别人问你叫什么', a: "My name is Tom.", distractors: ["I'm fine.", "I'm nine.", 'Thank you.'] },
    { q: 'How old are you?', zh: '别人问你几岁', a: "I'm nine.", distractors: ["I'm fine.", 'My name is Amy.', "It's a cat."] },
    { q: 'Nice to meet you.', zh: '初次见面', a: 'Nice to meet you, too.', distractors: ['Good night.', 'You are welcome.', 'See you.'] },
    { q: 'Thank you!', zh: '别人帮了你，你该说', a: "You're welcome.", distractors: ['Sorry.', 'Hello.', "I'm fine."] },
    { q: 'What colour is it? (🍎)', zh: '问苹果什么颜色', a: "It's red.", distractors: ["It's a dog.", "I'm five.", "It's Monday."] },
    { q: 'What is this? (🐱)', zh: '问这是什么', a: "It's a cat.", distractors: ["It's red.", "I'm fine.", 'Yes, it is.'] },
    { q: 'How many apples? (🍎🍎🍎)', zh: '问有几个苹果', a: 'Three.', distractors: ['Red.', 'A cat.', 'Monday.'] },
    { q: 'What day is it today?', zh: '问今天星期几', a: "It's Monday.", distractors: ["It's red.", "I'm ten.", "It's a pen."] },
    { q: 'Good morning!', zh: '早上问候', a: 'Good morning!', distractors: ['Good night!', 'Bye bye!', 'Sorry!'] },
    { q: 'Goodbye!', zh: '道别', a: 'Bye!', distractors: ['Hello!', 'Thank you.', 'Sorry.'] },
    { q: 'Can I help you?', zh: '店员问需要帮忙吗', a: 'Yes, please.', distractors: ['No, thanks.', "I'm fine.", 'Good.'].concat([]) },
    { q: 'Where is my bag?', zh: '问书包在哪', a: "It's on the desk.", distractors: ["It's red.", "I'm ten.", 'Thank you.'] },
    { q: 'Happy birthday!', zh: '生日祝福', a: 'Thank you!', distractors: ['Good morning.', 'Sorry.', 'See you.'] },
    { q: "Let's go to school.", zh: '提议去上学', a: 'OK!', distractors: ["It's red.", 'A dog.', "I'm fine."] },
    { q: 'Do you like apples?', zh: '问你喜欢苹果吗', a: 'Yes, I do.', distractors: ["It's red.", 'My name is Tom.', 'Three.'] },
    { q: 'What would you like?', zh: '问你想要什么', a: "I'd like some rice.", distractors: ["I'm fine.", "It's Monday.", 'Yes, I do.'] }
  ];

  // ============ 语法题库 ============
  // be 动词、a/an、单复数、一般现在时第三人称
  function grammarPool() {
    const items = [];
    // be 动词
    items.push({ text: 'I ___ a student.', a: 'am', opts: ['am', 'is', 'are', 'be'] });
    items.push({ text: 'She ___ my teacher.', a: 'is', opts: ['is', 'am', 'are', 'be'] });
    items.push({ text: 'He ___ a doctor.', a: 'is', opts: ['is', 'am', 'are', 'do'] });
    items.push({ text: 'They ___ my friends.', a: 'are', opts: ['are', 'is', 'am', 'be'] });
    items.push({ text: 'We ___ happy.', a: 'are', opts: ['are', 'is', 'am', 'do'] });
    items.push({ text: 'It ___ a cat.', a: 'is', opts: ['is', 'are', 'am', 'be'] });
    items.push({ text: 'You ___ tall.', a: 'are', opts: ['are', 'is', 'am', 'be'] });
    // a / an
    items.push({ text: "It's ___ apple.", a: 'an', opts: ['an', 'a', 'the', 'x'] });
    items.push({ text: "It's ___ egg.", a: 'an', opts: ['an', 'a', 'two', 'x'] });
    items.push({ text: "It's ___ dog.", a: 'a', opts: ['a', 'an', 'the', 'x'] });
    items.push({ text: "It's ___ orange.", a: 'an', opts: ['an', 'a', 'some', 'x'] });
    items.push({ text: "It's ___ book.", a: 'a', opts: ['a', 'an', 'two', 'x'] });
    items.push({ text: "It's ___ hour.", a: 'an', opts: ['an', 'a', 'the', 'x'] });
    // 单复数
    items.push({ text: 'two ___ (book)', a: 'books', opts: ['books', 'book', 'bookes', 'bookies'] });
    items.push({ text: 'three ___ (cat)', a: 'cats', opts: ['cats', 'cat', 'cates', 'caties'] });
    items.push({ text: 'five ___ (box)', a: 'boxes', opts: ['boxes', 'boxs', 'box', 'boxies'] });
    items.push({ text: 'two ___ (baby)', a: 'babies', opts: ['babies', 'babys', 'baby', 'babyes'] });
    items.push({ text: 'many ___ (bus)', a: 'buses', opts: ['buses', 'buss', 'bus', 'busies'] });
    items.push({ text: 'four ___ (apple)', a: 'apples', opts: ['apples', 'apple', 'applees', 'applies'] });
    // 一般现在时第三人称单数
    items.push({ text: 'He ___ football. (play)', a: 'plays', opts: ['plays', 'play', 'playes', 'playing'] });
    items.push({ text: 'She ___ to school. (go)', a: 'goes', opts: ['goes', 'go', 'gos', 'going'] });
    items.push({ text: 'My mother ___ TV. (watch)', a: 'watches', opts: ['watches', 'watchs', 'watch', 'watching'] });
    items.push({ text: 'The cat ___ fish. (like)', a: 'likes', opts: ['likes', 'like', 'likees', 'liking'] });
    items.push({ text: 'Tom ___ his homework. (do)', a: 'does', opts: ['does', 'do', 'dos', 'doing'] });
    // 代词/其它高频
    items.push({ text: 'This is ___ pen. (我的)', a: 'my', opts: ['my', 'I', 'me', 'mine'] });
    items.push({ text: 'Give it to ___ . (他)', a: 'him', opts: ['him', 'he', 'his', 'her'] });
    items.push({ text: '___ you like tea? ', a: 'Do', opts: ['Do', 'Does', 'Is', 'Are'] });
    items.push({ text: '___ she a nurse? ', a: 'Is', opts: ['Is', 'Are', 'Am', 'Do'] });
    return items;
  }
  const GRAMMAR = grammarPool();

  // ============ 题目生成器 ============

  // 词义题（英→中）：读英文，选中文
  function wordEnToZh(topics) {
    const pool = poolOf(topics);
    const w = pick(pool);
    const opts = options4(w, ALL_WORDS, x => x.zh).map(x => x.zh);
    return {
      inputMode: 'choice',
      text: '<span class="en-word">' + w.en + '</span>',
      speak: w.en,
      answer: w.zh,
      options: opts,
      hint: '选出中文意思'
    };
  }

  // 词义题（中→英）：给中文/图，选英文
  function wordZhToEn(topics) {
    const pool = poolOf(topics);
    const w = pick(pool);
    const opts = options4(w, ALL_WORDS, x => x.en).map(x => x.en);
    return {
      inputMode: 'choice',
      text: '<span class="en-emoji">' + w.emoji + '</span><span class="en-zh">' + w.zh + '</span>',
      speakOnReveal: w.en,
      answer: w.en,
      options: opts,
      hint: '选出英文单词'
    };
  }

  // 看图选词（图→英）：纯图片选英文，最直观，适合低年级
  function wordPicToEn(topics) {
    const pool = poolOf(topics);
    const w = pick(pool);
    const opts = options4(w, ALL_WORDS, x => x.en).map(x => x.en);
    return {
      inputMode: 'choice',
      text: '<span class="en-emoji big">' + w.emoji + '</span>',
      speakOnReveal: w.en,
      answer: w.en,
      options: opts,
      hint: '这是什么？'
    };
  }

  // 拼写题：听/看词，用字母键盘拼出来（缺 1-2 个字母或全拼）
  function spellWord(topics, blanks) {
    const pool = poolOf(topics).filter(w => /^[a-zA-Z]+$/.test(w.en) && w.en.length <= 8);
    const w = pick(pool);
    const en = w.en.toLowerCase();
    return {
      inputMode: 'spell',
      text: '<span class="en-emoji">' + w.emoji + '</span><span class="en-zh">' + w.zh + '</span>',
      speak: w.en,
      answer: en,
      // 字母键盘：正确字母 + 干扰字母，打乱
      letters: makeLetterKeys(en),
      hint: '拼出这个单词'
    };
  }

  // 为拼写题构造字母键（含正确字母，补足干扰字母到 12 个）
  function makeLetterKeys(word) {
    const letters = word.split('');
    const set = letters.slice();
    const alpha = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let guard = 0;
    while (set.length < Math.max(12, letters.length + 4) && guard < 100) {
      guard++;
      const c = pick(alpha);
      set.push(c);
    }
    return shuffle(set);
  }

  // 句型对话题
  function dialog() {
    const d = pick(DIALOGS);
    const opts = shuffle([d.a].concat(d.distractors.slice(0, 3)));
    return {
      inputMode: 'choice',
      text: '<span class="en-dialog">' + d.q + '</span><span class="en-zh">（' + d.zh + '）</span>',
      speak: d.q.replace(/\s*\([^)]*\)/g, ''),
      answer: d.a,
      options: opts,
      hint: '选出正确的回答',
      long: true
    };
  }

  // 语法题
  function grammar() {
    const g = pick(GRAMMAR);
    const opts = shuffle(g.opts.slice(0, 4));
    return { inputMode: 'choice', text: g.text, answer: g.a, options: opts, hint: '选出正确的词', long: true };
  }

  // ============ 题型分发（levels 里的 type 映射到这里）============
  const GEN = {
    // 一年级：颜色/数字/动物/水果，图→英 & 英→中
    en_g1_color: () => pick([wordPicToEn(['color']), wordZhToEn(['color'])]),
    en_g1_animal: () => pick([wordPicToEn(['animal']), wordEnToZh(['animal'])]),
    en_g1_number: () => pick([wordPicToEn(['number']), wordZhToEn(['number'])]),
    en_g1_fruit: () => pick([wordPicToEn(['fruit']), wordEnToZh(['fruit'])]),
    // 二年级：文具/身体/家庭/食物，中英互选 + 简单拼写
    en_g2_stationery: () => pick([wordZhToEn(['stationery']), wordEnToZh(['stationery'])]),
    en_g2_body: () => pick([wordPicToEn(['body']), wordEnToZh(['body'])]),
    en_g2_family: () => pick([wordZhToEn(['family']), wordEnToZh(['family'])]),
    en_g2_spell: () => spellWord(['color', 'animal', 'fruit', 'number']),
    // 三年级：玩具/交通/天气 + 拼写 + 打招呼对话
    en_g3_toy: () => pick([wordZhToEn(['toy']), wordEnToZh(['toy'])]),
    en_g3_transport: () => pick([wordZhToEn(['transport']), wordEnToZh(['transport'])]),
    en_g3_spell: () => spellWord(['stationery', 'body', 'family', 'food']),
    en_g3_dialog: () => dialog(),
    // 四年级：房间/衣服/职业/学科 + 拼写
    en_g4_room: () => pick([wordZhToEn(['room']), wordEnToZh(['room'])]),
    en_g4_clothes: () => pick([wordZhToEn(['clothes']), wordEnToZh(['clothes'])]),
    en_g4_job: () => pick([wordZhToEn(['job']), wordEnToZh(['job'])]),
    en_g4_spell: () => spellWord(['toy', 'transport', 'weather', 'room']),
    // 五年级：动词/季节/地点 + 对话 + 语法入门
    en_g5_verb: () => pick([wordZhToEn(['verb']), wordEnToZh(['verb'])]),
    en_g5_place: () => pick([wordZhToEn(['place']), wordEnToZh(['place'])]),
    en_g5_dialog: () => dialog(),
    en_g5_grammar: () => grammar(),
    // 六年级：自然/学科混合 + 拼写 + 对话 + 语法综合
    en_g6_nature: () => pick([wordZhToEn(['nature']), wordEnToZh(['nature'])]),
    en_g6_spell: () => spellWord(['clothes', 'job', 'verb', 'place', 'nature']),
    en_g6_dialog: () => dialog(),
    en_g6_grammar: () => grammar()
  };

  function generate(type, count) {
    const gen = GEN[type];
    if (!gen) return [];
    const out = [];
    let guard = 0;
    const seen = new Set();
    while (out.length < count && guard < count * 20) {
      guard++;
      const q = gen();
      if (!q) continue;
      // 尽量不连续重复同一题干
      const key = q.text + '|' + q.answer;
      if (seen.has(key) && guard < count * 12) continue;
      seen.add(key);
      out.push(q);
    }
    return out;
  }

  global.English = {
    generate: generate,
    WORDS: WORDS,
    hasType: (t) => !!GEN[t],
    _dialogCount: DIALOGS.length,
    _grammarCount: GRAMMAR.length
  };
})(window);
