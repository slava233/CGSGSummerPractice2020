const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: './src/main.js',
  mode: 'development',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(txt)$/,
        use: {
          loader: 'raw-loader'
        }
      },
      {
        test: /\.(glsl|vert|frag)$/,
        use: {
          loader: 'raw-loader'
        }
      },
      {
        test: /\.html$/,
        use: {
          loader: 'html-loader'
        }
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: {
          loader: 'file-loader'
        }
      }
    ]
  },
  output: {
    filename: 'index-bundles.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/index.html',
      filename: './index.html'
    })
  ]
};