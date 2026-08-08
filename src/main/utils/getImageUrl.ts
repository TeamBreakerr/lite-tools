import { configManager } from "@/main/modules/configManager";
import { createLogger } from "@/main/utils/createLogger";

type PicElement = {
  originImageUrl?: string;
  md5HexStr?: string;
  [key: string]: any;
};

type RkeyData = {
  private_rkey: string;
  group_rkey: string;
  expired_time: number;
};

const IMAGE_HOST = "https://gchat.qpic.cn";
const IMAGE_HOST_NT = "https://multimedia.nt.qq.com.cn";
const log = createLogger("getImageUrl");

const cachedRkey = {
  private_rkey: "",
  group_rkey: "",
  expired_time: 0,
};

let pendingRkeyPromise: Promise<void> | null = null;

async function getImageUrl(picElement: PicElement): Promise<string | null> {
  const { originImageUrl: url, md5HexStr } = picElement;

  if (!url) {
    if (md5HexStr) {
      return `${IMAGE_HOST}/gchatpic_new/0/0-0-${md5HexStr.toUpperCase()}/0`;
    }
    return null;
  }

  const parsedUrl = new URL(url, IMAGE_HOST);
  const imageAppid = parsedUrl.searchParams.get("appid");

  if (!imageAppid || !["1406", "1407"].includes(imageAppid)) {
    return parsedUrl.toString();
  }

  let rkey = parsedUrl.searchParams.get("rkey");
  if (!rkey) {
    const rkeyType = imageAppid === "1406" ? "private_rkey" : "group_rkey";
    const rawRkey = await fetchRkey(rkeyType);

    if (rawRkey) {
      const cleanRkey = rawRkey.replace(/^&rkey=/, "");
      parsedUrl.searchParams.set("rkey", cleanRkey);
    }
  }

  parsedUrl.host = new URL(IMAGE_HOST_NT).host;

  return parsedUrl.toString();
}

async function fetchRkey(type: "private_rkey" | "group_rkey") {
  const now = Date.now();

  if (now <= cachedRkey.expired_time) {
    log("rkey未过期，使用缓存");
    return cachedRkey[type];
  }

  if (pendingRkeyPromise) {
    await pendingRkeyPromise;
    return cachedRkey[type];
  }

  pendingRkeyPromise = (async () => {
    try {
      const res = await fetch(configManager.value.global.rkeyServerUrl);
      const data = (await res.json()) as RkeyData;

      cachedRkey.expired_time = data.expired_time * 1000;
      cachedRkey.private_rkey = data.private_rkey;
      cachedRkey.group_rkey = data.group_rkey;
      log("rkey更新成功", data);
    } catch (err) {
      log("获取rkey失败", err);
    } finally {
      pendingRkeyPromise = null;
    }
  })();

  await pendingRkeyPromise;
  return cachedRkey[type];
}

export { getImageUrl };
