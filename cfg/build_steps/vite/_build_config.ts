import chalk from 'chalk';
import { RWSConfigBuilder, rwsPath } from '@rws-framework/console';
// import { _DEFAULT_CONFIG } from '../../_default.cfg';

import { IPluginSpawnOption, IRWSPlugin, IStaticRWSPlugin } from '../../../src/types/IRWSPlugin';

interface IRWSViteConfig {
  executionDir: string;
  isWatcher: boolean;
  isDev: boolean;
  isHotReload: boolean;
  isReport: boolean;
  isParted: boolean;
  partedPrefix?: string | null;
  partedDirUrlPrefix?: string | null;
  partedComponentsLocations?: string[];
  customServiceLocations?: string[];
  outputDir: string;
  outputFileName: string;
  publicDir?: string | null;
  serviceWorkerPath?: string | null,
  publicIndex?: string | null,
  devTools?: string | null,
  devDebug?: any,
  devRouteProxy?: any,
  tsConfigPath: string,
  rwsPlugins?: IPluginSpawnOption<any>[],
  _packageDir?: string,
  BuildConfigurator: RWSConfigBuilder<any>
}

async function getBuildConfig(rwsFrontBuildConfig: Partial<IRWSViteConfig>): Promise<IRWSViteConfig>
{
    const BuildConfigurator = new RWSConfigBuilder(rwsPath.findPackageDir(process.cwd()) + '/.rws.json', {...rwsFrontBuildConfig});
    const _packageDir = rwsPath.findPackageDir(process.cwd());

    const executionDir = rwsPath.relativize(BuildConfigurator.get('executionDir') || rwsFrontBuildConfig.executionDir || process.cwd(), _packageDir);
    const isWatcher = process.argv.includes('--watch') || false;  

    const isDev = isWatcher ? true : (BuildConfigurator.get('dev', rwsFrontBuildConfig.isDev) || false);
    const isHotReload = BuildConfigurator.get('isHotReload', rwsFrontBuildConfig.isHotReload);
    const isReport = BuildConfigurator.get('isReport', rwsFrontBuildConfig.isReport);
    const isParted = BuildConfigurator.get('isParted', rwsFrontBuildConfig.isParted || false);

    const partedPrefix = BuildConfigurator.get('partedPrefix', rwsFrontBuildConfig.partedPrefix);
    const partedDirUrlPrefix = BuildConfigurator.get('partedDirUrlPrefix', rwsFrontBuildConfig.partedDirUrlPrefix);

    let partedComponentsLocations = BuildConfigurator.get('partedComponentsLocations', rwsFrontBuildConfig.partedComponentsLocations);
    const customServiceLocations = BuildConfigurator.get('customServiceLocations', rwsFrontBuildConfig.customServiceLocations); //@todo: check if needed
    const outputDir = rwsPath.relativize(BuildConfigurator.get('outputDir', rwsFrontBuildConfig.outputDir), _packageDir);

    const outputFileName = BuildConfigurator.get('outputFileName') || rwsFrontBuildConfig.outputFileName;
    const publicDir = BuildConfigurator.get('publicDir') || rwsFrontBuildConfig.publicDir;
    const serviceWorkerPath = BuildConfigurator.get('serviceWorkerPath') || rwsFrontBuildConfig.serviceWorkerPath;

    const publicIndex = BuildConfigurator.get('publicIndex') || rwsFrontBuildConfig.publicIndex;

    const devTools = isDev ? (BuildConfigurator.get('devtool') || 'source-map') : false;

    const _DEFAULT_DEV_DEBUG = { build: false, timing: false, rwsCache: false, profiling: false };

    let devDebug = isDev ? (BuildConfigurator.get('devDebug') || rwsFrontBuildConfig.devDebug || {}) : {};
    devDebug = {..._DEFAULT_DEV_DEBUG, ...devDebug}

    const devRouteProxy = BuildConfigurator.get('devRouteProxy') || rwsFrontBuildConfig.devRouteProxy;

    const tsConfigPath = rwsPath.relativize(BuildConfigurator.get('tsConfigPath') || rwsFrontBuildConfig.tsConfigPath, executionDir);

    const rwsPlugins: IPluginSpawnOption<any>[] = [];

    // if(rwsFrontBuildConfig.rwsPlugins){
    //     for(const pluginEntry of Object.values(rwsFrontBuildConfig.rwsPlugins)){
    //       const pluginBuilder = (await import(`${pluginEntry}`)).default as IStaticRWSPlugin<any>;      
    //       rwsPlugins[pluginEntry] = new pluginBuilder(BuildConfigurator, rwsFrontBuildConfig);
    //     }
    //   }

    return {
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
        tsConfigPath,
        rwsPlugins,
        _packageDir,
        BuildConfigurator
    }
}

export { getBuildConfig }