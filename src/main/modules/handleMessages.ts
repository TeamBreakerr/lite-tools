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
    const msgList = args[2]?.msgList;
    if (msgList && msgList.length && checkChatType(msgList[0])) {
      processMessages(msgList);
    }
    const onRecvMsg = findEvent(args, [
      "nodeIKernelMsgListener/onRecvMsg",
      "nodeIKernelMsgListener/onRecvActiveMsg",
      "nodeIKernelMsgListener/onMsgInfoListUpdate",
      "nodeIKernelMsgListener/onActiveMsgInfoUpdate",
    ]);
    if (onRecvMsg && checkChatType(args?.[2]?.payload?.msgList?.[0])) {
      processMessages(args[2].payload.msgList);
    }
    const onForwardMsg = findEvent(args, "nodeIKernelMsgListener/onAddSendMsg");
    if (onForwardMsg && checkChatType(args?.[2]?.payload?.msgRecord)) {
      processMessages([args[2].payload.msgRecord]);
    }
  } catch (err) {
    log("出现错误", err);
  }
}

function processMessages(msgList: any[]) {
  log("捕获到消息", msgList);
  if (config.message.deleteBubbleSkin) {
    log("执行 删除气泡皮肤 ");
    deleteBubbleSkin(msgList);
  }
  if (config.message.miniArkToWebArk) {
    log("执行 替换小程序卡片 ");
    miniArkToWebArk(msgList);
  }
  if (config.message.marketFaceToPicElement) {
    log("执行 转换表情类型 ");
    marketFaceToPicElement(msgList);
  }
  log("处理结束", msgList);
}

function setupHandleMessages() {
  IpcInterceptor.onIpcSend(handleMessages);
  log("注册事件");
}

export { setupHandleMessages };
