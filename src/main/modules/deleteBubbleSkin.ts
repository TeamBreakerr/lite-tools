function deleteBubbleSkin(msgList: any[]) {
  msgList.forEach((msgItem) => {
    if (msgItem.msgAttrs.get(0)?.vasMsgInfo?.bubbleInfo) {
      msgItem.msgAttrs.get(0).vasMsgInfo.bubbleInfo = {
        bubbleId: 0,
        bubbleDiyTextId: null,
        subBubbleId: null,
        canConvertToText: null,
      };
    }
  });
}

export { deleteBubbleSkin };
