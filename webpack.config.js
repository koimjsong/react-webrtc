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