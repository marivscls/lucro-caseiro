import baseConfig from "@lucro-caseiro/config/eslint/base";
import pluginSecurity from "eslint-plugin-security";

export default [
  ...baseConfig,
  pluginSecurity.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
