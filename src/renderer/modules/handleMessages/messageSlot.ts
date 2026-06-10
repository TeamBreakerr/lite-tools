import { waitForInstance, waitForElement } from "@/renderer/utils/domWaitFor";
import { createLogger } from "@/renderer/utils/createLogger";
import { ElementType } from "./ElementTypeEnum";

import type { MessageElement, SlotElement } from "./type";

const embedElementType = [ElementType.textElement, ElementType.replyElement];
const ignoreElementType = [ElementType.grayTipElement];

const log = createLogger("messageSlot",true);
function insertSlot(messageEl: MessageElement, msgRecord: any) {
  if (messageEl.lt_slot && messageEl.lt_slot.isConnected) {
    return messageEl.lt_slot;
  }
  const slot = createSlot();
  if (
    msgRecord.elements.length > 1 ||
    msgRecord.elements.some(
      (element: any) =>
        embedElementType.includes(element.elementType) ||
        (element.elementType === ElementType.faceElement && [1, 2].includes(element.faceElement.faceType)),
    )
  ) {
    messageEl.lt_slot = slot;
    slot.classList.add("embed");
    messageEl.querySelector(".message-content:is(.mix-message__inner,.reply-message__inner)")?.appendChild(slot);
    return slot.isConnected ? slot : false;
  } else if (
    msgRecord.elements.length === 1 &&
    msgRecord.elements[0].elementType === ElementType.picElement &&
    [0, 1].includes(msgRecord.elements[0].picElement.picSubType)
  ) {
    messageEl.lt_slot = slot;
    const isFace =
      msgRecord.elements[0].picElement.picSubType === 1 || msgRecord.elements[0].picElement.picType === 2000;
    slot.classList.add("embed-image");
    messageEl.querySelector(".message-content.mix-message__inner .pic-element")?.appendChild(slot);
    slot.updatePosition = async () => {
      log("开始计算尺寸");

      const img = (await waitForElement(
        `[id="${msgRecord.msgId}"] .message-content.mix-message__inner .pic-element img`,
      )) as HTMLImageElement;
      log("img", img);
      let size = { width: 0, height: 0 };
      if (img?.width > 0) {
        log("img", img?.width);
        size = { width: img.width, height: img.height };
      } else {
        log("图片未加载");
      }

      slot.classList.add("f-show");
      const { width, height } = size;
      const maxSize = Math.max(width, height, 150);
      const faceScale = 150 / maxSize;
      const faceWidth = width * faceScale;
      const finalWidth = isFace ? Math.min(150, faceWidth) : width;
      if (finalWidth <= slot.offsetWidth + 30) {
        slot.classList.remove("embed-image");
        slot.classList.add("outside");
        if (!messageEl.querySelector(".content-status.no-copy")) {
          const div = document.createElement("div");
          div.classList.add("content-status", "no-copy", "lt-add");
          messageEl.querySelector(".message-content__wrapper")?.insertAdjacentElement("afterend", div);
        }
        messageEl.querySelector(".content-status.no-copy")?.appendChild(slot);
      }
      log("完成图片尺寸计算");
      slot.classList.remove("f-show");
    };
    return slot.isConnected ? slot : false;
  } else if (!msgRecord.elements.some((item: any) => ignoreElementType.includes(item.elementType))) {
    messageEl.lt_slot = slot;
    slot.classList.add("outside");
    if (!messageEl.querySelector(".content-status.no-copy")) {
      const div = document.createElement("div");
      div.classList.add("content-status", "no-copy", "lt-add");
      messageEl.querySelector(".message-content__wrapper")?.insertAdjacentElement("afterend", div);
    }
    messageEl.querySelector(".content-status.no-copy")?.appendChild(slot);
    return slot.isConnected ? slot : false;
  }
  log("not-insert-slot", slot.isConnected, msgRecord);
  return null;
}

function createSlot() {
  const slot = document.createElement("div");
  slot.classList.add("lt-slot");
  const spacer = document.createElement("div");
  const float = document.createElement("div");
  spacer.classList.add("lt-spacer");
  float.classList.add("lt-float");
  slot.append(spacer, float);
  return slot as SlotElement;
}

export { createSlot, insertSlot };
