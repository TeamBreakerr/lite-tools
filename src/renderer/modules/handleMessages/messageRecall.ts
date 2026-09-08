import { formatChineseDate } from "@/renderer/modules/handleMessages/formatChineseDate";

import type { SlotElement } from "./type";

const recalledMessageIds = new Set<string>();

function isRecalledMessage(msgRecord: any) {
  return !!msgRecord.lt_recall || recalledMessageIds.has(String(msgRecord.msgId));
}

function findMessageComponent(root: HTMLElement, msgId?: string) {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>(".message"))];
  for (const element of elements) {
    for (const component of element.__VUE__ || []) {
      if (
        component?.props?.msgRecord &&
        component?.vnode?.el?.classList?.contains("message") &&
        (msgId === undefined || String(component.props.msgRecord.msgId) === String(msgId))
      ) return component;
    }
  }
}

function insertRecallTag(slot: SlotElement, msgRecord: any) {
  if (isRecalledMessage(msgRecord)) {
    if (slot.querySelector(".lt-recall")) return;
    const span = document.createElement("span");
    span.classList.add("lt-recall");
    span.textContent = "已撤回";
    const recall = msgRecord.lt_recall;
    const operator = recall?.operatorRemark || recall?.operatorMemRemark || recall?.operatorNick;
    span.title = operator
      ? `${formatChineseDate(new Date((recall.recallTime || msgRecord.msgTime) * 1000))} 被 ${operator} 撤回`
      : "该消息已撤回";
    const clone = span.cloneNode(true) as HTMLElement;
    const spacer = slot.children[0] as HTMLElement;
    const float = slot.children[1] as HTMLElement;
    spacer?.insertAdjacentElement("afterbegin", span);
    float?.insertAdjacentElement("afterbegin", clone);
  }
}

function initRecallMessageListener(processMessages: any) {
  lite_tools.onRecallMessagesFound((recallMsgIds) => {
    for (const recallMsgId of recallMsgIds) {
      recalledMessageIds.add(String(recallMsgId));
      if (recalledMessageIds.size > 10000) recalledMessageIds.delete(recalledMessageIds.values().next().value!);
    }
    // QQ may apply its message update after the IPC notification arrives.
    requestAnimationFrame(() => {
      for (const recallMsgId of recallMsgIds) {
        const root = document.getElementById(recallMsgId);
        const component = root && findMessageComponent(root, recallMsgId);
        if (component) processMessages(component);
      }
    });
  });
}

export { initRecallMessageListener, insertRecallTag, findMessageComponent, isRecalledMessage };
