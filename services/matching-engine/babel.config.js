const plugins = [
  [
    require.resolve("babel-plugin-module-resolver"),
    {
      root: ["./src/"],
      alias: {
        "@matching-engine": "./src",
        "@core": "../../core",
      },
    },
  ],
];

module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  plugins,
};
