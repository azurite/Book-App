const webpack = require("webpack");
const PurifyCSSPlugin = require("purifycss-webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NpmInstallPlugin = require("npm-install-webpack-plugin");

exports.HTMLPlugin = function({ template }) {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        template
      })
    ]
  };
};

exports.autoInstall = function({ dev }) {
  return {
    plugins: [
      new NpmInstallPlugin({
        dev
      })
    ]
  };
};

exports.purifyCSS = function({ paths }) {
  return {
    plugins: [
      new PurifyCSSPlugin({ paths })
    ]
  };
};

exports.clean = function(path) {
  return {
    plugins: [
      new CleanWebpackPlugin([path])
    ]
  };
};

exports.hashedModuleIds = function() {
  return {
    plugins: [
      new webpack.HashedModuleIdsPlugin()
    ]
  };
};
