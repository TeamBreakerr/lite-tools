import { findEvent } from "./findEvent.js";
import { checkChatType } from "./checkChatType.js";
import { mainMessage } from "./captureWindow.js";
import { config } from "./config.js";

/**
 * 关键字提醒功能模块
 *
 * @param {Array} args - 包含事件数据的参数数组。
 * @return {void} 此函数不返回任何值。
 */
function keywordReminder(args) {
  if (config.keywordReminder.enabled) {
    const onRecvMsg = findEvent(args, [`nodeIKernelMsgListener/onRecvMsg`, `nodeIKernelMsgListener/onRecvActiveMsg`]);
    if (onRecvMsg && checkChatType(args?.[2]?.payload?.msgList?.[0])) {
      args[2].payload.msgList.forEach((msgData) => {
        msgData.elements.forEach((msgElements) => {
          if (msgElements?.textElement) {
            if (config.keywordReminder.keyList.some((key) => msgElements?.textElement?.content?.includes(key))) {
              mainMessage.webContents.send("LiteLoader.lite_tools.onKeywordReminder", msgData.peerUid, msgData.msgId);
            }
          }
        });
      });
    }
  }
}

export { keywordReminder };
