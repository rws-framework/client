const { getRWSHotReloadSetup } = require('./_hot_reload');
const { getRWSLoaders } = require('./_loaders');
const webpack = require('webpack');


async function createWebpackConfig({
    executionDir,
    _packageDir,
    isDev,
    devTools,
    devDebug,
    isParted,
    partedPrefix,
    outputDir,
    outputFileName,
    automatedChunks,
    modules_setup,
    aliases,
    tsConfig,
    WEBPACK_PLUGINS,
    rwsExternals,
    devExternalsVars,
    appRootDir,
    entrypoint,
    hotReload,
    hotReloadPort
}) { 

    if(hotReload){
        WEBPACK_PLUGINS.push(new webpack.HotModuleReplacementPlugin());
    }

    return {
        context: executionDir,
        entry: {
            ...automatedChunks
        },
        mode: isDev ? 'development' : 'production',
        target: 'web',
        devtool: devTools,
        output: {
            path: outputDir,
            filename: isParted ? (partedPrefix || 'rws') + '.[name].js' : outputFileName,
            sourceMapFilename: '[file].map',
        },
        resolve: {
            extensions: ['.ts', '.js', '.scss', '.css'],
            modules: modules_setup,
            alias: {
                ...aliases
            },
            fallback: {                
                fs: false,
                path: false
            }
        },
        devServer: hotReload ? getRWSHotReloadSetup(hotReloadPort, outputDir) : null,
        module: {
            rules: getRWSLoaders(_packageDir, executionDir, tsConfig, appRootDir, entrypoint),
        },
        plugins: WEBPACK_PLUGINS,
        // externals: rwsExternals(_packageDir, executionDir, modules_setup, automatedChunks, {
        //     _vars: devExternalsVars
        // })      
    }
}

module.exports = { createWebpackConfig }