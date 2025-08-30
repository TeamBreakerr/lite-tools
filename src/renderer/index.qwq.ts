import packageJson from "package.json";
import initSettingView from "./pages/settings";
import main from "./index";

main();

// 设置页面
RendererEvents.onSettingsWindowCreated(async () => {
  const view = await PluginSettings.renderer.registerPluginSettings(packageJson);
  initSettingView(view);
});
