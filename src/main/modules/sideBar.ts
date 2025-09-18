import { config, updateConfig, onConfigUpdate } from "@/main/modules/config";
import { createLogger } from "@/main/utils/createLogger";
import { createComparator } from "@/common/createComparator";

function setupSideBar() {
  const log = createLogger("sideBar");

  log("load");
  // IpcInterceptor.onIpcSendEvents("nodeIKernelUnitedConfigListener/onUnitedConfigUpdate", (channel, meta, payload) => {
  //   if (payload?.payload?.configData?.group === "100073") {
  //     const sideBarList = JSON.parse(payload.payload.configData.content);

  //     // sideBarList.forEach((item: any) => {
  //     //   item.isFixed = false;
  //     //   item.status = 2;
  //     // });

  //     payload.payload.configData.content = JSON.stringify(sideBarList);
  //     log("找到侧边栏参数2", sideBarList);
  //   }
  // });

  IpcInterceptor.onIpcReceiveEvents("nodeIKernelConfigMgrService/saveSideBarConfig", (meat, _, channel, payload) => {
    const sideBarConfig = payload[1]?.payload?.[0]?.config as any[];
    sideBarConfig?.forEach((item: any) => {
      config.sideBar.top.forEach((el) => {
        if (el.id === item.barId) {
          el.enabled = item.status === 1;
        }
      });
    });
    updateConfig(config);
  });

  IpcInterceptor.onIpcSendEvents("nodeIKernelConfigMgrListener/onSideBarChanged", (channel, meta, payload) => {
    payload.payload.config.forEach((item: any) => {
      const findItem = config.sideBar.top.find((i) => i.id === item.barId);
      if (findItem !== undefined) {
        item.status = findItem.enabled ? 1 : 2;
      }
    });
    log("侧边栏图标更新", payload.payload.config);
  });

  const unSubscribe = IpcInterceptor.onIpcSend((channel, meta, payload) => {
    if (payload?.configData?.group === "100073") {
      try {
        unSubscribe();
        const rawSideBar = JSON.parse(payload.configData.content);
        rawSideBar.forEach((item: any) => {
          item.isFixed = false;
        });
        const sideBar = rawSideBar.map((item: any) => {
          return {
            id: item.id,
            name: item.label,
            enabled: config.sideBar.top.find((i) => i.id === item.id)?.enabled ?? item.status === 1,
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
        updateConfig(config);
        payload.configData.content = JSON.stringify(rawSideBar);
        log("侧边栏初始化", rawSideBar);
      } catch (err) {
        log("初始化失败", err);
      }
      unSubscribe();
    }
  });

  const hasChanged = createComparator(config.sideBar);

  onConfigUpdate((config) => {
    if (hasChanged(config.sideBar)) {
      log("侧边栏变化", config.sideBar);
    }
  });
}

export { setupSideBar };
