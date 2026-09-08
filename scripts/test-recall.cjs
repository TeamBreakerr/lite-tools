// Run with: node_modules/.bin/electron scripts/test-recall.cjs
// Uses an isolated, hidden Electron window; never connects to QQ.
const { app, BrowserWindow } = require("electron");
const { buildSync } = require("esbuild");
const sass = require("sass");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lite-tools-recall-test-"));
app.setPath("userData", profile);
app.disableHardwareAcceleration();

async function run() {
  const source = "src/renderer/modules/handleMessages/messageRecall.ts";
  const baseline = process.argv.includes("--baseline");
  const result = buildSync({
    absWorkingDir: root,
    ...(baseline
      ? { stdin: { contents: execFileSync("git", ["show", `v4.0.4-teambreaker.1:${source}`], { cwd: root, encoding: "utf8" }), resolveDir: root, loader: "ts" } }
      : { entryPoints: [source] }),
    bundle: true,
    write: false,
    format: "iife",
    globalName: "Recall",
    tsconfig: path.join(root, "src/renderer/tsconfig.json"),
  });
  const css = sass.compile(path.join(root, "src/renderer/scss/global.scss")).css;
  const win = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
  await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent('<body class="lt-custom-recall-color" style="--lt-recall-color-light:#ff6666;--lt-recall-color-dark:#ff6666"></body>'));
  await win.webContents.insertCSS(css);
  await win.webContents.executeJavaScript("window.lite_tools = { onRecallMessagesFound(fn) { window.notifyRecall = fn; } }; void 0;");
  await win.webContents.executeJavaScript(result.outputFiles[0].text + "\nvoid 0;");
  const report = await win.webContents.executeJavaScript(`(async () => {
    const passed = [];
    function check(ok, name) { if (!ok) throw new Error(name); passed.push(name); }
    function fixture(id, recall, wrapped = false) {
      const root = document.createElement('div');
      root.id = id;
      root.innerHTML = (wrapped ? '<div class="wrapper">' : '') +
        '<div class="message"><div class="lt-slot embed"><div class="lt-spacer"></div><div class="lt-float"></div></div></div>' +
        (wrapped ? '</div>' : '');
      document.body.append(root);
      const el = root.querySelector('.message');
      const msgRecord = { msgId: id, msgTime: '1788883886', lt_recall: recall };
      const component = { vnode: { el }, props: { msgRecord } };
      // A shared element can have more than one Vue component.
      el.__VUE__ = wrapped ? [{ props: {}, vnode: { el } }, component] : [component];
      return { root, el, msgRecord, slot: el.querySelector('.lt-slot') };
    }
    const render = (component) => Recall.insertRecallTag(component.vnode.el.querySelector('.lt-slot'), component.props.msgRecord);
    Recall.initRecallMessageListener(render);
    const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const ordinary = fixture('ordinary');
    Recall.insertRecallTag(ordinary.slot, ordinary.msgRecord);
    check(!ordinary.el.querySelector('.lt-recall'), 'ordinary message stays unmarked');
    const history = fixture('history', { operatorNick: '自己', recallTime: '1788883890' });
    Recall.insertRecallTag(history.slot, history.msgRecord);
    check(history.el.querySelector('.lt-float .lt-recall')?.textContent === '已撤回', 'persisted recall gets a visible label');
    check(getComputedStyle(history.el.querySelector('.lt-float .lt-recall')).color === 'rgb(255, 102, 102)', 'custom recall color is applied');
    Recall.insertRecallTag(history.slot, history.msgRecord);
    check(history.el.querySelectorAll('.lt-recall').length === 2, 'repeated refresh creates only one label per slot layer');
    const own = fixture('own');
    notifyRecall(['own']);
    await frame();
    check(own.el.querySelector('.lt-float .lt-recall')?.textContent === '已撤回', 'early recall notification marks a stale own-message record');
    check(getComputedStyle(own.el.querySelector('.lt-float .lt-recall')).color === 'rgb(255, 102, 102)', 'own-message recall keeps its custom color');
    const wrapped = fixture('wrapped', { operatorNick: '自己' }, true);
    notifyRecall(['wrapped']);
    await frame();
    check(!!wrapped.el.querySelector('.lt-recall'), 'nested wrappers and non-first Vue components are supported');
    notifyRecall(['later']);
    await frame();
    const later = fixture('later');
    Recall.insertRecallTag(later.slot, later.msgRecord);
    check(!!later.el.querySelector('.lt-recall'), 'a message mounted after the notification is marked');
    own.root.remove();
    const remounted = fixture('own');
    Recall.insertRecallTag(remounted.slot, remounted.msgRecord);
    check(!!remounted.el.querySelector('.lt-recall'), 'chat remount preserves the recall marker');
    return passed;
  })()`);
  report.forEach((name) => console.log(`PASS ${name}`));
  win.destroy();
}

app.whenReady().then(run).then(() => {
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
app.on("quit", () => fs.rmSync(profile, { recursive: true, force: true }));
