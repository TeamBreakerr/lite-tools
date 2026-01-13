type ChatPeerUid = string;
type ChatName = string;
type RecallChatList = Map<ChatPeerUid, { peerName: ChatName; chatType: number; peerUin: string; msgTime: number }>;
type RecallData = {
  id: string;
  recallData?: {
    operatorNick: string;
    operatorRemark: string;
    operatorMemRemark: string;
    origMsgSenderNick: string;
    origMsgSenderRemark: string;
    origMsgSenderMemRemark: string;
    recallTime: number;
  };
};
type RecallMsgId = string;
export type { ChatPeerUid, ChatName, RecallChatList, RecallData, RecallMsgId };
