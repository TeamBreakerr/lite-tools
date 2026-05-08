import type { RecallChatList } from "@/common/types/preventRecall";
import type { RecallChatInfo, RecallChatItemData } from "./types";

const CHAT_TYPE_LABEL: Record<number, string> = {
  1: "私",
  2: "群",
  100: "临",
};

function normalizeChatList(
  chatList: RecallChatList | [string, RecallChatInfo][] | Record<string, RecallChatInfo>,
): RecallChatItemData[] {
  if (chatList instanceof Map) {
    return Array.from(chatList, ([peerUid, info]) => ({
      peerUid,
      ...info,
    }));
  }

  if (Array.isArray(chatList)) {
    return chatList.map(([peerUid, info]) => ({
      peerUid,
      ...info,
    }));
  }

  return Object.entries(chatList).map(([peerUid, info]) => ({
    peerUid,
    ...info,
  }));
}

function decodeRecallMessages(data: ArrayBuffer | ArrayBufferView): Message[] {
  const bytes = ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);
  const jsonString = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(jsonString) as Message[];
}

function formatChineseDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  };

  const formatter = new Intl.DateTimeFormat("zh-CN", options);
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, { type, value }) => {
    acc[type] = value;
    return acc;
  }, {});

  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}:${parts.second}`;
}

function getTextContent(elements: MsgElement[] = []) {
  return elements.reduce((textContent, element) => {
    return textContent + (element.textElement?.content ?? "");
  }, "");
}

function getPicList(elements: MsgElement[] = []) {
  return elements
    .map((element) => element.picElement?.sourcePath)
    .filter((sourcePath): sourcePath is string => Boolean(sourcePath));
}

function getRecallSenderName(message: Message) {
  return (
    message.lt_recall?.origMsgSenderRemark ||
    message.lt_recall?.origMsgSenderMemRemark ||
    message.lt_recall?.origMsgSenderNick ||
    "unknown"
  );
}

function getRecallTail(message: Message) {
  if (!message.lt_recall?.recallTime) {
    return "没有撤回信息";
  }

  const operator =
    message.lt_recall.operatorRemark ||
    message.lt_recall.operatorMemRemark ||
    message.lt_recall.operatorNick ||
    "unknown";

  return `${formatChineseDate(new Date(parseInt(message.msgTime) * 1000))} 被 ${operator} 撤回`;
}

function jumpToRecallMessage(message: Message) {
  lt_showRecallList.sendBroadcast("MainWindow", {
    promiseId: crypto.randomUUID(),
    sender: "MsgRecordWindow",
    type: "req",
    postMessageType: "invoke",
    eventName: "invoke",
    params: {
      moduleName: "mainPage",
      cmdName: "jumpNewAio",
      args: [
        {
          peerUid: message.peerUid,
          chatType: message.chatType,
          type: 1,
          params: {
            msgId: message.msgId,
          },
        },
      ],
    },
  });
}

export {
  CHAT_TYPE_LABEL,
  decodeRecallMessages,
  formatChineseDate,
  getPicList,
  getRecallSenderName,
  getRecallTail,
  getTextContent,
  jumpToRecallMessage,
  normalizeChatList,
};
