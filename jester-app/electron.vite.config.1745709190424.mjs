// electron.vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@/lib": resolve("src/main/lib"),
        "@shared": resolve("src/shared")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    assetsInclude: "src/renderer/assets/**",
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared"),
        "@/hooks": resolve("src/renderer/src/hooks"),
        "@/assets": resolve("src/renderer/src/assets"),
        "@/store": resolve("src/renderer/src/store"),
        "@/components": resolve("src/renderer/src/componenets"),
        "@/mocks": resolve("src/renderer/src/mocks")
      }
    },
    plugins: [react()]
  }
});
export {
  electron_vite_config_default as default
};
