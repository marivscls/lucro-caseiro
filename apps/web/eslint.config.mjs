import baseConfig from "@lucro-caseiro/config/eslint/base";

export default [
  ...baseConfig,
  {
    ignores: [".next/**", "next-env.d.ts"],
    rules: {
      "sonarjs/prefer-read-only-props": "off",
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
