import "./components/revealMask";
import { importBlobAsset } from "@/renderer/utils/importAsset";
import { resource } from "./resource";

export async function setupRevealMask() {
  if (window.CSS && CSS.registerProperty) {
    CSS.registerProperty({
      name: "--reveal-center",
      syntax: "<color>",
      inherits: false,
      initialValue: "rgba(0, 0, 0, 1)",
    });
    CSS.registerProperty({
      name: "--reveal-edge",
      syntax: "<color>",
      inherits: false,
      initialValue: "rgba(0, 0, 0, 1)",
    });
    CSS.registerProperty({
      name: "--reveal-diffusion",
      syntax: "<length>",
      inherits: false,
      initialValue: "0px",
    });
    CSS.registerProperty({
      name: "--reveal-offset",
      syntax: "<length>",
      inherits: false,
      initialValue: "0px",
    });
  }

  const turbulence = await importBlobAsset("../resources", "turbulence.png");
  resource.url = URL.createObjectURL(turbulence);
  console.log(resource);
}
