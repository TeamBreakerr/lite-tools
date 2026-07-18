import "./components/revealMask";
import { importBlobAsset } from "@/renderer/utils/importAsset";
import { configStore } from "@/renderer/modules/configStore";
import { createLogger } from "@/renderer/utils/createLogger";

import { resource } from "./resource";
import { chatObserverManager } from "../chatObserverManager";

const log = createLogger("revealMask");
const awaitInsertReplyMask = new Map<string, { messageEl: HTMLElement; msgRecord: any }>();
const awaitInsertMask = new Map<string, { messageEl: HTMLElement; msgRecord: any }>();

function setupRevealMask() {
  if (window.CSS && CSS.registerProperty) {
    CSS.registerProperty({
      name: "--reveal-center",
      syntax: "<color>",
      inherits: false,
      initialValue: "rgba(0, 0, 0, 1)",
    });
    CSS.registerProperty({
      name: "--reveal-edge",
      syntax: "<color>",
      inherits: false,
      initialValue: "rgba(0, 0, 0, 1)",
    });
    CSS.registerProperty({
      name: "--reveal-diffusion",
      syntax: "<length>",
      inherits: false,
      initialValue: "0px",
    });
    CSS.registerProperty({
      name: "--reveal-offset",
      syntax: "<length>",
      inherits: false,
      initialValue: "0px",
    });
  }

  importBlobAsset("../resources", "turbulence.png").then((turbulence) => {
    resource.url = URL.createObjectURL(turbulence);
  });

  // 处理异步插入引用插槽
  chatObserverManager.addTask({
    name: "InsertReplyMask",
    selector: `.pic .image,[role="img"]`,
    handler: (elements) => {
      elements.forEach((mlItem) => {
        const inserted = awaitInsertReplyMask.get(mlItem.id);
        if (inserted) {
          const targetEl = inserted.messageEl.querySelector<HTMLElement>(`.reply-content .pic .image,[role="img"]`);
          if (targetEl) {
            if (targetEl.querySelector(".q-icon-animate-content")) return;
            const mask = document.createElement("reveal-mask");
            mask.setupTarget(targetEl);
            targetEl.insertAdjacentElement("afterbegin", mask);
            awaitInsertReplyMask.delete(inserted.msgRecord.msgId);
          }
        }
      });
    },
  });
  // 处理高版本需要异步插入整个功能
  chatObserverManager.addTask({
    name: "InsertRevealMask",
    selector: ".pic-element",
    handler: (elements) => {
      elements.forEach((mlItem) => {
        const inserted = awaitInsertMask.get(mlItem.id);
        if (inserted) {
          const targetEls = inserted.messageEl.querySelectorAll<HTMLElement>(".pic-element");
          if (targetEls.length) {
            targetEls.forEach((targetEl) => {
              const mask = document.createElement("reveal-mask");
              mask.setupTarget(targetEl);
              targetEl.insertAdjacentElement("afterbegin", mask);
              awaitInsertMask.delete(inserted.msgRecord.msgId);
            });
          }
        }
      });
    },
  });
}

function revealMask(component: any, isNewVersion: boolean) {
  const messageEl = component.vnode.el as HTMLElement;
  const msgRecord = component.props.msgRecord;
  const buddyMapInfo = component.props.buddyMapInfo;
  const maskConfig = configStore.value.message.revealMask;
  const list = maskConfig.users.split(",");

  const isMainUserMatch = maskConfig.allUsers || list.includes(msgRecord.senderUin) || list.includes(msgRecord.peerUin);

  msgRecord.elements.forEach((element: any) => {
    if (isMainUserMatch) {
      if (element.picElement && (element.picElement.picSubType === 0 || maskConfig.includeSticker)) {
        const elementId = element.elementId as string;
        const mask = document.createElement("reveal-mask");
        const targetEl = messageEl.querySelector<HTMLElement>(`[element-id="${elementId}"]`);
        if (targetEl) {
          mask.setupTarget(targetEl);
          targetEl.insertAdjacentElement("afterbegin", mask);
        } else {
          awaitInsertMask.set(msgRecord.msgId, { messageEl, msgRecord });
        }
      }
    }
    if (element.replyElement) {
      const replyUin = buddyMapInfo[element.replyElement.senderUidStr];
      if (maskConfig.allUsers || list.includes(replyUin)) {
        const messageEl = component.vnode.el as HTMLElement;
        const msgRecord = component.props.msgRecord;
        awaitInsertReplyMask.set(msgRecord.msgId, { messageEl, msgRecord });
      }
    }
  });
}

export { setupRevealMask, revealMask };
