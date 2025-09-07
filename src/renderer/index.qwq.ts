import packageJson from "package.json";
import { initSettingView } from "./pages/settings";
import { main } from "./index";

main();

RendererEvents.onSettingsWindowCreated(async () => {
  const view = await PluginSettings.renderer.registerPluginSettings(packageJson);
  initSettingView(view);
});
