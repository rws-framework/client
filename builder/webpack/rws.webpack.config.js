const { rwsPath } = require('@rws-framework/console');
const path = require('path');
const chalk = require('chalk');

const RWSWebpackPlugin = require('./rws_webpack_plugin');

const buildInfo = require('../../cfg/build_steps/webpack/_info');
const { loadAliases } = require('../../cfg/build_steps/webpack/_aliases');
const { timingStart, timingStop, timeLog, toggleLogging } = require('../../cfg/build_steps/webpack/_timing');
const { getRWSProductionSetup } = require('../../cfg/build_steps/webpack/_production');
const { rwsExternals } = require('../../cfg/build_steps/webpack/_rws_externals');

const tools = require('../../_tools');
const { setComponentsChunks, scanComponents, generateRWSInfoFile, partedComponentsEvents } = require('../../cfg/build_steps/webpack/_component_handling');
const { getBuildConfig } = require('../../cfg/build_steps/webpack/_build_config');
const { createWebpackConfig } = require('../../cfg/build_steps/webpack/_webpack_config');
const { executeRWSStartActions, timingActions, devActions } = require('../../cfg/build_steps/webpack/_actions');
const { webpackDevServer } = require('../../cfg/build_steps/webpack/_dev_servers');
const { RWS_WEBPACK_PLUGINS_BAG, addStartPlugins } = require('../../cfg/build_steps/webpack/_plugins');


// #SECTION INIT OPTIONS

const RWSWebpackWrapper = async (appRoot, rwsFrontendConfig,  _packageDir) => {
  const _MAIN_PACKAGE = rwsPath.findRootWorkspacePath(appRoot);

  const {
    executionDir,
    isWatcher,
    isDev,
    isHotReload,
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
    BuildConfigurator
  } = await getBuildConfig(rwsFrontendConfig, _packageDir);

  timeLog({ devDebug });

  if (devDebug?.timing) {
    timingStart('build config');
  }  

  rwsPath.removeDirectory(outputDir, true);
  buildInfo.start(executionDir, tsConfig, outputDir, isDev, publicDir, isParted, partedPrefix, partedDirUrlPrefix, devTools, rwsFrontendConfig.rwsPlugins);

  // #SECTION INIT PLUGINS && ENV VARS DEFINES
  addStartPlugins(rwsFrontendConfig, BuildConfigurator, devDebug, isHotReload, isReport);

  const WEBPACK_AFTER_ACTIONS = rwsFrontendConfig.actions || [];
  const WEBPACK_AFTER_ERROR_ACTIONS = rwsFrontendConfig.error_actions || [];

  const modules_setup = [path.join(_packageDir, 'node_modules'), path.join(executionDir, 'node_modules'), path.join(tools.findRootWorkspacePath(appRoot), 'node_modules')];
  let optimConfig = null;
  let aliases = rwsFrontendConfig.aliases || {};
  aliases = { ...aliases, ...loadAliases(_packageDir, tsConfig,path.resolve(_MAIN_PACKAGE, 'node_modules'), executionDir) }  

  // #SECTION PLUGIN STARTING HOOKS

  executeRWSStartActions(WEBPACK_AFTER_ACTIONS, serviceWorkerPath, BuildConfigurator, rwsFrontendConfig);

  if (devDebug?.timing) {
    timingStop('build config');
  }


   // #SECTION RWS COMPONENT SCAN && PARTED PROCESSING
  const RWSComponents = scanComponents(await partedComponentsEvents(partedComponentsLocations, rwsPlugins, isParted), executionDir, _packageDir);
  console.log(`${chalk.cyanBright('RWS Scanned')} ${chalk.yellowBright(RWSComponents.length)} components`);
  const { automatedChunks, automatedEntries } = setComponentsChunks(rwsFrontendConfig.entrypoint, RWSComponents, isParted);

  // #SECTION RWS INFO FILE
  generateRWSInfoFile(outputDir, automatedEntries);
  console.log(chalk.greenBright(`RWSInfo file generated.`));


  if (!isDev) {
    // #SECTION RWS PROD SETUP

    if (!optimConfig) {
      optimConfig = {};
    }

    optimConfig = getRWSProductionSetup(optimConfig, tsConfigPath);
  }

  // #SECTION RWS DEV ACTIONS
  const devExternalsVars = devActions(WEBPACK_AFTER_ACTIONS, executionDir, devDebug);
  timingActions(WEBPACK_AFTER_ACTIONS, WEBPACK_AFTER_ERROR_ACTIONS, devDebug);

  // #SECTION RWS WEBPACK PLUGIN INIT
  if (WEBPACK_AFTER_ACTIONS.length || WEBPACK_AFTER_ERROR_ACTIONS.length) {
    RWS_WEBPACK_PLUGINS_BAG.add(new RWSWebpackPlugin({
      actions: WEBPACK_AFTER_ACTIONS, 
      error_actions: WEBPACK_AFTER_ERROR_ACTIONS, 
      dev: isDev,
      devDebug,
      appRoot 
    }));
  }

  // #SECTION RWS WEBPACK BUILD
  const cfgExport = await createWebpackConfig({
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
    WEBPACK_PLUGINS: RWS_WEBPACK_PLUGINS_BAG.getPlugins(),
    rwsExternals,
    devExternalsVars,
    appRootDir: appRoot,
    entrypoint: rwsFrontendConfig.entrypoint
});  

  if (optimConfig) {
    // setup production config if it got created above
    cfgExport.optimization = optimConfig;
  }

  // #SECTION RWS PLUGINS onBuild EVENTS FIRE
  for (const pluginKey of Object.keys(rwsPlugins)) {
    const plugin = rwsPlugins[pluginKey];
    await plugin.onBuild(cfgExport);
  }

  if (isDev) {
    // #SECTION RWS DEV SERVERS
    webpackDevServer(BuildConfigurator, rwsFrontendConfig, cfgExport);
  }  

  return cfgExport;
}



module.exports = RWSWebpackWrapper;