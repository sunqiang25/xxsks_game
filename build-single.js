// 构建脚本：把 css + 5 个 js 内联进 index.html，输出单文件 口算太空大冒险.html
// 用法：node build-single.js
const fs = require("fs");
const path = require("path");

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const css = read("css/style.css");
const js = [
  read("js/questions.js"),
  read("js/levels.js"),
  read("js/storage.js"),
  read("js/sound.js"),
  read("js/game.js")
].join("\n\n/* ==================== */\n\n");

let html = read("index.html");

// 1. 替换外部 CSS 引用为内联 <style>（函数式替换，避免 $&/$$ 被当特殊模式）
html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css">/,
  () => "<style>\n" + css + "\n</style>"
);

// 2. 去掉 manifest 引用（单文件离线用不上）
html = html.replace(/\s*<link rel="manifest"[^>]*>/, "");

// 3. 把从第一个 <script src> 到 </body> 之间的所有 <script>（外部引用 + 启动块含SW）
//    整体替换为：内联 5 个 JS + 一段干净的启动代码。
//    整体替换避免了对 SW 块做正则删除时切坏括号的问题。
const startupBlock =
  "\n  <script>\n" + js + "\n  </script>\n" +
  "  <script>\n" +
  "    window.addEventListener('DOMContentLoaded', function () {\n" +
  "      window.Game.init();\n" +
  "    });\n" +
  "  </script>\n";
const before = html;
html = html.replace(
  /\s*<script src="js\/questions\.js">[\s\S]*?<\/script>\s*<\/body>/,
  () => startupBlock + "</body>"
);
if (html === before) {
  console.error("❌ 未能匹配到脚本区块，index.html 结构可能已变");
  process.exit(1);
}

// 校验 1：不应残留任何外部引用
const leftover = html.match(/(src|href)="(css\/|js\/|sw\.js|manifest)/g);
if (leftover) {
  console.error("❌ 仍有外部引用未内联:", leftover);
  process.exit(1);
}

// 校验 2：不应残留 SW 痕迹
if (/serviceWorker|注册 Service Worker/.test(html)) {
  console.error("❌ Service Worker 块未删干净");
  process.exit(1);
}

const outName = "口算太空大冒险.html";
fs.writeFileSync(path.join(root, outName), html, "utf8");
const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
console.log("✅ 已生成单文件:", outName, "(" + kb + " KB)");
console.log("   CSS 内联:", css.length, "字符 | JS 内联:", js.length, "字符");
