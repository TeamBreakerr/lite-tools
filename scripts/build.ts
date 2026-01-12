import { build, context, BuildOptions } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, dirname } from "node:path";
import chokidar from "chokidar";

const isDev = process.argv.includes("--watch");

// 通用基础配置
const baseConfig: BuildOptions = {
  bundle: true,
  charset: "utf8",
  tsconfig: "./tsconfig.json",
  minify: !isDev,
};

// 构建目标列表
const builds: { config: BuildOptions; watchHtml?: string }[] = [
  {
    config: {
      ...baseConfig,
      platform: "node",
      target: "node20",
      format: "cjs",
      entryPoints: ["src/main/index.ts"],
      outfile: "dist/main/index.js",
      external: ["electron"],
    },
  },
  {
    config: {
      ...baseConfig,
      platform: "node",
      target: "node20",
      format: "cjs",
      entryPoints: ["src/preload/index.ts"],
      outfile: "dist/preload/index.js",
      external: ["electron"],
    },
  },
  {
    config: {
      ...baseConfig,
      platform: "browser",
      target: "esnext",
      format: "cjs",
      entryPoints: ["src/renderer/index.qwq.ts"],
      outfile: "dist/renderer/index.qwq.js",
      loader: { ".html": "text" },
      plugins: [sassPlugin({ type: "css-text" })],
    },
  },
  {
    config: {
      ...baseConfig,
      platform: "browser",
      target: "esnext",
      format: "esm",
      entryPoints: ["src/renderer/index.ll.ts"],
      outfile: "dist/renderer/index.ll.js",
      loader: { ".html": "text" },
      plugins: [sassPlugin({ type: "css-text" })],
    },
  },
  {
    config: {
      ...baseConfig,
      platform: "browser",
      target: "esnext",
      format: "esm",
      loader: { ".html": "text" },
      entryPoints: ["src/renderer/entries/showRecallList/index.ts"],
      outfile: "dist/renderer/entries/showRecallList/index.js",
      plugins: [sassPlugin({ type: "style" })],
    },
    watchHtml: "src/renderer/entries/showRecallList/index.html",
  },
  {
    config: {
      ...baseConfig,
      platform: "node",
      target: "node20",
      format: "cjs",
      entryPoints: ["src/renderer/entries/showRecallList/preload.ts"],
      outfile: "dist/renderer/entries/showRecallList/preload.js",
      external: ["electron"],
    },
  },
];

// 构建 HTML 的辅助函数
function processHtml(srcPath: string, outPath: string) {
  const html = readFileSync(srcPath, "utf-8");
  const newHtml = html.replace(
    /<script\b([^>]*?)\bsrc=["']([^"']+?)\.ts["']([^>]*)><\/script>/g,
    (_, beforeSrc, srcPath, afterSrc) => `<script${beforeSrc} src="${srcPath}.js"${afterSrc}></script>`
  );
  writeFileSync(outPath, newHtml, "utf-8");
}

// 批量构建
async function runBuild() {
  if (isDev) {
    console.log("Starting development build...");
    const contexts = await Promise.all(
      builds.map(async ({ config, watchHtml }) => {
        const ctx = await context(config);
        await ctx.watch();

        if (watchHtml) {
          // 初始化一次
          if (!existsSync(dirname(config.outfile!))) {
            mkdirSync(dirname(config.outfile!), { recursive: true });
          }
          chokidar
            .watch(watchHtml, { persistent: true, ignoreInitial: true })
            .on("all", () => processHtml(watchHtml, config.outfile!.replace(/\.js$/, ".html")));
          processHtml(watchHtml, config.outfile!.replace(/\.js$/, ".html"));
        }

        return ctx;
      })
    );

    console.log("Development build started. Watching for changes...");
    return contexts;
  } else {
    console.log("Starting production build...");
    try {
      await Promise.all(
        builds.map(async ({ config, watchHtml }) => {
          await build(config);
          if (watchHtml) {
            processHtml(watchHtml, config.outfile!.replace(/\.js$/, ".html"));
          }
        })
      );
      console.log("Production build completed successfully.");
    } catch (err) {
      console.error("Error during production build:", err);
      process.exit(1);
    }
  }
}

runBuild().catch((err) => {
  console.error("Unhandled error in build script:", err);
  process.exit(1);
});