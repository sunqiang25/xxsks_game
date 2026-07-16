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
      { en: 'elephant', zh: '大象', emoji: '🐘' }, { en: 'lion', zh: '狮子', emoji: '🦁' },
      { en: 'cow', zh: '奶牛', emoji: '🐮' }, { en: 'horse', zh: '马', emoji: '🐴' },
      { en: 'sheep', zh: '绵羊', emoji: '🐑' }, { en: 'chicken', zh: '鸡', emoji: '🐔' },
      { en: 'bear', zh: '熊', emoji: '🐻' }, { en: 'fox', zh: '狐狸', emoji: '🦊' },
      { en: 'frog', zh: '青蛙', emoji: '🐸' }, { en: 'bee', zh: '蜜蜂', emoji: '🐝' }
    ],
    fruit: [
      { en: 'apple', zh: '苹果', emoji: '🍎' }, { en: 'banana', zh: '香蕉', emoji: '🍌' },
      { en: 'orange', zh: '橙子', emoji: '🍊' }, { en: 'pear', zh: '梨', emoji: '🍐' },
      { en: 'grape', zh: '葡萄', emoji: '🍇' }, { en: 'peach', zh: '桃子', emoji: '🍑' },
      { en: 'watermelon', zh: '西瓜', emoji: '🍉' }, { en: 'strawberry', zh: '草莓', emoji: '🍓' },
      { en: 'lemon', zh: '柠檬', emoji: '🍋' }, { en: 'mango', zh: '芒果', emoji: '🥭' },
      { en: 'cherry', zh: '樱桃', emoji: '🍒' }, { en: 'pineapple', zh: '菠萝', emoji: '🍍' },
      { en: 'coconut', zh: '椰子', emoji: '🥥' }, { en: 'kiwi', zh: '猕猴桃', emoji: '🥝' },
      { en: 'tomato', zh: '西红柿', emoji: '🍅' }, { en: 'grapefruit', zh: '柚子', emoji: '🍊' }
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
      { en: 'crayon', zh: '蜡笔', emoji: '🖍️' }, { en: 'box', zh: '盒子', emoji: '📦' },
      { en: 'notebook', zh: '笔记本', emoji: '📓' }, { en: 'scissors', zh: '剪刀', emoji: '✂️' },
      { en: 'glue', zh: '胶水', emoji: '🩹' }, { en: 'brush', zh: '画笔', emoji: '🖌️' }
    ],
    body: [
      { en: 'head', zh: '头', emoji: '👤' }, { en: 'hand', zh: '手', emoji: '✋' },
      { en: 'eye', zh: '眼睛', emoji: '👁️' }, { en: 'ear', zh: '耳朵', emoji: '👂' },
      { en: 'nose', zh: '鼻子', emoji: '👃' }, { en: 'mouth', zh: '嘴', emoji: '👄' },
      { en: 'foot', zh: '脚', emoji: '🦶' }, { en: 'leg', zh: '腿', emoji: '🦵' },
      { en: 'hair', zh: '头发', emoji: '💇' }, { en: 'tooth', zh: '牙齿', emoji: '🦷' },
      { en: 'arm', zh: '手臂', emoji: '💪' }, { en: 'face', zh: '脸', emoji: '😊' }
    ],
    family: [
      { en: 'father', zh: '爸爸', emoji: '👨' }, { en: 'mother', zh: '妈妈', emoji: '👩' },
      { en: 'brother', zh: '兄弟', emoji: '👦' }, { en: 'sister', zh: '姐妹', emoji: '👧' },
      { en: 'grandpa', zh: '爷爷', emoji: '👴' }, { en: 'grandma', zh: '奶奶', emoji: '👵' },
      { en: 'baby', zh: '宝宝', emoji: '👶' }, { en: 'family', zh: '家庭', emoji: '👨‍👩‍👧' },
      { en: 'uncle', zh: '叔叔', emoji: '🧔' }, { en: 'aunt', zh: '阿姨', emoji: '👩' },
      { en: 'friend', zh: '朋友', emoji: '🧑‍🤝‍🧑' }, { en: 'cousin', zh: '表亲', emoji: '🧒' }
    ],
    food: [
      { en: 'rice', zh: '米饭', emoji: '🍚' }, { en: 'bread', zh: '面包', emoji: '🍞' },
      { en: 'egg', zh: '鸡蛋', emoji: '🥚' }, { en: 'milk', zh: '牛奶', emoji: '🥛' },
      { en: 'cake', zh: '蛋糕', emoji: '🍰' }, { en: 'noodles', zh: '面条', emoji: '🍜' },
      { en: 'fish', zh: '鱼', emoji: '🐟' }, { en: 'meat', zh: '肉', emoji: '🍖' },
      { en: 'water', zh: '水', emoji: '💧' }, { en: 'juice', zh: '果汁', emoji: '🧃' },
      { en: 'hamburger', zh: '汉堡', emoji: '🍔' }, { en: 'hot dog', zh: '热狗', emoji: '🌭' },
      { en: 'chips', zh: '薯条', emoji: '🍟' }, { en: 'ice cream', zh: '冰淇淋', emoji: '🍦' },
      { en: 'candy', zh: '糖果', emoji: '🍬' }, { en: 'cookie', zh: '饼干', emoji: '🍪' }
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
      { en: 'eat', zh: '吃', emoji: '🍽️' }, { en: 'sleep', zh: '睡觉', emoji: '😴' },
      { en: 'walk', zh: '走', emoji: '🚶' }, { en: 'talk', zh: '说话', emoji: '🗣️' },
      { en: 'play', zh: '玩', emoji: '🎮' }, { en: 'cook', zh: '做饭', emoji: '🍳' },
      { en: 'fly', zh: '飞', emoji: '🕊️' }, { en: 'listen', zh: '听', emoji: '👂' }
    ],
    season: [
      { en: 'spring', zh: '春天', emoji: '🌸' }, { en: 'summer', zh: '夏天', emoji: '🌞' },
      { en: 'autumn', zh: '秋天', emoji: '🍂' }, { en: 'winter', zh: '冬天', emoji: '⛄' }
    ],
    place: [
      { en: 'school', zh: '学校', emoji: '🏫' }, { en: 'home', zh: '家', emoji: '🏠' },
      { en: 'park', zh: '公园', emoji: '🏞️' }, { en: 'zoo', zh: '动物园', emoji: '🦓' },
      { en: 'hospital', zh: '医院', emoji: '🏥' }, { en: 'library', zh: '图书馆', emoji: '📚' },
      { en: 'shop', zh: '商店', emoji: '🏪' }, { en: 'farm', zh: '农场', emoji: '🚜' },
      { en: 'bank', zh: '银行', emoji: '🏦' }, { en: 'restaurant', zh: '餐厅', emoji: '🍽️' },
      { en: 'cinema', zh: '电影院', emoji: '🎬' }, { en: 'museum', zh: '博物馆', emoji: '🏛️' }
    ],
    nature: [
      { en: 'sun', zh: '太阳', emoji: '☀️' }, { en: 'moon', zh: '月亮', emoji: '🌙' },
      { en: 'star', zh: '星星', emoji: '⭐' }, { en: 'tree', zh: '树', emoji: '🌳' },
      { en: 'flower', zh: '花', emoji: '🌷' }, { en: 'river', zh: '河', emoji: '🏞️' },
      { en: 'mountain', zh: '山', emoji: '⛰️' }, { en: 'sky', zh: '天空', emoji: '🌌' },
      { en: 'sea', zh: '大海', emoji: '🌊' }, { en: 'cloud', zh: '云', emoji: '☁️' },
      { en: 'rain', zh: '雨', emoji: '🌧️' }, { en: 'grass', zh: '草', emoji: '🌱' }
    ],
    // —— 新增主题 ——
    month: [
      { en: 'January', zh: '一月', emoji: '1️⃣' }, { en: 'February', zh: '二月', emoji: '2️⃣' },
      { en: 'March', zh: '三月', emoji: '3️⃣' }, { en: 'April', zh: '四月', emoji: '4️⃣' },
      { en: 'May', zh: '五月', emoji: '5️⃣' }, { en: 'June', zh: '六月', emoji: '6️⃣' },
      { en: 'July', zh: '七月', emoji: '7️⃣' }, { en: 'August', zh: '八月', emoji: '8️⃣' },
      { en: 'September', zh: '九月', emoji: '9️⃣' }, { en: 'October', zh: '十月', emoji: '🔟' },
      { en: 'November', zh: '十一月', emoji: '🍂' }, { en: 'December', zh: '十二月', emoji: '🎄' }
    ],
    weekday: [
      { en: 'Monday', zh: '星期一', emoji: '📅' }, { en: 'Tuesday', zh: '星期二', emoji: '📅' },
      { en: 'Wednesday', zh: '星期三', emoji: '📅' }, { en: 'Thursday', zh: '星期四', emoji: '📅' },
      { en: 'Friday', zh: '星期五', emoji: '📅' }, { en: 'Saturday', zh: '星期六', emoji: '🎉' },
      { en: 'Sunday', zh: '星期日', emoji: '☀️' }
    ],
    feeling: [
      { en: 'happy', zh: '高兴', emoji: '😄' }, { en: 'sad', zh: '难过', emoji: '😢' },
      { en: 'angry', zh: '生气', emoji: '😠' }, { en: 'tired', zh: '累', emoji: '😫' },
      { en: 'hungry', zh: '饿', emoji: '😋' }, { en: 'afraid', zh: '害怕', emoji: '😨' },
      { en: 'excited', zh: '兴奋', emoji: '🤩' }, { en: 'sleepy', zh: '困', emoji: '😴' }
    ],
    drink: [
      { en: 'tea', zh: '茶', emoji: '🍵' }, { en: 'coffee', zh: '咖啡', emoji: '☕' },
      { en: 'water', zh: '水', emoji: '💧' }, { en: 'milk', zh: '牛奶', emoji: '🥛' },
      { en: 'juice', zh: '果汁', emoji: '🧃' }, { en: 'cola', zh: '可乐', emoji: '🥤' },
      { en: 'soup', zh: '汤', emoji: '🍲' }, { en: 'water', zh: '开水', emoji: '🚰' }
    ],
    sport: [
      { en: 'football', zh: '足球', emoji: '⚽' }, { en: 'basketball', zh: '篮球', emoji: '🏀' },
      { en: 'ping-pong', zh: '乒乓球', emoji: '🏓' }, { en: 'badminton', zh: '羽毛球', emoji: '🏸' },
      { en: 'swimming', zh: '游泳', emoji: '🏊' }, { en: 'running', zh: '跑步', emoji: '🏃' },
      { en: 'tennis', zh: '网球', emoji: '🎾' }, { en: 'skating', zh: '滑冰', emoji: '⛸️' }
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
    { q: 'What would you like?', zh: '问你想要什么', a: "I'd like some rice.", distractors: ["I'm fine.", "It's Monday.", 'Yes, I do.'] },
    { q: 'What time is it?', zh: '问几点了', a: "It's seven o'clock.", distractors: ["It's Monday.", "It's red.", "I'm seven."] },
    { q: 'How is the weather today?', zh: '问今天天气', a: "It's sunny.", distractors: ["It's a cat.", "I'm fine.", "It's a pen."] },
    { q: 'Where are you from?', zh: '问你来自哪里', a: "I'm from China.", distractors: ["I'm nine.", "It's red.", 'Thank you.'] },
    { q: 'Whose book is this?', zh: '问这是谁的书', a: "It's mine.", distractors: ["It's Monday.", "I'm fine.", 'Three.'] },
    { q: 'Can you swim?', zh: '问你会游泳吗', a: 'Yes, I can.', distractors: ["It's red.", 'My name is Tom.', "It's Monday."] },
    { q: 'What are you doing?', zh: '问你在做什么', a: "I'm reading a book.", distractors: ["I'm fine.", "It's red.", 'Yes, I am.'] },
    { q: 'How much is the pen?', zh: '问钢笔多少钱', a: "It's five yuan.", distractors: ["It's Monday.", "I'm five.", "It's a pen."] },
    { q: "What's your favourite fruit?", zh: '问你最爱吃的水果', a: 'I like apples.', distractors: ["I'm fine.", "It's Monday.", 'Yes, I do.'] },
    { q: 'Are you OK?', zh: '关心地问你还好吗', a: "Yes, I'm OK.", distractors: ["It's red.", 'My name is Amy.', 'Monday.'] },
    { q: 'See you tomorrow!', zh: '约定明天见', a: 'See you!', distractors: ['Good morning!', 'Thank you.', 'How old are you?'] },
    { q: 'Excuse me.', zh: '想请别人让一下/引起注意', a: "Yes? Can I help you?", distractors: ['Good night.', "I'm ten.", "It's red."] }
  ];

  // ============ 生活情景对话库（贴合真实生活场景）============
  // { g: 年级档 low(1-2)/mid(3-4)/high(5-6), scene: emoji+场景, ctx: 英文情景, zh: 中文提示, a: 正确回答, distractors:[...] }
  const LIFE_DIALOGS = [
    // —— 低年级 low：打招呼、课堂、简单购物 ——
    { g: 'low', scene: '🏫 在学校', ctx: 'You meet your teacher in the morning.', zh: '早上遇到老师该怎么问候', a: 'Good morning, Miss Li!', distractors: ['Good night!', 'Bye bye!', "It's red."] },
    { g: 'low', scene: '🏫 在课堂', ctx: 'You want to go to the toilet in class.', zh: '上课想去洗手间，举手说', a: 'May I go to the toilet?', distractors: ['I like apples.', "It's a dog.", 'Thank you.'] },
    { g: 'low', scene: '🛒 在商店', ctx: 'You want to buy a pencil. The shopkeeper asks "Can I help you?"', zh: '你想买一支铅笔', a: 'I want a pencil, please.', distractors: ["I'm nine.", "It's sunny.", 'Good night.'] },
    { g: 'low', scene: '🎂 生日会', ctx: "It's your friend's birthday.", zh: '朋友过生日，你对他说', a: 'Happy birthday!', distractors: ['Good morning.', 'Sorry.', 'How much?'] },
    { g: 'low', scene: '🍎 在家', ctx: 'Mum asks: "Do you want an apple?"', zh: '妈妈问你要不要苹果，你想要', a: 'Yes, please.', distractors: ['No, I am.', "It's red.", 'See you.'] },
    { g: 'low', scene: '👋 放学', ctx: 'School is over. You say goodbye to your friend.', zh: '放学和同学道别', a: 'See you tomorrow!', distractors: ['Good morning!', 'How old are you?', 'I like it.'] },
    // —— 中年级 mid：问路、点餐、购物付钱 ——
    { g: 'mid', scene: '🍔 在快餐店', ctx: 'The waiter asks: "What would you like to eat?"', zh: '服务员问你想吃什么', a: "I'd like a hamburger.", distractors: ['I am fine.', "It's Monday.", 'You are welcome.'] },
    { g: 'mid', scene: '🛒 超市付钱', ctx: 'You want to know the price of the milk.', zh: '你想问牛奶多少钱', a: 'How much is it?', distractors: ['How old are you?', 'What time is it?', 'Where are you?'] },
    { g: 'mid', scene: '🗺️ 问路', ctx: 'You are lost. You want to find the library.', zh: '你迷路了，想问图书馆怎么走', a: 'Where is the library?', distractors: ['How are you?', 'What colour is it?', 'How many books?'] },
    { g: 'mid', scene: '🍦 买冰淇淋', ctx: 'The seller asks: "How many ice creams?"', zh: '你想买两个冰淇淋', a: 'Two, please.', distractors: ["It's cold.", 'I am ten.', 'Yes, I do.'] },
    { g: 'mid', scene: '📞 打电话', ctx: 'You call your friend. He picks up.', zh: '你打电话找朋友 Tom', a: 'Hello, is that Tom?', distractors: ['Good night, Tom.', 'I am Tom.', 'How much is Tom?'] },
    { g: 'mid', scene: '🚌 坐公交', ctx: 'You want to know if this bus goes to the zoo.', zh: '想问这辆车去不去动物园', a: 'Does this bus go to the zoo?', distractors: ['I like the zoo.', 'The zoo is big.', 'How old is the zoo?'] },
    // —— 高年级 high：看病、求助、餐厅、失物 ——
    { g: 'high', scene: '🏥 看医生', ctx: 'You feel sick. The doctor asks what is wrong.', zh: '医生问你怎么了，你头疼', a: 'I have a headache.', distractors: ["I'm happy.", "It's a nice day.", 'I like doctors.'] },
    { g: 'high', scene: '🆘 求助', ctx: 'You fall down and hurt your leg. You need help.', zh: '你摔倒了需要帮忙', a: 'Could you help me, please?', distractors: ['You are welcome.', 'Here you are.', 'Never mind.'] },
    { g: 'high', scene: '🍽️ 在餐厅', ctx: 'The waiter asks: "Are you ready to order?"', zh: '服务员问你准备好点餐了吗', a: "Yes, I'd like some noodles.", distractors: ['No, I am hungry.', "It's delicious.", 'I am a waiter.'] },
    { g: 'high', scene: '🎒 丢东西', ctx: 'You lost your bag. You ask the guard for help.', zh: '你的书包丢了，向保安求助', a: "I can't find my bag.", distractors: ['My bag is nice.', 'I have a bag.', 'The bag is red.'] },
    { g: 'high', scene: '🏨 问洗手间', ctx: 'You are in a restaurant and need the washroom.', zh: '在餐厅想问洗手间在哪', a: 'Excuse me, where is the washroom?', distractors: ['How much is the washroom?', 'I like the washroom.', 'The washroom is nice.'] },
    { g: 'high', scene: '🛍️ 买衣服', ctx: 'The shop assistant asks: "What size do you want?"', zh: '店员问你要多大尺码', a: "Size M, please.", distractors: ['I am fine, thanks.', "It's Monday.", 'You are welcome.'] },
    { g: 'low', scene: '🎈 分享', ctx: 'Your friend gives you a balloon.', zh: '朋友送你一个气球', a: 'Thank you!', distractors: ['Sorry.', 'Goodbye.', "I'm nine."] },
    { g: 'low', scene: '🍬 想要糖', ctx: 'Mum asks: "Do you want some candy?"', zh: '妈妈问你要不要糖，你很想要', a: 'Yes, please!', distractors: ['No, I am.', "It's red.", 'Good night.'] },
    { g: 'low', scene: '🚪 进教室', ctx: 'You are late. Before you go in, you should say...', zh: '上课迟到进教室前该说', a: 'May I come in?', distractors: ['Goodbye!', 'I like school.', "It's sunny."] },
    { g: 'low', scene: '🧴 洗手', ctx: 'Before lunch, the teacher says wash your hands.', zh: '午饭前老师叫你洗手，你回答', a: 'OK, Miss Li.', distractors: ["It's red.", 'How much?', 'I am five.'] },
    { g: 'mid', scene: '🎂 点蛋糕', ctx: 'At the bakery, you want a chocolate cake.', zh: '在蛋糕店想买巧克力蛋糕', a: 'I want a chocolate cake, please.', distractors: ['I am a cake.', "It's Monday.", 'How old are you?'] },
    { g: 'mid', scene: '🚏 找车站', ctx: 'You want to find the bus stop.', zh: '你想问公交车站在哪', a: 'Where is the bus stop?', distractors: ['How are you?', 'What is this?', 'How many buses?'] },
    { g: 'mid', scene: '📚 借书', ctx: 'At the library, you want to borrow this book.', zh: '在图书馆想借这本书', a: 'Can I borrow this book?', distractors: ['This book is red.', 'I like books.', 'How old is the book?'] },
    { g: 'mid', scene: '🎡 问价格', ctx: 'At the park gate, you ask about the ticket.', zh: '在公园门口问门票多少钱', a: 'How much is the ticket?', distractors: ['I like the park.', 'The park is big.', 'What day is it?'] },
    { g: 'high', scene: '📞 请假', ctx: 'You are ill. You call your teacher to ask for leave.', zh: '生病了，打电话向老师请假', a: "I'm ill, so I can't come to school today.", distractors: ['I like school.', 'The school is big.', 'How much is school?'] },
    { g: 'high', scene: '🏪 退换', ctx: 'The shoes are too small. You go back to the shop.', zh: '鞋子太小，回店里想换', a: 'These shoes are too small. Can I change them?', distractors: ['I like shoes.', 'The shoes are red.', 'How old are the shoes?'] },
    { g: 'high', scene: '🗺️ 指路', ctx: 'A tourist asks you the way to the station.', zh: '游客问你去车站怎么走', a: 'Go straight and turn left.', distractors: ["I'm fine, thank you.", "It's Monday.", 'I like the station.'] },
    { g: 'high', scene: '🍜 加菜', ctx: 'The waiter asks if you want anything else.', zh: '服务员问还要别的吗', a: "No, thanks. That's all.", distractors: ['Yes, I am hungry.', 'I am a waiter.', "It's delicious."] }
  ];

  // 生活情景对话生成器：按年级档筛选，输出与 dialog() 同构的选择题
  function lifeDialog(tier) {
    let pool = LIFE_DIALOGS.filter(d => d.g === tier);
    if (!pool.length) pool = LIFE_DIALOGS;
    const d = pick(pool);
    const opts = shuffle([d.a].concat(d.distractors.slice(0, 3)));
    return {
      inputMode: 'choice',
      text: '<span class="en-scene">' + d.scene + '</span>' +
            '<span class="en-context">' + d.ctx + '</span>' +
            '<span class="en-zh">（' + d.zh + '）</span>',
      speak: d.ctx,
      answer: d.a,
      options: opts,
      hint: '选出最合适的英文回答',
      long: true,
      sec: 30
    };
  }

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
      long: true,
      sec: 20
    };
  }

  // 语法题
  function grammar() {
    const g = pick(GRAMMAR);
    const opts = shuffle(g.opts.slice(0, 4));
    return { inputMode: 'choice', text: g.text, answer: g.a, options: opts, hint: '选出正确的词', long: true, sec: 18 };
  }

  // 自然拼读（新思维特色）：听发音，选首字母/结尾不发音字母
  const PHONICS = [
    { word: 'cat', zh: '猫', ask: '首字母', a: 'c', opts: ['c', 'k', 's', 'g'] },
    { word: 'dog', zh: '狗', ask: '首字母', a: 'd', opts: ['d', 't', 'b', 'p'] },
    { word: 'sun', zh: '太阳', ask: '首字母', a: 's', opts: ['s', 'z', 'c', 'x'] },
    { word: 'fish', zh: '鱼', ask: '首字母', a: 'f', opts: ['f', 'v', 'p', 't'] },
    { word: 'ball', zh: '球', ask: '首字母', a: 'b', opts: ['b', 'p', 'd', 'v'] },
    { word: 'map', zh: '地图', ask: '首字母', a: 'm', opts: ['m', 'n', 'b', 'w'] },
    { word: 'red', zh: '红', ask: '首字母', a: 'r', opts: ['r', 'l', 'w', 'n'] },
    { word: 'hat', zh: '帽子', ask: '首字母', a: 'h', opts: ['h', 'a', 'e', 'j'] },
    { word: 'pen', zh: '钢笔', ask: '首字母', a: 'p', opts: ['p', 'b', 'd', 'q'] },
    { word: 'net', zh: '网', ask: '首字母', a: 'n', opts: ['n', 'm', 'l', 'r'] },
    { word: 'six', zh: '六', ask: '首字母', a: 's', opts: ['s', 'z', 'x', 'c'] },
    { word: 'cake', zh: '蛋糕', ask: '结尾不发音字母', a: 'e', opts: ['e', 'a', 'k', 'c'] },
    { word: 'bike', zh: '自行车', ask: '结尾不发音字母', a: 'e', opts: ['e', 'i', 'k', 'b'] },
    { word: 'nose', zh: '鼻子', ask: '结尾不发音字母', a: 'e', opts: ['e', 'o', 's', 'n'] }
  ];
  function phonics() {
    const p = pick(PHONICS);
    const opts = shuffle(p.opts.slice(0, 4));
    return {
      inputMode: 'choice',
      text: '<span class="en-word">' + p.word + '</span><span class="en-zh">（' + p.zh + '）</span>',
      speak: p.word,
      answer: p.a,
      options: opts,
      hint: '听发音，选「' + p.ask + '」',
      long: true
    };
  }

  // ============ 题型分发（levels 里的 type 映射到这里）============
  const GEN = {
    en_phonics: () => phonics(),
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
    // 三年级：玩具/交通/天气/运动 + 拼写 + 打招呼对话
    en_g3_toy: () => pick([wordZhToEn(['toy']), wordEnToZh(['toy']), wordZhToEn(['sport']), wordEnToZh(['sport'])]),
    en_g3_transport: () => pick([wordZhToEn(['transport']), wordEnToZh(['transport']), wordEnToZh(['weather'])]),
    en_g3_spell: () => spellWord(['stationery', 'body', 'family', 'food']),
    en_g3_dialog: () => dialog(),
    // 四年级：房间/衣服/职业/学科 + 拼写
    en_g4_room: () => pick([wordZhToEn(['room']), wordEnToZh(['room'])]),
    en_g4_clothes: () => pick([wordZhToEn(['clothes']), wordEnToZh(['clothes'])]),
    en_g4_job: () => pick([wordZhToEn(['job']), wordEnToZh(['job']), wordEnToZh(['subject'])]),
    en_g4_spell: () => spellWord(['toy', 'transport', 'weather', 'room', 'sport']),
    // 五年级：动词/季节/地点/情绪 + 对话 + 语法入门
    en_g5_verb: () => pick([wordZhToEn(['verb']), wordEnToZh(['verb']), wordEnToZh(['feeling'])]),
    en_g5_place: () => pick([wordZhToEn(['place']), wordEnToZh(['place']), wordEnToZh(['drink'])]),
    en_g5_dialog: () => dialog(),
    en_g5_grammar: () => grammar(),
    // 六年级：自然/月份星期/学科混合 + 拼写 + 对话 + 语法综合
    en_g6_nature: () => pick([wordZhToEn(['nature']), wordEnToZh(['nature']), wordEnToZh(['month']), wordEnToZh(['weekday'])]),
    en_g6_spell: () => spellWord(['clothes', 'job', 'verb', 'place', 'nature']),
    en_g6_dialog: () => dialog(),
    en_g6_grammar: () => grammar(),
    // 生活情景对话（按年级档）
    en_life_low: () => lifeDialog('low'),
    en_life_mid: () => lifeDialog('mid'),
    en_life_high: () => lifeDialog('high')
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
