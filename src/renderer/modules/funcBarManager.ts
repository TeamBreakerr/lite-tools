import { waitForInstance, waitForElement } from "@/renderer/utils/domWatiFor";
import { configStore } from "@/renderer/modules/config";
import { observeMutations } from "@/renderer/utils/observeMutations";
import { createLogger } from "@/renderer/utils/createLogger";
import type { FuncBar } from "@/types/Config";

const log = createLogger("funcBarManager");
const topFuncMap = new Map() as Map<string, FuncBar>;
const chatFuncMap = new Map() as Map<string, FuncBar>;

async function updateTopFuncBar() {
  await configStore.ready;

  if (configStore.config.topFuncBar.length > 1) {
    hiddenFuncBtn(await waitForElement(".panel-header__action .func-bar"), configStore.config.topFuncBar, true);
  }

  const { element, instance } = await waitForInstance(
    `.panel-header__action .func-bar:has([aria-label="更多"])`,
    "props.items"
  );
  await instance.proxy.$nextTick();
  const value = instance.props.items;
  value.forEach((item: any) => {
    const id = element.querySelector(`.bar-icon [aria-label="${item.label}"] svg use`)?.getAttribute("xlink:href");
    const key = `${item.label}_${id}`;
    if (id) {
      topFuncMap.set(key, {
        name: item.label,
        id,
      });
    }
  });
  if (
    topFuncMap.size >= configStore.config.topFuncBar.length &&
    !isFuncCountEqual(topFuncMap, configStore.config.topFuncBar)
  ) {
    configStore.config.topFuncBar = Array.from(topFuncMap.values()).map((item) => {
      return {
        ...item,
        enabled: true,
      };
    });
    log("更新顶部栏目", configStore.config.chatFuncBar);
    configStore.setConfig(configStore.config);
  }
  hiddenFuncBtn(element, configStore.config.topFuncBar);
}

async function updateChatFuncBar() {
  await configStore.ready;

  if (configStore.config.chatFuncBar.length > 1) {
    hiddenFuncBtn(
      await waitForElement(".chat-input-area .chat-func-bar.shortcuts"),
      configStore.config.chatFuncBar,
      true
    );
  }
  async function initChatFuncBar() {
    const { element, instance, value } = await waitForInstance(
      ".chat-input-area .chat-func-bar.shortcuts",
      "proxy.list"
    );

    await instance.proxy.$nextTick();

    value.forEach((item: any) => {
      const id = element.querySelector(`.bar-icon [aria-label="${item.label}"] svg use`)?.getAttribute("xlink:href");
      const key = `${item.label}_${id}`;
      if (id) {
        chatFuncMap.set(key, {
          name: item.label,
          id,
        });
      }
    });

    if (
      chatFuncMap.size >= configStore.config.chatFuncBar.length &&
      !isFuncCountEqual(chatFuncMap, configStore.config.chatFuncBar)
    ) {
      log("update chat func bar", chatFuncMap);
      configStore.config.chatFuncBar = Array.from(chatFuncMap.values()).map((item) => {
        return {
          ...item,
          enabled: true,
        };
      });
      log("更新聊天栏目", configStore.config.chatFuncBar);
      configStore.setConfig(configStore.config);
    }
    return element;
  }
  const element = await initChatFuncBar();

  observeMutations(
    element.querySelector(".func-bar:first-child")!,
    () => {
      initChatFuncBar();
      hiddenFuncBtn(element, configStore.config.chatFuncBar);
    },
    {
      childList: true,
      autoDisconnect: 3000,
    }
  );
  hiddenFuncBtn(element, configStore.config.chatFuncBar);
}

function hiddenFuncBtn(element: HTMLElement, funcBar: FuncBar[], preparatory = false) {
  funcBar.forEach((item) => {
    const findEl = Array.from(element.querySelectorAll(`.bar-icon use`))
      .find((element) => {
        return element.getAttribute("xlink:href") === item.id;
      })
      ?.closest<HTMLElement>(`.bar-icon${!preparatory ? `:has([aria-label^="${item.name.slice(0, 2)}"])` : ``}`);
    if (findEl) {
      findEl.style.display = item.enabled ? "flex" : "none";
    }
  });
}

function isFuncCountEqual(a: Map<string, FuncBar>, b: FuncBar[]) {
  const mapB = new Map(b.map((item) => [`${item.name}_${item.id}`, item]));
  if (a.size !== mapB.size) return false;
  return [...mapB.keys()].every((id) => a.has(id));
}

export { updateTopFuncBar, updateChatFuncBar };