import { config } from "@/main/modules/config";
import { checkChatType } from "@/common/checkChatType";
import { findEvent } from "@/main/utils/findEvent";
import { createLogger } from "@/main/utils/createLogger";
import { deleteBubbleSkin } from "@/main/modules/deleteBubbleSkin";
import { miniArkToWebArk } from "@/main/modules/miniArkToWebArk";
import { marketFaceToPicElement } from "@/main/modules/marketFaceToPicElement";

const log = createLogger("handleMessages");

function handleMessages(...args: any[]) {
  try {
    const channel = args[0] as string;
    const webContentId = parseInt(channel.split("RM_IPCFROM_MAIN")[1]) || 2;
    const msgList = args[2]?.msgList;
    if (msgList && msgList.length && checkChatType(msgList[0])) {
      processMessages(msgList, webContentId, args);
    }
    const onRecvMsg = findEvent(args, [
      "nodeIKernelMsgListener/onRecvMsg",
      "nodeIKernelMsgListener/onRecvActiveMsg",
      "nodeIKernelMsgListener/onMsgInfoListUpdate",
      "nodeIKernelMsgListener/onActiveMsgInfoUpdate",
    ]);
    if (onRecvMsg && checkChatType(args?.[2]?.payload?.msgList?.[0])) {
      processMessages(args[2].payload.msgList, webContentId, args);
    }
    const onForwardMsg = findEvent(args, "nodeIKernelMsgListener/onAddSendMsg");
    if (onForwardMsg && checkChatType(args?.[2]?.payload?.msgRecord)) {
      processMessages([args[2].payload.msgRecord], webContentId, args);
    }
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
  }
}

function processMessages(msgList: any[], webContentId: number, args: any[]) {
  log("捕获到消息", msgList);
  if (config.interface.deleteBubbleSkin) {
    log("执行 删除气泡皮肤 ");
    deleteBubbleSkin(msgList);
  }
  if (config.message.miniArkToWebArk) {
    log("执行 替换小程序卡片 ");
    miniArkToWebArk(msgList);
  }
  if (config.message.marketFaceToPicElement) {
    log("执行 转换表情类型 ");
    marketFaceToPicElement(msgList, webContentId);
  }
  log("处理结束", msgList);
}

function setupHandleMessages() {
  IpcInterceptor.interceptIpcSend(handleMessages);
  log("注册事件");
}

export { setupHandleMessages };
