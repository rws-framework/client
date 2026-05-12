const path = require('path');
const webpack = require('webpack');
const tools = require('@rws-framework/client/_tools');

const executionDir = process.cwd();
const rootPackageNodeModules = path.resolve(tools.findRootWorkspacePath(process.cwd()), 'node_modules');

const tsConfigFile = process.env.SW_TSCONFIG 
  ? path.resolve(process.env.SW_TSCONFIG) 
  : path.resolve(__dirname, 'tsconfig.json');

module.exports = {
  entry: process.env.SWPATH,
  mode: 'development',
  target: 'webworker',
  devtool: 'source-map',
  output: {
    path: path.resolve(executionDir, 'public'),
    filename: 'service_worker.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      '__SWPATH': "'" + process.env.SWPATH + "'",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        use: [                       
          {
            loader: 'ts-loader',
            options: {
              allowTsInNodeModules: true,
              transpileOnly: true,
              configFile: tsConfigFile,
              compilerOptions: {
                ignoreDeprecations: '6.0'
              }
            }
          },
        ]         
      }
    ],
  },
  resolveLoader: {
    modules: [rootPackageNodeModules],
  }
};