import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreDependencies: ["@eslint/js", "globals"],
    },
    "apps/mobile": {
      project: ["src/**/*.{ts,tsx}"],
      ignore: ["src/shared/components/ui/**"],
    },
    "apps/api": {
      project: ["src/**/*.ts"],
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
