import type { RecallChatList, ChatPeerUid } from "@/common/types/preventRecall";
import type { Lt_showRecallList } from "@/preload/recallMsgViewer";

type RecallChatInfo = RecallChatList extends Map<string, infer T> ? T : never;

type RecallChatItemData = RecallChatInfo & {
  peerUid: ChatPeerUid;
};

type RecallChatSelectEvent = CustomEvent<{
  peerUid: ChatPeerUid;
}>;

declare global {
  const lt_showRecallList: Lt_showRecallList;

  interface HTMLElementEventMap {
    "lt-recall-chat-select": RecallChatSelectEvent;
  }
}

export type { RecallChatInfo, RecallChatItemData, RecallChatSelectEvent };
