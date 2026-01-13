import "@/renderer/entries/showRecallList/index.scss";
import type { Lt_showRecallList } from "@/renderer/entries/showRecallList/preload";
import recallGroupItem from "@/assets/html/recall/recallGroupItem.html";
import recallMsgItem from "@/assets/html/recall/recallMsgItem.html";
import recallImgItem from "@/assets/html/recall/recallImgItem.html";
import recallTail from "@/assets/html/recall/recallTail.html";

declare const lt_showRecallList: Lt_showRecallList;

const parser = new DOMParser();
const chatType: Record<number, string> = {
  1: "私",
  2: "群",
  100: "临",
};

async function main() {
  const chatList = await lt_showRecallList.getAllRecallChatList();
  const filterListEl = document.querySelector(".qq-number-filter")!;
  document.querySelector(".loading-tips")?.remove();
  if (chatList.size) {
    for (const [peerUid, info] of chatList) {
      const recallGroupItemEl = parser
        .parseFromString(recallGroupItem, "text/html")
        .querySelector<HTMLElement>(".filter-item")!;
      recallGroupItemEl.querySelector<HTMLElement>(".chat-type")!.innerText = chatType[info.chatType];
      recallGroupItemEl.querySelector<HTMLElement>(".peer-name")!.innerText = info.peerName;
      recallGroupItemEl.querySelector<HTMLElement>(".peer-uid")!.innerText = info.peerUin;
      filterListEl.appendChild(recallGroupItemEl);
      recallGroupItemEl.addEventListener("click", () => {
        document.querySelector(".filter-item.active")?.classList?.remove("active");
        recallGroupItemEl.classList.add("active");
        getRecallMessagesByUid(peerUid);
      });
    }
  } else {
    const tipsEl = parser.parseFromString(recallGroupItem, "text/html").querySelector(".filter-item")!;
    tipsEl.querySelector<HTMLElement>(".chat-type")!.innerText = `空`;
    tipsEl.querySelector<HTMLElement>(".peer-name")!.innerText = `没有撤回数据`;
    filterListEl.appendChild(tipsEl);
  }
}

async function getRecallMessagesByUid(peerUid: string) {
  const messages = await lt_showRecallList.getRecallMessagesByUid(peerUid);
  console.log(messages);
  const msgListEl = document.querySelector<HTMLElement>(".msg-list")!;
  msgListEl.innerHTML = "";
  msgListEl.scrollTop = 0;
  for (const message of messages) {
    const recallMsgItemEl = parser.parseFromString(recallMsgItem, "text/html").querySelector<HTMLElement>(".msg-item")!;
    const recallTailEl = parser.parseFromString(recallTail, "text/html").querySelector<HTMLElement>(".tail")!;
    recallTailEl.innerText = message?.lt_recall?.recallTime
      ? `${formatChineseDate(new Date(parseInt(message.msgTime) * 1000))} 被 ${
          message?.lt_recall?.operatorRemark ||
          message?.lt_recall?.operatorMemRemark ||
          message?.lt_recall?.operatorNick ||
          "unknown"
        } 撤回`
      : "没有撤回信息";
    recallTailEl.setAttribute("time", recallTailEl.innerText);
    const textContent = getTextContent(message.elements);
    recallMsgItemEl.querySelector<HTMLElement>(".user-name")!.innerText =
      message?.lt_recall?.origMsgSenderRemark || // 用户备注
      message?.lt_recall?.origMsgSenderMemRemark || // 群备注
      message?.lt_recall?.origMsgSenderNick ||
      "unknown"; // 账号昵称
    recallMsgItemEl.querySelector<HTMLElement>(".msg-text")!.innerText = textContent;
    const picList = getPicList(message.elements);
    if (picList.length) {
      const imgListEl = recallMsgItemEl.querySelector(".msg-img-list")!;
      for (const pic of picList) {
        const picEl = parser.parseFromString(recallImgItem, "text/html").querySelector(".msg-img-item")!;
        const imgEl = picEl.querySelector("img")!;
        imgEl.src = `appimg://${pic}`;
        imgEl.setAttribute("alt", "加载失败");
        imgListEl.appendChild(picEl);
      }
    }
    if (!textContent.length && !picList.length) {
      recallMsgItemEl.querySelector(".msg-text")!.innerHTML = `<blue>[不支持的消息类型]</blue>`;
    }
    recallMsgItemEl.querySelector(".msg-text")!.appendChild(recallTailEl);
    recallMsgItemEl.querySelector(".msg-content")!.addEventListener("click", () => {
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
    });
    const prevEl = msgListEl.querySelector(".msg-item");
    if (prevEl) {
      msgListEl.insertBefore(recallMsgItemEl, prevEl);
    } else {
      msgListEl.appendChild(recallMsgItemEl);
    }
  }
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

function getTextContent(elements: any[]) {
  let textContent = "";
  for (const element of elements) {
    if (element.textElement && element.textElement.content) {
      textContent += element.textElement.content;
    }
  }
  return textContent;
}

function getPicList(elements: any[]) {
  const picList: any[] = [];
  for (const element of elements) {
    if (element.picElement && element.picElement.sourcePath) {
      picList.push(element.picElement.sourcePath);
    }
  }
  return picList;
}

main();
