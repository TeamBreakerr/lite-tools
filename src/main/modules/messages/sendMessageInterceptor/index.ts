import { configManager } from "@/main/modules/configManager";
import { checkChatType } from "@/common/checkChatType";
import { createLogger } from "@/main/utils/createLogger";

import { convertVideoFileToVideoMsg } from "./convertVideoFileToVideoMsg";
import { largPicFileToPicMsg } from "./largPicFileToPicMsg";

const log = createLogger("outgoingMessageInterceptor");

function handleSendMessages(...args: any[]) {
  try {
    const msgPayload = args?.[3]?.[1]?.[0];
    if (!msgPayload) return;
    log(msgPayload);
    // const originMsgPayload = structuredClone(msgPayload);
    if (checkChatType(msgPayload.peer)) {
      processMessages(msgPayload);
    }
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
  }
}

function processMessages(msgPayload: any) {
  try {
    const config = configManager.value;
    if (config.message.videoFileToVideoMsg) {
      convertVideoFileToVideoMsg(msgPayload);
    }
    if (config.message.largPicFileToPicMsg) {
      largPicFileToPicMsg(msgPayload);
    }
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
  }
}

function setupSendMessageInterceptor() {
  IpcInterceptor.interceptIpcReceiveEvents("nodeIKernelMsgService/sendMsg", handleSendMessages);
}

export { setupSendMessageInterceptor };
