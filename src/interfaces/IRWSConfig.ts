import { IFrontRoutes } from '../services/RoutingService';
import RWSViewComponent from '../components/_component';

export default interface IRWSConfig {
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
    pubUrlPrefix?: string
    dontPushToSW?: boolean
    parted?: boolean
    partedFileDir?: string
    partedPrefix?: string
    routing_enabled?: boolean
    _noLoad?: boolean    
}