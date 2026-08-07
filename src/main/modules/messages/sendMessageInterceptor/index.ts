import { configManager } from "@/main/modules/configManager";
import { checkChatType } from "@/common/checkChatType";
import { createLogger } from "@/main/utils/createLogger";

const log = createLogger("outgoingMessageInterceptor");

function handleSendMessages(...args: any[]) {
  try {
    log(args[3]);
    const msgPayload = args?.[3]?.[1];
    if (!msgPayload) return;
    const originMsgPayload = structuredClone(msgPayload);
    if (checkChatType(originMsgPayload.payload[0].peer)) {
      processMessages(originMsgPayload, msgPayload);
    }
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
  }
}

function processMessages(originMsgPayload: any, msgPayload: any) {
  try {
    const config = configManager.value;
    if (config.message.videoFileToVideoMsg) {
    }
    if (config.message.largPicFileToPicMsg) {
    }
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
  }
}

function setupSendMessageInterceptor() {
  IpcInterceptor.interceptIpcReceiveEvents("nodeIKernelMsgService/sendMsg", handleSendMessages);
}

export { setupSendMessageInterceptor };
