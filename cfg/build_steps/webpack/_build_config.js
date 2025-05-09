const chalk = require('chalk');
const path = require('path');

const { RWSConfigBuilder } = require('@rws-framework/console')
const { rwsPath } = require('@rws-framework/console');
const { _DEFAULT_CONFIG } = require('../../_default.cfg');


async function getBuildConfig(rwsFrontBuildConfig, _packageDir){
    const BuildConfigurator = new RWSConfigBuilder(path.join(rwsPath.findPackageDir(process.cwd()), '.rws.json'), {..._DEFAULT_CONFIG, ...rwsFrontBuildConfig});
    const executionDir = rwsPath.relativize(BuildConfigurator.get('executionDir') || rwsFrontBuildConfig.executionDir || process.env.RWS_APP_ROOT || process.cwd(), _packageDir);
    const isWatcher = process.argv.includes('--watch') || false;  

    const isDev = isWatcher ? true : (BuildConfigurator.get('dev', rwsFrontBuildConfig.dev) || false);
    const isReport = BuildConfigurator.get('pkgReport', rwsFrontBuildConfig.pkgReport);
    const isParted = BuildConfigurator.get('parted', rwsFrontBuildConfig.parted || false);
    const hotReload = BuildConfigurator.get('hotReload', rwsFrontBuildConfig.hotReload || false);
    const hotReloadPort = BuildConfigurator.get('hotReloadtPort', rwsFrontBuildConfig.hotReloadPort || 1030);

    const partedPrefix = BuildConfigurator.get('partedPrefix', rwsFrontBuildConfig.partedPrefix);
    const partedDirUrlPrefix = BuildConfigurator.get('partedDirUrlPrefix', rwsFrontBuildConfig.partedDirUrlPrefix);

    let partedComponentsLocations = BuildConfigurator.get('partedComponentsLocations', rwsFrontBuildConfig.partedComponentsLocations);
    const customServiceLocations = BuildConfigurator.get('customServiceLocations', rwsFrontBuildConfig.customServiceLocations); //@todo: check if needed
    const outputDir = rwsPath.relativize(BuildConfigurator.get('outputDir', rwsFrontBuildConfig.outputDir), executionDir);

    const outputFileName = BuildConfigurator.get('outputFileName') || rwsFrontBuildConfig.outputFileName;
    const publicDir = BuildConfigurator.get('publicDir') || rwsFrontBuildConfig.publicDir;
    const serviceWorkerPath = BuildConfigurator.get('serviceWorker') || rwsFrontBuildConfig.serviceWorker;

    const publicIndex = BuildConfigurator.get('publicIndex') || rwsFrontBuildConfig.publicIndex;

    const devTools = isDev ? (BuildConfigurator.get('devtool') || 'source-map') : false;

    const _DEFAULT_DEV_DEBUG = { build: false, timing: false, rwsCache: false, profiling: false };

    let devDebug = isDev ? (BuildConfigurator.get('devDebug') || rwsFrontBuildConfig.devDebug || {}) : {};
    devDebug = {..._DEFAULT_DEV_DEBUG, ...devDebug}

    const devRouteProxy = BuildConfigurator.get('devRouteProxy') || rwsFrontBuildConfig.devRouteProxy;

    const tsConfig = await (BuildConfigurator.get('tsConfig') || rwsFrontBuildConfig.tsConfig)(_packageDir, true);

    const rwsPlugins = {};

    if(rwsFrontBuildConfig.rwsPlugins){
        for(const pluginEntry of rwsFrontBuildConfig.rwsPlugins){
          const pluginBuilder = (await import(`${pluginEntry}/build.js`)).default;      
          rwsPlugins[pluginEntry] = new pluginBuilder(BuildConfigurator, rwsFrontBuildConfig);
        }
      }

    return {
        executionDir,
        isWatcher,
        isDev,
        isReport,
        isParted,
        partedPrefix,
        partedDirUrlPrefix,
        partedComponentsLocations,
        customServiceLocations,
        outputDir,
        outputFileName,
        publicDir,
        serviceWorkerPath,
        publicIndex,
        devTools,
        devDebug,
        devRouteProxy,
        tsConfig,
        rwsPlugins,        
        BuildConfigurator,
        hotReload,
        hotReloadPort
    }
}

module.exports = { getBuildConfig }