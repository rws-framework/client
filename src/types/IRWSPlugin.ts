import { DefaultRWSPluginOptionsType, RWSPlugin } from "../plugins/_plugin";
import IRWSUser from "./IRWSUser";
import { Container } from "../components/_container";
import RWSWindow from "./RWSWindow";
import { RWSInfoType } from "../client/components";

export abstract class IRWSPlugin<T extends DefaultRWSPluginOptionsType> {
    abstract onClientStart(): Promise<void>;
    abstract onPartedComponentsLoad(componentParts: RWSInfoType): Promise<void>;
    abstract onComponentsDeclare(): Promise<void>;
    abstract onSetUser(user: IRWSUser): Promise<void>;    
    protected abstract options: T;
    protected abstract container: Container;
    protected abstract window: RWSWindow;
}

export interface IStaticRWSPlugin<T extends DefaultRWSPluginOptionsType> {    
    new (options: T): RWSPlugin<T>;    
}

export interface IPluginSpawnOption<T extends DefaultRWSPluginOptionsType = DefaultRWSPluginOptionsType> { 
    pluginEntry: IStaticRWSPlugin<T>;
    options?: T;
}