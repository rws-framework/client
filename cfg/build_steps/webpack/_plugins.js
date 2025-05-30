const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { processEnvDefines } = require('./_env_defines');
const path = require('path');
const fs = require('fs');

const RWS_WEBPACK_PLUGINS_BAG = {
    _plugins: [],
    add(plugin) {
        if (Array.isArray(plugin)) {
            if (!plugin.length) {
                return;
            }

            plugin.forEach((item) => {
                RWS_WEBPACK_PLUGINS_BAG.add(item);
            })
        } else {
            if (!plugin) {
                return;
            }

            if (!this._plugins.includes(plugin)) {
                this._plugins.push(plugin);
            }
        }
    },
    getPlugins() {
        return this._plugins
    }
}

function getPackageModPlugins() {
    return [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-gb/),
        new webpack.IgnorePlugin({
            resourceRegExp: /.*\.es6\.js$/,
            contextRegExp: /node_modules/
        }),
    ]
}

function getDefinesPlugins(BuildConfigurator, rwsFrontendConfig, devDebug) {
    const _rws_defines = processEnvDefines(BuildConfigurator, rwsFrontendConfig, devDebug);

    return [
        new webpack.DefinePlugin(_rws_defines)
    ]
}

function getBuilderDevPlugins(BuildConfigurator, rwsFrontendConfig, devDebug) {        
    const plugins = [];
    

    if(devDebug?.profiling){
        const profiling = new webpack.debug.ProfilingPlugin({
            outputPath: path.resolve(BuildConfigurator.get('executionDir'), BuildConfigurator.get('outputDir') || rwsFrontendConfig.outputDir, '.profiling/profileEvents.json'),
        });
        plugins.push(profiling);

        class FileListPlugin {
            apply(compiler) {
              compiler.hooks.done.tap('FileListPlugin', (stats) => {
                const files = [];
                stats.compilation.modules.forEach(module => {
                  if (module.resource) {
                    files.push(module.resource);
                  }
                });
          
                const output = `// Generated on ${new Date().toISOString()}\n` +
                               `// Total files processed: ${files.length}\n\n` +
                               `module.exports = ${JSON.stringify(files, null, 2)};\n`;
          
                const reportPath = path.join(BuildConfigurator.get('executionDir'), 'processed-files.js');
    
                fs.writeFileSync(
                  reportPath, 
                  output
                );
          
                console.log(`\n[FileListPlugin] Saved ${files.length} processed files to ${reportPath}`);
              });
            }
        }

        plugins.push(new FileListPlugin());
    }
    
    return plugins;
}

function getBuilderOptimPlugins(BuildConfigurator, rwsFrontendConfig) {
    return [
        
    ]
}

function addStartPlugins(rwsFrontendConfig, BuildConfigurator, devDebug, isHotReload, isReport) {

    RWS_WEBPACK_PLUGINS_BAG.add([
        ...getDefinesPlugins(BuildConfigurator, rwsFrontendConfig, devDebug),
        ...getBuilderDevPlugins(BuildConfigurator, rwsFrontendConfig, devDebug),
        ...getBuilderOptimPlugins(BuildConfigurator, rwsFrontendConfig),
        ...getPackageModPlugins()
    ]);

    const overridePlugins = rwsFrontendConfig.plugins || []

    RWS_WEBPACK_PLUGINS_BAG.add(overridePlugins);

    if (isReport) {
        RWS_WEBPACK_PLUGINS_BAG.add(new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
        }));
    }
}

module.exports = { RWS_WEBPACK_PLUGINS_BAG, addStartPlugins };