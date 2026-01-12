import { formatChineseDate } from "@/renderer/modules/handleMessages/formatChineseDate";

import type { SlotElement } from "./type";

function insertRecallTag(slot: SlotElement, msgRecord: any) {
  if (msgRecord.lt_recall) {
    if (slot.querySelector(".lt-recall")) return;
    const span = document.createElement("span");
    span.classList.add("lt-recall");
    span.textContent = "已撤回";
    span.title = `${formatChineseDate(new Date(msgRecord.msgTime * 1000))} 被 ${
      msgRecord.lt_recall.operatorRemark || msgRecord.lt_recall.operatorMemRemark || msgRecord.lt_recall.operatorNick
    } 撤回`;
    const clone = span.cloneNode(true) as HTMLElement;
    const spacer = slot.children[0] as HTMLElement;
    const float = slot.children[1] as HTMLElement;
    spacer?.insertAdjacentElement("afterbegin", span);
    float?.insertAdjacentElement("afterbegin", clone);
  }
}

function initRecallMessageListener(processMessages: any) {
  lite_tools.onRecallMessagesFound((recallDatas) => {
    for (const recallData of recallDatas) {
      const recallMsg = document.getElementById(recallData.id.toString())?.firstElementChild;
      if (recallMsg && recallMsg?.__VUE__?.[0]) {
        processMessages(recallMsg.__VUE__[0]);
      }
    }
  });
}

export { initRecallMessageListener, insertRecallTag };
