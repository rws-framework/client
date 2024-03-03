const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const JsMinimizerPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const RWSAfterPlugin = require('./webpack/rws_after_plugin');
const { Console } = require('console');

let WEBPACK_PLUGINS = [];

/**
 *  The RWS webpack configurator.
 * 
 *  Example usage in importing file:
 * 
 *  RWSWebpackWrapper({
    dev: true,
    hot: false,
    tsConfigPath: executionDir + '/tsconfig.json',
    entry: `${executionDir}/src/index.ts`,
    executionDir: executionDir,
    publicDir:  path.resolve(executionDir, 'public'),
    outputDir:  path.resolve(executionDir, 'build'),
    outputFileName: 'jtrainer.client.js',
    copyToDir: {
      '../public/js/' : [
        './build/jtrainer.client.js',
        './build/jtrainer.client.js.map',
        './src/styles/compiled/main.css'
      ]
    },
    plugins: [
    
    ],
  });
 */
const RWSWebpackWrapper = (config) => {  
  const executionDir = config.executionDir || process.cwd();

  const isDev = config.dev;
  const isHotReload = config.hot;
  const isReport = config.report;

  const publicDir = config.publicDir || null;
  const serviceWorkerPath = config.serviceWorker || null;

  const WEBPACK_AFTER_ACTIONS = config.actions || [];

  const publicIndex = config.publicIndex || 'index.html';
  
  const aliases = config.aliases = {};

  aliases.fs = false;

  const modules_setup = [path.resolve(__dirname, 'node_modules'), 'node_modules'];

  const overridePlugins = config.plugins || []

  if (isHotReload){
    if(!publicDir){
      throw new Error('No public dir set')
    }
    
    WEBPACK_PLUGINS.push(new HtmlWebpackPlugin({
      template: publicDir + '/' + publicIndex,      
    }));
  }

  WEBPACK_PLUGINS = [...WEBPACK_PLUGINS, new webpack.optimize.ModuleConcatenationPlugin(), ...overridePlugins];


  if(isDev && isReport){
    WEBPACK_PLUGINS.push(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,       
    }));
  }

  if(serviceWorkerPath){  
    WEBPACK_AFTER_ACTIONS.push({
      type: 'service_worker',
      actionHandler: serviceWorkerPath
    });      
  }

  if(!!config.copyToDir){      
    WEBPACK_AFTER_ACTIONS.push({
      type: 'copy',
      actionHandler: config.copyToDir
    });  
  }

  if(WEBPACK_AFTER_ACTIONS.length){    
    WEBPACK_PLUGINS.push(new RWSAfterPlugin({ actions: WEBPACK_AFTER_ACTIONS }));
  }

  const cfgExport = {
    entry: {      
      main_rws: config.entry
    },
    mode: isDev ? 'development' : 'production',
    target: 'web',
    devtool: config.devtool || 'source-map',
    output: {
      path: config.outputDir,
      filename: config.outputFileName,
      sourceMapFilename: '[file].map',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: modules_setup,
      alias: {              
        ...aliases
      },      
      plugins: [
        // new TsconfigPathsPlugin({configFile: config.tsConfigPath})
      ]
    },
    module: {
      rules: [  
        {
          test: /\.html$/,
          use: [          
            path.resolve(__dirname, './webpack/rws_fast_html_loader.js')
          ],
        },
        {
          test: /\.css$/,
          use: [          
            'css-loader',
            // path.resolve(__dirname, './webpack/rws_fast_css_loader.js')
          ],
        },
        {
          test: /\.scss$/,
          use: [             
            // 'css-loader',
            path.resolve(__dirname, './webpack/rws_fast_scss_loader.js'),                        
          ],
        },
        {
          test: /\.(ts)$/,
          use: [                       
            {
              loader: 'ts-loader',
              options: {
                allowTsInNodeModules: true,
                configFile: path.resolve(config.tsConfigPath)            
              }
            },
            {
              loader: path.resolve(__dirname, './webpack/rws_fast_ts_loader.js'),        
            }  
          ],
          exclude: /node_modules\/(?!rws-js-client)/,
        }
      ],
    },
    plugins: WEBPACK_PLUGINS,
    optimization: {
      minimizer: [
        new JsMinimizerPlugin(),
        new CssMinimizerPlugin()
      ]
    },    
  }

  if(isHotReload){
    cfgExport.devServer = {
      hot: true,      
      static: publicDir  
    }
  }
  
  return cfgExport;
}

function findFilesWithText(dir, text, ignored = [], fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
      const filePath = path.join(dir, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isDirectory() && !ignored.includes(file)) {
          // Recursively search this directory
          findFilesWithText(filePath, text, ignored, fileList);
      } else if (fileStat.isFile() && filePath.endsWith('.ts')) {
          // Read file content and check for text
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(text)) {
              fileList.push(filePath);
          }
      }
  });

  return fileList;
}

module.exports = RWSWebpackWrapper;