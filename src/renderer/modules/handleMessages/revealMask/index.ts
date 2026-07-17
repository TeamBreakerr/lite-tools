import "./components/revealMask";
import { importBlobAsset } from "@/renderer/utils/importAsset";
import { resource } from "./resource";
import { configStore } from "@/renderer/modules/configStore";

import type { MessageElement } from "../type";

async function setupRevealMask() {
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

  const turbulence = await importBlobAsset("../resources", "turbulence.png");
  resource.url = URL.createObjectURL(turbulence);
  console.log(resource);
}

function revealMask(component: any, isNewVersion: boolean) {
  if (isNewVersion) {
    // 处理新版本逻辑
  } else {
    const messageEl = component.vnode.el as MessageElement;
    const msgRecord = component.props.msgRecord;
    const buddyMapInfo = component.props.buddyMapInfo;
    const maskConfig = configStore.value.message.revealMask;
    const list = maskConfig.users.split(",");

    const isMainUserMatch =
      maskConfig.allUsers || list.includes(msgRecord.senderUin) || list.includes(msgRecord.peerUin);

    msgRecord.elements.forEach((element: any) => {
      if (isMainUserMatch) {
        if (element.picElement && (element.picElement.picSubType === 0 || maskConfig.includeSticker)) {
          const elementId = element.elementId as string;
          const mask = document.createElement("reveal-mask");
          const targetEl = messageEl.querySelector<HTMLElement>(`[element-id="${elementId}"]`);
          if (targetEl) {
            mask.setupTarget(targetEl);
            targetEl.insertAdjacentElement("afterbegin", mask);
          }
        }
      }

      if (element.replyElement && element.replyElement.sourceMsgIsIncPic) {
        const replyUin = buddyMapInfo[element.replyElement.senderUidStr];
        if (maskConfig.allUsers || list.includes(replyUin)) {
          const mask = document.createElement("reveal-mask");
          const targetEl = messageEl.querySelector<HTMLElement>(".reply-content");
          console.log("replyElement2", messageEl.outerHTML);
          if (targetEl) {
            mask.setupTarget(targetEl);
            targetEl.insertAdjacentElement("afterbegin", mask);
          }
        }
      }
    });
  }
}

export { setupRevealMask, revealMask };
