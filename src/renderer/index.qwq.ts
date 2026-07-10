import packageJson from "root/package.json";
import { getHash } from "@/renderer/utils/getHash";
import { initSettingView } from "@/renderer/pages/settings";
import { main } from "@/renderer/index";
import { qwqSetupVueComponentTracker } from "@/renderer/modules/vueComponentTracker";

qwqSetupVueComponentTracker();
main();

// 异步加载脚本时可能会错过上面的事件
if (__DEV__) {
  (async () => {
    const hash = await getHash();
    if (hash === "#/setting/settings/common") {
      const view = await PluginSettings.renderer.registerPluginSettings(packageJson);
      initSettingView(view);
    }
  })();
} else {
  RendererEvents.onSettingsWindowCreated(async () => {
    const view = await PluginSettings.renderer.registerPluginSettings(packageJson);
    initSettingView(view);
  });
}
