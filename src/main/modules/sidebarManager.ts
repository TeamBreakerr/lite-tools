import { configManager } from "@/main/modules/configManager";
import { createLogger } from "@/main/utils/createLogger";

type IpcSidebarStatus = {
  barId: number;
  status: number;
  weight: number;
};

// 侧边栏开启状态枚举
enum SidebarStatus {
  ENABLED = 1,
  DISABLED = 2,
}

// 侧边栏分组 ID 常量
const SIDEBAR_GROUP_ID = "100073";

function setupSideBar() {
  const log = createLogger("sideBar");
  log("load");
  let isPendingInit = false;
  IpcInterceptor.onIpcReceiveEvents("nodeIKernelConfigMgrService/saveSideBarConfig", (meat, _, channel, payload) => {
    const sideBarConfig = payload[1]?.payload?.[0]?.config as IpcSidebarStatus[];
    const config = configManager.value;
    const topMap = new Map(config.sideBar.top.map((item) => [item.id, item]));
    for (const { barId, status } of sideBarConfig ?? []) {
      const localMatchedItem = topMap.get(barId);
      if (localMatchedItem) {
        localMatchedItem.enabled = status === SidebarStatus.ENABLED;
      }
    }

    configManager.updateConfig(config);
  });

  IpcInterceptor.interceptIpcSendEvents("nodeIKernelConfigMgrListener/onSideBarChanged", (channel, meta, payload) => {
    if (isPendingInit) {
      isPendingInit = false;
      log("初始化侧边栏", payload.payload.config);
      const sideBarConfig = payload.payload.config as IpcSidebarStatus[];
      const config = configManager.value;
      for (const item of sideBarConfig) {
        const localMatchedItem = config.sideBar.top.find((i) => i.id === item.barId);
        if (localMatchedItem !== undefined) {
          localMatchedItem.enabled = item.status === SidebarStatus.ENABLED;
        }
      }
      configManager.updateConfig(config);
    } else {
      log("更新侧边栏", payload.payload.config);
      const sideBarConfig = payload.payload.config as IpcSidebarStatus[];
      const config = configManager.value;
      for (const item of sideBarConfig) {
        const localMatchedItem = config.sideBar.top.find((i) => i.id === item.barId);
        if (localMatchedItem !== undefined) {
          item.status = localMatchedItem.enabled ? SidebarStatus.ENABLED : SidebarStatus.DISABLED;
        }
      }
    }
  });

  const unSubscribe = IpcInterceptor.interceptIpcSend((channel, meta, payload) => {
    if (payload?.configData?.group === SIDEBAR_GROUP_ID) {
      try {
        unSubscribe();
        const remoteSidebarPayload = JSON.parse(payload.configData.content);
        const config = configManager.value;
        if (remoteSidebarPayload.length !== config.sideBar.top.length - 3) {
          log("侧边栏数量不匹配，执行初始化", remoteSidebarPayload.length, config.sideBar.top.length);
          isPendingInit = true;
        }
        for (const item of remoteSidebarPayload) {
          item.isFixed = false;
        }
        const customSidebarItems = remoteSidebarPayload.map((item: any) => {
          return {
            id: item.id,
            name: item.label,
            enabled: config.sideBar.top.find((i) => i.id === item.id)?.enabled ?? false,
          };
        });
        config.sideBar.top = [
          {
            id: -1,
            name: "消息",
            enabled: config.sideBar.top[0].enabled,
          },
          {
            id: -1,
            name: "联系人",
            enabled: config.sideBar.top[1].enabled,
          },
          ...customSidebarItems,
          {
            id: -1,
            name: "更多",
            enabled: config.sideBar.top[config.sideBar.top.length - 1].enabled,
          },
        ];
        configManager.updateConfig(config);
        payload.configData.content = JSON.stringify(remoteSidebarPayload);
        log("更新侧边栏项目列表", remoteSidebarPayload);
      } catch (err) {
        log("更新侧边栏项目列表出错", err);
      }
    }
  });
}

export { setupSideBar };
