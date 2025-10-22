import { waitForInstance, waitForElement } from "@/renderer/utils/domWaitFor";
import { configStore } from "@/renderer/modules/configStore";
import { observeMutations } from "@/renderer/utils/observeMutations";
import { createLogger } from "@/renderer/utils/createLogger";
import type { FuncBar } from "@/types/config";

const log = createLogger("funcBarManager");
const topFuncMap = new Map() as Map<string, FuncBar>;
const chatFuncMap = new Map() as Map<string, FuncBar>;

let closeObserver: ReturnType<typeof observeMutations> | null = null;

async function updateTopFuncBar() {
  await configStore.ready;

  if (configStore.value.topFuncBar.length > 1) {
    hiddenFuncBtn(await waitForElement(".panel-header__action .func-bar"), configStore.value.topFuncBar, true);
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
    topFuncMap.size >= configStore.value.topFuncBar.length &&
    !isFuncCountEqual(topFuncMap, configStore.value.topFuncBar)
  ) {
    configStore.value.topFuncBar = Array.from(topFuncMap.values()).map((item) => {
      return {
        ...item,
        enabled: configStore.value.topFuncBar.find((i) => i.name === item.name)?.enabled ?? true,
      };
    });
    log("更新顶部栏目", configStore.value.chatFuncBar);
    configStore.setConfig(configStore.value);
  }
  hiddenFuncBtn(element, configStore.value.topFuncBar);
}

async function updateChatFuncBar() {
  await configStore.ready;

  if (configStore.value.chatFuncBar.length > 1) {
    hiddenFuncBtn(
      await waitForElement(".chat-input-area .chat-func-bar.shortcuts"),
      configStore.value.chatFuncBar,
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
      chatFuncMap.size >= configStore.value.chatFuncBar.length &&
      !isFuncCountEqual(chatFuncMap, configStore.value.chatFuncBar)
    ) {
      configStore.value.chatFuncBar = Array.from(chatFuncMap.values()).map((item) => {
        return {
          ...item,
          enabled: configStore.value.chatFuncBar.find((i) => i.name === item.name)?.enabled ?? true,
        };
      });
      log("更新聊天栏目", configStore.value.chatFuncBar);
      configStore.setConfig(configStore.value);
    }
    return element;
  }
  const element = await initChatFuncBar();

  closeObserver?.();

  closeObserver = observeMutations(
    element.querySelector(".func-bar:first-child")!,
    () => {
      initChatFuncBar();
      hiddenFuncBtn(element, configStore.value.chatFuncBar);
    },
    {
      childList: true,
    }
  );
  hiddenFuncBtn(element, configStore.value.chatFuncBar);
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
