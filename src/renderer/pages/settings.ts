import packageJson from "package.json";
import { isQwQ } from "@renderer/utils/loaderInspector";

function settings(rootElement: HTMLDivElement) {
  // 区分两个加载器的逻辑
  rootElement.insertAdjacentHTML("afterbegin", `<h2>${isQwQ ? "QWQNT" : "LiteLoaderQQNT"} Lite Tools</h2>`);
  initSettings(rootElement);
}

function initSettings(view: HTMLDivElement) {
  const test: HTMLDivElement = document.createElement("div");
  test.innerHTML = `<p>当前插件名称：${packageJson.name}</p>
  <p>当前插件版本：${packageJson.version}</p>`;
  view.insertAdjacentElement("beforeend", test);
}

export default settings;
