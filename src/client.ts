import IRWSConfig from './types/IRWSConfig';

import RWSNotify from './types/RWSNotify';

import ConfigService, { ConfigServiceInstance } from './services/ConfigService';
import UtilsService, { UtilsServiceInstance } from './services/UtilsService';
import DOMService, { DOMServiceInstance } from './services/DOMService';
import ApiService, { ApiServiceInstance } from './services/ApiService';
import NotifyService, { NotifyServiceInstance } from './services/NotifyService';

import ServiceWorkerService, { ServiceWorkerServiceInstance } from './services/ServiceWorkerService';
import { IBackendRoute } from './services/ApiService';
import IRWSUser from './types/IRWSUser';
import RWSWindow, { RWSWindowComponentRegister, loadRWSRichWindow } from './types/RWSWindow';

import { DI, Container, Registration } from './components/_container';

import RWSContainer from './components/_container';
import TheRWSService from './services/_service';

import ComponentHelper, { ComponentHelperStatic, RWSInfoType } from './client/components';
import ServicesHelper from './client/services';
import ConfigHelper from './client/config';
import HotReloadHelper, { IHotReloadCfg, _DEFAULT_HR_PORT } from './client/hotReload';
import { DefaultRWSPluginOptionsType, RWSPlugin } from './plugins/_plugin';
import { IStaticRWSPlugin } from './types/IRWSPlugin'


type RWSEventListener = (event: CustomEvent) => void;

class RWSClient {
    protected _container: Container;
    protected user: IRWSUser = null;
    
    protected config: IRWSConfig = {};
    protected plugins: {[key: string]: RWSPlugin<DefaultRWSPluginOptionsType>} = {}
    protected isSetup = false;
    protected devStorage: { [key: string]: any } = {};    
    protected customServices: { [serviceName: string]: TheRWSService} = {};
    protected defaultServices: { [serviceName: string]: TheRWSService} = {};
    protected hrSetup: IHotReloadCfg = { enabled: false, port: _DEFAULT_HR_PORT }

    private componentHelper = ComponentHelper.bind(this)();
    private servicesHelper = ServicesHelper.bind(this)();
    private configHelper = ConfigHelper.bind(this)();
    private hotReloadHelper = HotReloadHelper.bind(this)();


    protected initCallback: () => Promise<void> = async () => { };    

    constructor(
        @ConfigService public appConfig: ConfigServiceInstance,        
        @DOMService public domService: DOMServiceInstance,
        @UtilsService public utilsService: UtilsServiceInstance,
        @ApiService public apiService: ApiServiceInstance,
        @ServiceWorkerService public swService: ServiceWorkerServiceInstance,
        @NotifyService public notifyService: NotifyServiceInstance
    ) {
        this._container = RWSContainer();
        this.user = this.getUser();      
        
        this.loadServices();

        this.config.plugins = [];
        this.pushDataToServiceWorker('SET_WS_URL', { url: this.appConfig.get('wsUrl') }, 'ws_url');

        if (this.user) {
            this.pushUserToServiceWorker({ ...this.user, instructor: false });
        }        
    }

    addPlugin<T extends DefaultRWSPluginOptionsType>(pluginEntry: IStaticRWSPlugin<T>, options?: T)
    {        
        this.config.plugins.push({pluginEntry, options});
    }

    async setup(config: IRWSConfig = {}): Promise<IRWSConfig> {
        return this.configHelper.setup(config);
    }

    async start(config: IRWSConfig = {}): Promise<RWSClient> {
        return this.configHelper.start(config);
    }

    private loadServices(){
        return this.servicesHelper.loadServices();
    }

    get(key: string): any | null
    {
        return this.configHelper.get(key);
    }    

    setNotifier(notifier: RWSNotify): RWSClient {
        this.notifyService.setNotifier(notifier);

        return this;
    }

    setDefaultLayout(DefaultLayout: any): RWSClient {
        this.config.defaultLayout = DefaultLayout;

        return this;
    }

    setBackendRoutes(routes: IBackendRoute[]): RWSClient {
        this.config.backendRoutes = routes;
        this.appConfig.set('backendRoutes', routes);
        return this;
    }

    async onInit(callback: () => Promise<void>): Promise<RWSClient> {
        this.initCallback = callback;

        for (const plugin of RWSPlugin.getAllPlugins()){
            plugin.onComponentsDeclare();
        }

        return this;
    }

    pushDataToServiceWorker(type: string, data: any, asset_type: string = 'data_push'): void {
        this.configHelper.pushDataToServiceWorker(type, data, asset_type);

    }

    pushUserToServiceWorker(userData: any) {
        this.configHelper.pushUserToServiceWorker(userData);
    }

    getUser(): IRWSUser {
        return this.configHelper.getUser();
    }

    setUser(user: IRWSUser): RWSClient {
        return this.configHelper.setUser(user);
    }

    getConfig(): ConfigServiceInstance {
        return this.appConfig;
    }

    on<T>(eventName: string, listener: RWSEventListener): void {
        document.addEventListener(eventName, (event: Event) => {
            listener(event as CustomEvent<T>);
        });
    }

    setDevStorage(key: string, stuff: any): RWSClient {
        this.devStorage[key] = stuff;
        return this;
    }

    getDevStorage(key: string): any {
        return this.devStorage[key];
    }

    registerToDI(): void {

    }

    async loadPartedComponents(): Promise<RWSInfoType> {
        return this.componentHelper.loadPartedComponents();
    }   
    
    async onDOMLoad(): Promise<void> {
        return this.domService.onDOMLoad()
    }

    assignClientToBrowser(): void {
        this.getBrowserObject().RWS.client = this;
    }

    enableRouting(): void {
        this.appConfig.mergeConfig({ routing_enabled: true });
    }

    disableRouting(): void {
        this.appConfig.mergeConfig({ routing_enabled: false });
    }

    private getBrowserObject(): RWSWindow {
        loadRWSRichWindow();
        return window;
    }

    static getDI(): typeof DI {
        return DI;
    }

    static defineAllComponents() {
        ComponentHelperStatic.defineAllComponents();
    }

    
    defineComponents(){
        ComponentHelperStatic.defineAllComponents();
    }

    
    logout(){
        this.user = null;
        localStorage.removeItem('the_rws_user');
    }
}

export default DI.createInterface<RWSClient>(x => x.singleton(RWSClient));
export {  RWSClient as RWSClientInstance };