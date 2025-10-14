import { onComponentMount } from "@/renderer/modules/vueComponentTracker";
import { checkChatType } from "@/common/checkChatType";
import { createLogger } from "@/renderer/utils/createLogger";
import { waitForInstance } from "@/renderer/utils/domWatiFor";
import { configStore } from "@/renderer/modules/configStore";

const log = createLogger("handleMessages");

const processedInstances = new WeakSet<any>();
const slots = new WeakMap<HTMLElement, { spacer: HTMLElement; float: HTMLElement }>();

/**
 * 已知消息类型
 * 1:textElement文本消息
 * 2:picElement图片消息
 * 3:fileElement文件消息
 * 4:pttElement语音消息
 * 5:videoElement视频消息
 * 6:faceElement表情消息
 * 7:replyElement回复消息
 * 8:grayTipElement消息
 *
 * 10:arkElement模板消息
 * 11:marketFaceElement商城表情消息
 *
 * 16:multiForwardMsgElement合并转发消息
 * **/

enum ElementType {
  textElement = 1,
  picElement = 2,
  fileElement = 3,
  pttElement = 4,
  videoElement = 5,
  faceElement = 6,
  replyElement = 7,
  grayTipElement = 8,
  arkElement = 10,
  marketFaceElement = 11,
  multiForwardMsgElement = 16,
}

const embedElementType = [ElementType.textElement, ElementType.replyElement];

const ignoreElementType = [ElementType.grayTipElement];

const TIME_FORMAT_MAPPING: Record<string, "numeric" | "2-digit"> = {
  "1": "numeric",
  "2": "2-digit",
};

async function setupHandleMessages() {
  await configStore.ready;
  log("注册事件");
  onComponentMount(handleMessages);
  const { value: msgList } = await waitForInstance(
    ".container-content .container .aio .group-chat",
    "proxy.curMsgListData"
  );
  log(msgList);
  msgList.forEach((item: any) => {
    const el = document.getElementById(item.msgId)?.firstElementChild as any;
    if (el && el?.__VUE__[0]) {
      handleMessages(el.__VUE__[0]);
    }
  });
}

function enabledSlot() {
  return configStore.value.message.showSendTime.enabled || configStore.value.message.preventRecall.enabled;
}

function handleMessages(component: any) {
  if (enabledSlot() && component?.vnode?.el && component?.props?.msgRecord && !processedInstances.has(component)) {
    processedInstances.add(component);
    processMessages(component);
  }
}

function processMessages(component: any) {
  if (!checkChatType(component.props.msgRecord) || !component.vnode.el?.classList?.contains?.("message")) return;
  const messageEl = component.vnode.el as HTMLElement;
  const msgRecord = component.props.msgRecord;
  const slot = insertSlot(messageEl, msgRecord);
  if (configStore.value.message.showSendTime.enabled) {
    insertTime(slot, msgRecord);
  }
  if (configStore.value.message.preventRecall.enabled) {
    insertRecallTag(slot, msgRecord);
  }
}

function insertSlot(messageEl: HTMLElement, msgRecord: any) {
  const slot = createSlot();
  if (
    msgRecord.elements.some(
      (item: any) =>
        embedElementType.includes(item.elementType) ||
        (item.elementType === ElementType.faceElement && [1, 2].includes(item.faceElement.faceType))
    )
  ) {
    slot.classList.add("embed");
    messageEl.querySelector(".message-content:is(.mix-message__inner,.reply-message__inner)")?.appendChild(slot);
  } else {
    if (!msgRecord.elements.some((item: any) => ignoreElementType.includes(item.elementType))) {
      slot.classList.add("outside");
      if (!messageEl.querySelector(".content-status.no-copy")) {
        const div = document.createElement("div");
        div.classList.add("content-status", "no-copy", "lt-add");
        messageEl.querySelector(".message-content__wrapper")?.insertAdjacentElement("afterend", div);
      }
      messageEl.querySelector(".content-status.no-copy")?.appendChild(slot);
    }
  }
  return slot;
}

function createSlot() {
  const slot = document.createElement("div");
  slot.classList.add("lt-slot");
  const spacer = document.createElement("div");
  const float = document.createElement("div");
  spacer.classList.add("lt-spacer");
  float.classList.add("lt-float");
  slot.append(spacer, float);
  slots.set(slot, { spacer, float });
  return slot;
}

function insertTime(slot: HTMLElement, msgRecord: any) {
  const time = document.createElement("span");
  time.classList.add("lt-time");
  const sendTime = getSendTime(msgRecord.msgTime * 1000);
  time.textContent = sendTime;
  time.title = new Date(msgRecord.msgTime * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const clone = time.cloneNode(true) as HTMLElement;
  const { spacer, float } = slots.get(slot) ?? {};
  spacer?.insertAdjacentElement("beforeend", time);
  float?.insertAdjacentElement("beforeend", clone);
}

function getSendTime(sendTime: number) {
  const cfg = configStore.value.message.showSendTime;
  return new Intl.DateTimeFormat("zh-CN", {
    year: TIME_FORMAT_MAPPING[cfg.dateFormat[0]],
    month: TIME_FORMAT_MAPPING[cfg.dateFormat[1]],
    day: TIME_FORMAT_MAPPING[cfg.dateFormat[2]],
    hour: TIME_FORMAT_MAPPING[cfg.timeFormat[0]],
    minute: TIME_FORMAT_MAPPING[cfg.timeFormat[1]],
    second: TIME_FORMAT_MAPPING[cfg.timeFormat[2]],
    timeZoneName: cfg.showTimeZone ? "shortOffset" : undefined,
  }).format(new Date(sendTime));
}

function insertRecallTag(slot: HTMLElement, msgRecord: any) {
  const span = document.createElement("span");
  span.classList.add("lt-recall");
  span.textContent = "已撤回";
  span.title = `[时间] 被 [操作人] 撤回`;
  const clone = span.cloneNode(true) as HTMLElement;
  const { spacer, float } = slots.get(slot) ?? {};
  spacer?.insertAdjacentElement("afterbegin", span);
  float?.insertAdjacentElement("afterbegin", clone);
}

export { setupHandleMessages };

// aio元素实例
// group-chat 107

// 图片查看器 属性可用于判断是否出现滚动条
// main-area main-area--image vue-component
// uid 39
// [3].proxy.isDirectionXValid
// [3].proxy.isDirectionYValid
