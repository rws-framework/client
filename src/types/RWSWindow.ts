import { RWSClientInstance } from '../client';
import { Container, InterfaceSymbol } from '../components/_container';

import { RWSPlugin, DefaultRWSPluginOptionsType } from '../plugins/_plugin';
import { v1 as uuid} from 'uuid';
export type RWSWindowComponentInterface = (params?: any) => void;
export type RWSWindowComponentEntry = { interface: RWSWindowComponentInterface, component: any };
export type RWSWindowComponentRegister = { [key: string]: RWSWindowComponentEntry};

export function loadRWSRichWindow(): RWSWindow
{
    const richWindow: RWSWindow = window;

    if(!richWindow.RWS){
        const newNode = document.createElement('main');
        newNode.id = 'rws-cntr-id-' + uuid();
        
        console.log('\x1b[1m[RWS]\x1b[0m Created new container node: ', newNode.id);

        richWindow.RWS = {
            styleLinks: new Set(),
            client: null,
            components: {},
            plugins: {},
            container: null,
            container_node: newNode,
            _registered: {}
        };
    } else {
        // User may have pre-set window.RWS = { styleLinks: ['url', ...] } before the bundle loaded
        // Normalize styleLinks to a Set and fill any missing properties
        const preLinks = richWindow.RWS.styleLinks;
        richWindow.RWS.styleLinks = preLinks
            ? new Set(Array.isArray(preLinks) ? preLinks : [...(preLinks as Set<string>)])
            : new Set();

        if (!richWindow.RWS.client) richWindow.RWS.client = null;
        if (!richWindow.RWS.components) richWindow.RWS.components = {};
        if (!richWindow.RWS.plugins) richWindow.RWS.plugins = {};
        if (!richWindow.RWS.container) richWindow.RWS.container = null;
        if (!richWindow.RWS._registered) richWindow.RWS._registered = {};
        if (!richWindow.RWS.container_node) {
            const newNode = document.createElement('main');
            newNode.id = 'rws-cntr-id-' + uuid();
            console.log('\x1b[1m[RWS]\x1b[0m Created new container node: ', newNode.id);
            richWindow.RWS.container_node = newNode;
        }
    }

    return richWindow;
}

export default interface RWSWindow extends Window {
    RWS?: {
        styleLinks: Set<string> | string[]
        client?: RWSClientInstance
        components: RWSWindowComponentRegister
        plugins: {[key: string]: RWSPlugin<DefaultRWSPluginOptionsType>}
        container: Container | null
        container_node: Element | null
        _registered: {[key: string]: InterfaceSymbol<any>};
    }
}