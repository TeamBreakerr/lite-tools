import { configManager } from "@/main/modules/configManager";
import { createLogger } from "@/main/utils/createLogger";

type SideBarConfig = {
  barId: number;
  status: number;
  weight: number;
};

function setupSideBar() {
  const log = createLogger("sideBar");
  log("load");
  let isInitSideBar = false;
  IpcInterceptor.onIpcReceiveEvents("nodeIKernelConfigMgrService/saveSideBarConfig", (meat, _, channel, payload) => {
    const sideBarConfig = payload[1]?.payload?.[0]?.config as SideBarConfig[];
    const config = configManager.value;
    sideBarConfig?.forEach((item) => {
      config.sideBar.top.forEach((el) => {
        if (el.id === item.barId) {
          el.enabled = item.status === 1;
        }
      });
    });
    configManager.updateConfig(config);
  });

  IpcInterceptor.interceptIpcSendEvents("nodeIKernelConfigMgrListener/onSideBarChanged", (channel, meta, payload) => {
    if (isInitSideBar) {
      isInitSideBar = false;
      log("初始化侧边栏", payload.payload.config);
      const sideBarConfig = payload.payload.config as SideBarConfig[];
      const config = configManager.value;
      sideBarConfig.forEach((item: any) => {
        const findItem = config.sideBar.top.find((i) => i.id === item.barId);
        if (findItem !== undefined) {
          findItem.enabled = item.status === 1;
        }
      });
      configManager.updateConfig(config);
    } else {
      log("更新侧边栏", payload.payload.config);
      const sideBarConfig = payload.payload.config as SideBarConfig[];
      const config = configManager.value;
      sideBarConfig.forEach((item: any) => {
        const findItem = config.sideBar.top.find((i) => i.id === item.barId);
        if (findItem !== undefined) {
          item.status = findItem.enabled ? 1 : 2;
        }
      });
    }
  });

  const unSubscribe = IpcInterceptor.interceptIpcSend((channel, meta, payload) => {
    if (payload?.configData?.group === "100073") {
      try {
        unSubscribe();
        const rawSideBar = JSON.parse(payload.configData.content);
        const config = configManager.value;
        if (rawSideBar.length !== config.sideBar.top.length - 3) {
          log("侧边栏数量不匹配，执行初始化", rawSideBar.length, config.sideBar.top.length);
          isInitSideBar = true;
        }
        rawSideBar.forEach((item: any) => {
          item.isFixed = false;
        });
        const sideBar = rawSideBar.map((item: any) => {
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
          ...sideBar,
          {
            id: -1,
            name: "更多",
            enabled: config.sideBar.top[config.sideBar.top.length - 1].enabled,
          },
        ];
        configManager.updateConfig(config);
        payload.configData.content = JSON.stringify(rawSideBar);
        log("更新侧边栏项目列表", rawSideBar);
      } catch (err) {
        log("更新侧边栏项目列表出错", err);
      }
      unSubscribe();
    }
  });
}

export { setupSideBar };
