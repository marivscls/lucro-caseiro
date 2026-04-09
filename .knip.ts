import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreExportsUsedInFile: true,
  workspaces: {
    ".": {
      ignoreDependencies: ["@eslint/js", "globals"],
    },
    "apps/mobile": {
      project: ["src/**/*.{ts,tsx}"],
      ignore: [
        "src/shared/components/ui/**",
        "src/**/hooks.ts",
        "src/**/hooks/*.ts",
        "src/**/api.ts",
        "src/**/notification-types.ts",
        "src/features/finance/components/create-finance-entry.tsx",
        "eslint.config.mjs",
      ],
      ignoreDependencies: [
        "expo-router",
        "@lucro-caseiro/contracts",
        "@lucro-caseiro/ui",
        "expo-updates",
        "expo-system-ui",
      ],
      entry: ["src/app/**/*.{ts,tsx}"],
      includeEntryExports: true,
    },
    "apps/api": {
      project: ["src/**/*.ts"],
      ignoreDependencies: ["pdfkit"],
    },
    "packages/config": {
      entry: ["eslint/*.mjs", "tsconfig/*.json"],
      project: ["**/*.{mjs,json}"],
    },
    "packages/contracts": {
      project: ["src/**/*.ts"],
    },
    "packages/database": {
      project: ["src/**/*.ts"],
    },
    "packages/ui": {
      project: ["src/**/*.{ts,tsx}"],
    },
  },
};

export default config;
