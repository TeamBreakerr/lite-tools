import { configManager } from "@/main/modules/configManager";
import { checkChatType } from "@/common/checkChatType";
import { createLogger } from "@/main/utils/createLogger";

import { convertVideoFileToVideoMsg } from "./convertVideoFileToVideoMsg";
import { largPicFileToPicMsg } from "./largPicFileToPicMsg";

const log = createLogger("outgoingMessageInterceptor");

function handleSendMessages(...args: any[]) {
  try {
    const msgPayload = args?.[3]?.[1]?.payload?.[0];
    if (!msgPayload) return;
    log(msgPayload);
    if (checkChatType(msgPayload.peer)) {
      return processMessages(msgPayload);
    }
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
  }
}

function processMessages(msgPayload: any): InterceptResult {
  try {
    const config = configManager.value;
    if (config.message.videoFileToVideoMsg) {
      const isBlock = convertVideoFileToVideoMsg(msgPayload);
      log("process convertVideoFileToVideoMsg", isBlock);
      if (isBlock) {
        return {
          action: "block",
        };
      }
    }
    if (config.message.largPicFileToPicMsg) {
      const isBlock = largPicFileToPicMsg(msgPayload);
      log("process largPicFileToPicMsg", isBlock);
      if (isBlock) {
        return {
          action: "block",
        };
      }
    }
    return {
      action: "pass",
    };
  } catch (err: any) {
    log("出现错误", err.message, err?.stack);
    return {
      action: "pass",
    };
  }
}

function setupSendMessageInterceptor() {
  IpcInterceptor.interceptIpcReceiveEvents("nodeIKernelMsgService/sendMsg", handleSendMessages);
}

export { setupSendMessageInterceptor };
