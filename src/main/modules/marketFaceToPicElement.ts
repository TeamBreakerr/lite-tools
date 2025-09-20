function marketFaceToPicElement(msgList: any[]) {
  msgList.forEach((msgItem) => {
    msgItem.elements.forEach((msgElements: any) => {
      if (msgElements?.marketFaceElement) {
        msgElements.picElement = replaceMarketFace(msgElements.marketFaceElement);
        msgElements.marketFaceElement = null;
        msgElements.elementType = 2;
        msgItem.msgType = 2;
        msgItem.subMsgType = 4096;
      }
    });
  });
}

function replaceMarketFace(marketFaceElement: any): object {
  const fileName = marketFaceElement.staticFacePath.split("\\").pop();
  const picWidth = marketFaceElement.supportSize?.[0].width ?? marketFaceElement.imageHeight ?? 200;
  const picHeight = marketFaceElement.supportSize?.[0].height ?? marketFaceElement.imageHeight ?? 200;
  const sourcePath = marketFaceElement.staticFacePath;
  const thumbPath = new Map([
    ["0", sourcePath],
    ["198", sourcePath],
    ["720", sourcePath],
  ]);
  return {
    picSubType: 1,
    fileName,
    fileSize: "142857",
    picWidth,
    picHeight,
    original: true,
    md5HexStr: "",
    sourcePath,
    thumbPath,
    transferStatus: 2,
    progress: 0,
    picType: 2000,
    invalidState: 0,
    fileUuid: "",
    fileSubId: "",
    thumbFileSize: 0,
    fileBizId: null,
    downloadIndex: null,
    summary: "",
    emojiFrom: null,
    emojiWebUrl: null,
    emojiAd: {
      url: "",
      desc: "",
    },
    emojiMall: {
      packageId: 0,
      emojiId: 0,
    },
    emojiZplan: {
      actionId: 0,
      actionName: "",
      actionType: 0,
      playerNumber: 0,
      peerUid: "0",
      bytesReserveInfo: "",
    },
    originImageMd5: "",
    originImageUrl: "",
    import_rich_media_context: null,
    isFlashPic: null,
    storeID: 1,
  };
}

export { marketFaceToPicElement };
