async function convertMessage(message: any) {
  switch (message.type) {
    case "text":
      return {
        elementType: 1,
        elementId: "",
        textElement: {
          content: message.content,
          atType: 0,
          atUid: "",
          atTinyId: "",
          atNtUid: "",
        },
      };
    case "image": {
      const path = message.path;
      await lite_tools.nativeCall(
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getFileType",
          cmdType: "invoke",
          payload: [path],
        },
        true,
      );
      const copyFile = (await lite_tools.nativeCall(
        {
          type: "request",
          eventName: "ntApi",
        },
        {
          cmdName: "nodeIKernelMsgService/copyFileWithDelExifInfo",
          cmdType: "invoke",
          payload: [
            {
              sourcePath: path,
              elementSubType: 1,
            },
            null,
          ],
        },
        true,
      )) as any;
      const fileType = (await lite_tools.nativeCall(
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getFileType",
          cmdType: "invoke",
          payload: [copyFile.newPath],
        },
        true,
      )) as any;
      const imageSize = (await lite_tools.nativeCall(
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getImageSizeFromPath",
          cmdType: "invoke",
          payload: [path],
        },
        true,
      )) as any;
      const fileSize = (await lite_tools.nativeCall(
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getFileSize",
          cmdType: "invoke",
          payload: [path],
        },
        true,
      )) as number;

      const picElement = {
        md5HexStr: copyFile.md5,
        picWidth: imageSize.width,
        picHeight: imageSize.height,
        fileName: copyFile.md5 + "." + fileType.ext,
        fileSize: `${fileSize}`,
        original: true,
        picSubType: message.picSubType,
        sourcePath: copyFile.newPath,
        thumbPath: null,
        picType: fileType.ext === "gif" ? 2000 : 1000,
        fileUuid: "",
        fileSubId: "",
        thumbFileSize: 0,
        summary: message.summary || "",
      };
      const messageChannel = {
        elementType: 2,
        elementId: "",
        picElement,
        extBufForUI: new Uint8Array(),
      };
      return messageChannel;
    }
    default:
      return null;
  }
}

async function sendMessage(peer: Peer, messages: any[]) {
  const msgElements = await Promise.all(messages.map((message) => convertMessage(message)));
  lite_tools.nativeCall(
    {
      eventName: "ntApi",
      type: "request",
    },
    {
      cmdName: "nodeIKernelMsgService/sendMsg",
      cmdType: "invoke",
      payload: [
        {
          msgId: "0",
          peer,
          msgElements,
          msgAttributeInfos: new Map(),
        },
        null,
      ],
    },
  );
}

function forwardMessage(srcpeer: Peer, dstpeer: Peer, msgIds: any) {
  lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelMsgService/forwardMsgWithComment",
      cmdType: "ntApi",
      payload: [
        {
          commentElements: [],
          dstContacts: [dstpeer],
          msgAttributeInfos: new Map(),
          msgIds,
          srcContact: srcpeer,
        },
        null,
      ],
    },
  );
}

function getUserInfo(uid: string) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelProfileService/fetchUserDetailInfo",
      cmdType: "invoke",
      payload: [
        {
          callFrom: "BuddyProfileStore",
          uid,
          bizList: [0],
          source: 0,
        },
        null,
      ],
    },
    ["nodeIKernelProfileListener/onProfileDetailInfoChanged", "nodeIKernelProfileListener/onProfileSimpleChanged"],
  );
}

function getMembersAvatar(uids: string[]) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelAvatarService/getMembersAvatarPath",
      cmdType: "invoke",
      payload: [
        {
          uids,
          clarity: 1,
        },
      ],
    },
    true,
  );
}

function getGroupsAvatar(groupCodes: string[]) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelAvatarService/getConfGroupsAvatarPath",
      cmdType: "invoke",
      payload: [
        {
          groupCodes,
          clarity: 1,
        },
      ],
    },
    true,
  );
}

function goMainWindowScene(sceneData: any) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "WindowApi",
    },
    {
      cmdName: "nodeIKernelAvatarService/getConfGroupsAvatarPath",
      cmdType: "invoke",
      payload: [
        {
          scene: sceneData.scene,
          sceneParams: {
            peerUid: sceneData.peerUid,
            chatType: sceneData.chatType,
            type: sceneData.type,
            params: {
              msgId: sceneData.msgId,
            },
          },
        },
      ],
    },
  );
}

function getGroupInfo(groupCode: string) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelGroupService/getGroupDetailInfo",
      cmdType: "invoke",
      payload: [
        {
          groupCode,
          source: 4,
        },
        null,
      ],
    },
  );
}

function activeChatAndReturnPreview(peer: Peer) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelMsgService/getAioFirstViewLatestMsgsAndAddActiveChat",
      cmdType: "invoke",
      payload: [
        {
          peer,
          cnt: 10,
        },
        null,
      ],
    },
  );
}

function getLoginList() {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelLoginService/getLoginList",
      cmdType: "invoke",
      payload: [null, null],
    },
  );
}

function getAuthData() {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "GlobalDataApi",
    },
    {
      cmdName: "fetchAuthData",
      cmdType: "invoke",
      payload: [],
    },
  );
}

function resetLoginInfo(uin: string) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelLoginService/deleteLoginInfo",
      cmdType: "invoke",
      payload: [
        {
          uin,
        },
        null,
      ],
    },
  );
}

export {
  sendMessage,
  forwardMessage,
  goMainWindowScene,
  getUserInfo,
  getMembersAvatar,
  getGroupsAvatar,
  getGroupInfo,
  getAuthData,
  activeChatAndReturnPreview,
  getLoginList,
  resetLoginInfo,
};
