import { config } from "@main/modules/config";
import { checkChatType } from "@common/checkChatType";
import { findEvent } from "@main/utils/findEvent";
import { createLogger } from "@main/utils/createLogger";
import { deleteBubbleSkin } from "./deleteBubbleSkin";
import { miniArkToWebArk } from "./miniArkToWebArk";

const log = createLogger("handleMessages");

function handleMessages(args: any[]) {
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
}

export { handleMessages };
