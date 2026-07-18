module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          web: {
            unstable_transformImportMeta: true,
          },
        },
      ],
    ],
  };
};
