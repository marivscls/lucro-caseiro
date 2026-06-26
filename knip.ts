import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreExportsUsedInFile: true,
  // runner e2e externo (nao instalado como dep).
  ignoreBinaries: ["maestro"],
  workspaces: {
    ".": {},
    // Tool de codegen standalone (package.json proprio, fora do pnpm-workspace):
    // cli/worker sao os entrypoints que puxam o resto de src/.
    "tools/asset-forge": {
      // cli.mjs (bin) e worker.mjs (script) sao auto-detectados; so os testes precisam.
      entry: ["test/**/*.test.mjs"],
      project: ["**/*.mjs"],
    },
    "apps/mobile": {
      entry: ["src/app/**/*.{ts,tsx}"],
      project: ["src/**/*.{ts,tsx}"],
      ignore: [
        "src/**/hooks.ts",
        "src/**/hooks/*.ts",
        // Resolvidos por plataforma pelo Metro (.native/.web) — knip nao traca.
        "src/**/*.{native,web}.{ts,tsx}",
        "src/shared/ads-init.ts",
        // Mocks aliasados em vitest.config.ts — nao rastreados por import.
        "src/test/mocks/**",
      ],
      ignoreDependencies: [
        "expo-updates",
        "expo-system-ui",
        // qrcode-generator (runtime) usado em labels/qr.ts; @types e o par dele.
        "@types/qrcode-generator",
        // peer de teste do @testing-library/react-native (sem import direto).
        "react-test-renderer",
      ],
      includeEntryExports: true,
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
