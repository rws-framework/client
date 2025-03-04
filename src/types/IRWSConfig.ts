import RWSViewComponent from '../components/_component';
import { IPluginSpawnOption } from './IRWSPlugin';

export type IFrontRoutes = Record<string, unknown>; 
export default interface IRWSConfig {
    [key: string]: any
    dev?: boolean
    defaultLayout?: typeof RWSViewComponent
    backendUrl?: string
    wsUrl?: string
    backendRoutes?: any[]
    apiPrefix?: string
    routes?: IFrontRoutes
    transports?: string[]
    user?: any
    ignoreRWSComponents?: boolean
    pubUrl?: string
    pubUrlFilePrefix?: string
    partedDirUrlPrefix?: string
    dontPushToSW?: boolean
    parted?: boolean,
    rwsDefines?: {[key: string]: any}
    partedFileDir?: string
    partedPrefix?: string
    hotReload?: boolean,
    hotReloadPort?: number,
    plugins?: IPluginSpawnOption<any>[]
    routing_enabled?: boolean
    _noLoad?: boolean    
}