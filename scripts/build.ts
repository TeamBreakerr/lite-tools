import { build, context, BuildOptions } from "esbuild";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { basename, join, extname, dirname } from "node:path";
import chokidar from "chokidar";
import * as sass from "sass";

const isDev = process.argv.includes("--watch");

const SCSS_SRC_DIR = "./src/renderer/scss";
const OUT_CSS_DIR = "./dist/css";

// 通用基础配置
const baseConfig: BuildOptions = {
  bundle: true,
  charset: "utf8",
  minify: !isDev,
  logLevel: "info",
  treeShaking: true,
  define: {
    __DEV__: isDev.toString(),
  },
};

// 构建目标列表（移除 SCSS 插件）
const builds: { config: BuildOptions; watchHtml?: string }[] = [
  {
    // main
    config: {
      ...baseConfig,
      platform: "node",
      target: "node20",
      tsconfig: "src/main/tsconfig.json",
      format: "cjs",
      entryPoints: ["src/main/index.ts"],
      outfile: "dist/main/index.js",
      external: ["electron"],
    },
  },
  {
    // preload
    config: {
      ...baseConfig,
      platform: "node",
      target: "node20",
      tsconfig: "src/preload/tsconfig.json",
      format: "cjs",
      entryPoints: ["src/preload/index.ts"],
      outfile: "dist/preload/index.js",
      external: ["electron"],
    },
  },
  {
    // renderer-qwq
    config: {
      ...baseConfig,
      platform: "browser",
      target: "esnext",
      format: "cjs",
      tsconfig: "src/renderer/tsconfig.json",
      entryPoints: ["src/renderer/index.qwq.ts"],
      outfile: "dist/renderer/index.qwq.js",
      loader: { ".html": "text", ".svg": "text" },
    },
  },
  {
    // renderer-ll
    config: {
      ...baseConfig,
      platform: "browser",
      target: "esnext",
      format: "esm",
      tsconfig: "src/renderer/tsconfig.json",
      entryPoints: ["src/renderer/index.ll.ts"],
      outfile: "dist/renderer/index.ll.js",
      loader: { ".html": "text", ".svg": "text" },
    },
  },
  {
    // renderer-recall
    config: {
      ...baseConfig,
      platform: "browser",
      target: "esnext",
      loader: { ".html": "text" },
      tsconfig: "src/renderer/tsconfig.json",
      entryPoints: ["src/renderer/entries/showRecallList/index.ts"],
      outfile: "dist/renderer/entries/showRecallList/index.js",
    },
    watchHtml: "src/renderer/entries/showRecallList/index.html",
  },
  {
    // renderer-preload
    config: {
      ...baseConfig,
      platform: "node",
      target: "node20",
      format: "cjs",
      tsconfig: "src/renderer/tsconfig.json",
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

// 编译单个 SCSS 文件
function compileScssFile(srcFile: string, outDir: string) {
  const result = sass.compile(srcFile, { style: "expanded" });
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, basename(srcFile, ".scss") + ".css");
  writeFileSync(outFile, result.css, "utf-8");
  console.log(`[SCSS] ${basename(srcFile)} → ${basename(outFile)}`);
}

// 批量编译 SCSS
function compileAllScss() {
  const files = readdirSync(SCSS_SRC_DIR).filter((f) => extname(f) === ".scss");
  files.forEach((file) => compileScssFile(join(SCSS_SRC_DIR, file), OUT_CSS_DIR));
}

// watch SCSS 文件变化
function watchScss() {
  console.log("开始监听 scss变动");
  chokidar
    .watch(SCSS_SRC_DIR, {
      ignoreInitial: true,
      ignored: (path, stats) => {
        return !!(stats?.isFile() && !path.endsWith(".scss"));
      },
    })
    .on("all", (event, filePath) => {
      const cssFile = join(OUT_CSS_DIR, basename(filePath, ".scss") + ".css");
      if (event === "unlink") {
        // 删除对应的 CSS 文件
        if (existsSync(cssFile)) {
          unlinkSync(cssFile);
          console.log(`[SCSS] Deleted ${cssFile}`);
        }
      } else if (extname(filePath) === ".scss") {
        // 编译新增或修改的 SCSS
        compileScssFile(filePath, OUT_CSS_DIR);
      }
    });
}

// 批量构建
async function runBuild() {
  // 先构建 SCSS
  compileAllScss();
  if (isDev) {
    console.log("Starting development build...");
    watchScss();
    const contexts = await Promise.all(
      builds.map(async ({ config, watchHtml }) => {
        const ctx = await context(config);
        await ctx.watch();

        if (watchHtml) {
          if (!existsSync(dirname(config.outfile!))) mkdirSync(dirname(config.outfile!), { recursive: true });
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
          if (watchHtml) processHtml(watchHtml, config.outfile!.replace(/\.js$/, ".html"));
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
