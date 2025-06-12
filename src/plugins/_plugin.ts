import RWSContainer from "../components/_container";
import { Container } from "../components/_container";
import RWSWindow, {loadRWSRichWindow } from '../types/RWSWindow';
import IRWSUser from "../types/IRWSUser";
import { RWSInfoType } from "../client/components";
import { IRWSPlugin, IStaticRWSPlugin } from "../types/IRWSPlugin";

export type DefaultRWSPluginOptionsType = { enabled?: boolean };
type PluginInfoType = { name: string };
type PluginConstructor<T extends DefaultRWSPluginOptionsType> = new (options: T) => RWSPlugin<T>;

abstract class RWSPlugin<T extends DefaultRWSPluginOptionsType> extends IRWSPlugin<T> {
    protected isLoaded: boolean = false;
    protected options!: T;
    protected container!: Container;    
    protected window!: RWSWindow;

    static container: Container;    
    static window: RWSWindow;

    constructor(options: T = { enabled: true } as T) {
        super();
        this.isLoaded = true;
        this.container = RWSPlugin.container;
        this.window = RWSPlugin.window;
        this.options = options;
    }

    async onClientStart(): Promise<void> {
        // Implementation
    }

    async onPartedComponentsLoad(componentParts: RWSInfoType): Promise<void> {
        // Implementation
    }

    async onComponentsDeclare(): Promise<void> {
        // Implementation
    }

    async onSetUser(user: IRWSUser): Promise<void> {
        // Implementation
    }
    
    static getPlugin<P extends RWSPlugin<T>, T extends DefaultRWSPluginOptionsType = DefaultRWSPluginOptionsType>(
        pluginClass: IStaticRWSPlugin<T>
    ): P | null {
        const plugin = this.window.RWS.plugins[pluginClass.name];
        return plugin ? plugin as P : null;
    }

    static getAllPlugins(): Array<RWSPlugin<DefaultRWSPluginOptionsType>> {
        return Object.keys(this.window.RWS.plugins)
            .map((key) => this.window.RWS.plugins[key]);
    }
}

RWSPlugin.window = loadRWSRichWindow();
RWSPlugin.container = RWSContainer();

export { RWSPlugin };