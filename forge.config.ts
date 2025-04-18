import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { ElectronegativityPlugin } from "@electron-forge/plugin-electronegativity";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

import { execSync } from "child_process";
import path from "path";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: ["./src-py", "./assets", "pyproject.toml"],
    icon: "./assets/icons/icon",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({
      options: {
        icon: "./assets/icons/icon.png",
      },
    }),
    new MakerDeb({
      options: {
        icon: "./assets/icons/icon.png",
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/main-window/index.html",
            js: "./src/main-window/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/main-window/preload.ts",
            },
          },
          {
            html: "./src/mini/index.html",
            js: "./src/mini/renderer.ts",
            name: "mini",
            preload: {
              js: "./src/mini/preload.ts",
            },
          },
          {
            html: "./src/recording-history/index.html",
            js: "./src/recording-history/renderer.ts",
            name: "recording_history",
            preload: {
              js: "./src/recording-history/preload.ts",
            },
          },
          {
            html: "./src/startup/index.html",
            js: "./src/startup/renderer.ts",
            name: "startup",
            preload: {
              js: "./src/startup/preload.ts",
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
    new ElectronegativityPlugin({
      isSarif: true,
    }),
  ],
  hooks: {
    postPackage: async (config, packageResult) => {
      console.log("Post package hook called");
      console.log(packageResult.outputPaths);
      const resourcesPath = path.join(
        packageResult.outputPaths[0],
        "resources"
      );
      console.log("Resources path:", resourcesPath);

      execSync("uv sync", {
        cwd: resourcesPath,
      });
    },
  },
};

export default config;
