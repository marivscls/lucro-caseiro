import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: ["apps/promo-video/**"],
  ignoreExportsUsedInFile: true,
  // CLIs de e2e e builds nativos instalados externamente ao workspace.
  ignoreBinaries: ["maestro", "eas"],
  workspaces: {
    ".": {
      // Scripts operacionais sao executados diretamente por Node/CI/Railway.
      // Caches de navegador, skills e artefatos de auditoria nao sao codigo do app.
      entry: ["scripts/*.{mjs,cjs,ts}"],
      project: ["*.{mjs,cjs,ts}", "scripts/**/*.{mjs,cjs,ts}"],
    },
    // Tool de codegen standalone (package.json proprio, fora do pnpm-workspace):
    // cli/worker sao os entrypoints que puxam o resto de src/.
    "tools/asset-forge": {
      // cli.mjs (bin) e worker.mjs (script) sao auto-detectados; so os testes precisam.
      entry: ["test/**/*.test.mjs"],
      project: ["**/*.mjs"],
    },
    "apps/mobile": {
      // Expo fornece Babel transitivamente; habilitar a leitura do preset explicito.
      babel: true,
      entry: ["src/app/**/*.{ts,tsx}", "scripts/guidance-smoke.cjs"],
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
    "apps/web": {
      // Registrado por URL no navegador, sem import estatico.
      entry: ["public/sw.js"],
      project: ["src/**/*.{ts,tsx,css}"],
      // Knip infere postcss do plugin Tailwind; @tailwindcss/postcss ja o fornece
      // como dependencia propria, sem peer nem import direto neste workspace.
      ignoreDependencies: ["postcss"],
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
