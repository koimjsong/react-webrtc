const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "public/js/koiOcr/koiOcr.js"), 
  output: {
    filename: "koiOcr.bundle.js", 
    path: path.resolve(__dirname, "public/js/koiOcr"), 
    //path: path.resolve(__dirname, "dist"), 
    //publicPath: "/dist/",
    library: "koiOcr", 
    libraryTarget: "window", 
  },
  mode: "development", 
  //mode: "production", 
  resolve: {
    extensions: [".js"], 
    fallback: {
      path: require.resolve("path-browserify"),
      fs: false, // 브라우저 환경에서는 fs 사용 불가능
    },
    // alias: {
    //   IdCardOCRProcessor: path.resolve(__dirname, "public/js/koiOcr/idcard/Koi_IdCard.js"),
    // },
  },
  module: {
    rules: [
      {
        test: /\.js$/, 
        exclude: /node_modules/, 
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"], 
          },
        },
      },
    ],
  },
};