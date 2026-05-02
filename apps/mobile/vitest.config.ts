import path from "path";
import { defineConfig } from "vitest/config";

const stub = path.resolve(__dirname, "src/test/mocks/expo-stub.ts");
const expoCore = path.resolve(__dirname, "src/test/mocks/expo-modules-core.ts");
const ui = path.resolve(__dirname, "src/test/mocks/ui.ts");

export default defineConfig({
  define: {
    __DEV__: true,
  },
  resolve: {
    alias: {
      "@lucro-caseiro/ui": ui,
      "expo-modules-core": expoCore,
      "expo-linking": stub,
      "expo-constants": stub,
      "expo-file-system": stub,
      "expo-secure-store": stub,
      "expo-sharing": stub,
      "expo-status-bar": stub,
      "expo-web-browser": stub,
      "expo-router": stub,
    },
  },
  test: {
    globals: false,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
