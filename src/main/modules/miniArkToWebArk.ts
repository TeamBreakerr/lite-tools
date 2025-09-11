const appIdToName = new Map([
  ["1109224783", "微博"],
  ["1109937557", "哔哩哔哩"],
]);

function miniArkToWebArk(msgList: any[]) {
  msgList.forEach((msgItem) => {
    let msg_seq = msgItem.msgSeq;
    msgItem.elements.forEach((msgElements: any) => {
      if (msgElements?.arkElement?.bytesData) {
        const json = JSON.parse(msgElements.arkElement.bytesData);
        if (json?.prompt?.includes("[QQ小程序]")) {
          msgElements.arkElement.bytesData = replaceArk(json, msg_seq);
        }
      }
    });
  });
}

function replaceArk(json: any, msg_seq: any) {
  if (json.meta.detail_1.qqdocurl) {
    return JSON.stringify({
      app: "com.tencent.structmsg",
      config: json.config,
      desc: "新闻",
      extra: { app_type: 1, appid: json.meta.detail_1.appid, msg_seq, uin: json.meta.detail_1.host.uin },
      meta: {
        news: {
          action: "",
          android_pkg_name: "",
          app_type: 1,
          appid: json.meta.detail_1.appid,
          ctime: json.config.ctime,
          desc: json.meta.detail_1.desc,
          jumpUrl: json.meta.detail_1.qqdocurl.replace(/\\/g, ""),
          preview: json.meta.detail_1.preview,
          source_icon: json.meta.detail_1.icon,
          source_url: "",
          tag: getArkData(json),
          title: getArkData(json),
          uin: json.meta.detail_1.host.uin,
        },
      },
      prompt: `[分享]${getArkData(json)}`,
      ver: "0.0.0.1",
      view: "news",
    });
  } else {
    return JSON.stringify(json);
  }
}

function getArkData(json: any) {
  return json.meta.detail_1.title || appIdToName.get(json.meta.detail_1.appid) || json.meta.detail_1.desc;
}

export { miniArkToWebArk };
