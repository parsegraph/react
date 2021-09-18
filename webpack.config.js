const path = require("path");

module.exports = {
  externals: {
    "parsegraph-checkglerror":{
      commonjs:"parsegraph-checkglerror",
      commonjs2:"parsegraph-checkglerror",
      amd:"parsegraph-checkglerror",
      root:"parsegraph"
    },
    "react":{
      commonjs:"react",
      commonjs2:"react",
      amd:"react",
      root:"React"
    },
  },
  entry: {
    main:path.resolve(__dirname, "src/index.ts"),
    element:path.resolve(__dirname, "src/demo/element.tsx"),
    iframes:path.resolve(__dirname, "src/demo/iframes.tsx")
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "parsegraph-react.[name].js",
    globalObject: "this",
    library: "parsegraph",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx?)$/,
        exclude: /node_modules/,
        loader: ['babel-loader', 'ts-loader']
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ["ts-shader-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".glsl"],
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
  mode: "development",
  devtool: "eval-source-map",
};
