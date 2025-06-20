import { ViewTemplate, ElementStyles, observable, html, Constructable, PartialFASTElementDefinition, attr, Observable } from '@microsoft/fast-element';
import { FoundationElement, FoundationElementDefinition, FoundationElementRegistry, OverrideFoundationElementDefinition } from '../../foundation/rws-foundation';
import ConfigService, { ConfigServiceInstance } from '../services/ConfigService';
import UtilsService, { UtilsServiceInstance } from '../services/UtilsService';
import DOMService, { DOMServiceInstance, DOMOutputType } from '../services/DOMService';
import ApiService, { ApiServiceInstance } from '../services/ApiService';
import NotifyService, { NotifyServiceInstance } from '../services/NotifyService';
import IndexedDBService, { IndexedDBServiceInstance } from '../services/IndexedDBService';
import { IRWSViewComponent, IAssetShowOptions } from '../types/IRWSViewComponent';
import RWSWindow, { RWSWindowComponentInterface, loadRWSRichWindow } from '../types/RWSWindow';
import { applyConstructor, RWSInject } from './_decorator';
import TheRWSService from '../services/_service';
import { handleExternalChange } from './_attrs/_external_handler';
import { IFastDefinition, isDefined, defineComponent, getDefinition } from './_definitions';
import { on, $emitDown, observe, sendEventToOutside } from './_event_handling';
import { domEvents } from '../events';

type ComposeMethodType<
    T extends FoundationElementDefinition,
    K extends Constructable<RWSViewComponent>
> = (this: K, elementDefinition: T) => (overrideDefinition?: OverrideFoundationElementDefinition<T>) => FoundationElementRegistry<FoundationElementDefinition, T>;

type CSSInjectMode = 'adopted' | 'legacy' | 'both';

const _DEFAULT_INJECT_CSS_CACHE_LIMIT_DAYS = 1;

export interface IWithCompose<T extends RWSViewComponent> {
    [key: string]: any
    new(...args: any[]): T;
    definition?: IFastDefinition
    defineComponent: <T extends RWSViewComponent>(this: IWithCompose<T>) => void
    isDefined<T extends RWSViewComponent>(this: IWithCompose<T>): boolean
    compose: ComposeMethodType<FoundationElementDefinition, Constructable<T>>;
    define<TType extends (...params: any[]) => any>(type: TType, nameOrDef?: string | PartialFASTElementDefinition | undefined): TType;
    _verbose: boolean;
    _toInject: { [key: string]: TheRWSService };
    _depKeys: { [key: string]: string[] };
    _externalAttrs: { [key: string]: string[] };
    setExternalAttr: (componentName: string, key: string) => void
    sendEventToOutside: <T>(eventName: string, data: T) => void
    _EVENTS: {
        component_define: string,
        component_parted_load: string,
    }
}

abstract class RWSViewComponent extends FoundationElement implements IRWSViewComponent {
    __isLoading: boolean = true;
    __exAttrLoaded: string[] = [];
    private static instances: RWSViewComponent[] = [];
    static fileList: string[] = [];

    @attr routeParams: Record<string, string> = {};

    static autoLoadFastElement = true;
    static _defined: { [key: string]: boolean } = {};
    static _toInject: { [key: string]: TheRWSService } = {};
    static _depKeys: { [key: string]: string[] } = { _all: [] };
    static _externalAttrs: { [key: string]: string[] } = {};
    static _verbose: boolean = false;

    private static FORCE_INJECT_STYLES?: string[] = [];
    private static FORCE_INJECT_MODE?: CSSInjectMode = 'adopted';

    static _EVENTS = {
        component_define: 'rws:lifecycle:defineComponent',
        component_parted_load: 'rws:lifecycle:loadPartedComponents',
    }

    @RWSInject(IndexedDBService, true) protected indexedDBService: IndexedDBServiceInstance;
    @RWSInject(ConfigService, true) protected config: ConfigServiceInstance;
    @RWSInject(DOMService, true) protected domService: DOMServiceInstance;
    @RWSInject(UtilsService, true) protected utilsService: UtilsServiceInstance;
    @RWSInject(ApiService, true) protected apiService: ApiServiceInstance;
    @RWSInject(NotifyService, true) protected notifyService: NotifyServiceInstance;

    @observable trashIterator: number = 0;
    @observable fileAssets: {
        [key: string]: ViewTemplate
    } = {};

    constructor() {
        super();
        applyConstructor(this);
    }

    connectedCallback() {
        super.connectedCallback();
        applyConstructor(this);

        if (!(this.constructor as IWithCompose<this>).definition && (this.constructor as IWithCompose<this>).autoLoadFastElement) {
            throw new Error('RWS component is not named. Add `static definition = {name, template};`');
        }

        this.applyFileList();

        if (RWSViewComponent.FORCE_INJECT_STYLES) {
            this.injectStyles(RWSViewComponent.FORCE_INJECT_STYLES, RWSViewComponent.FORCE_INJECT_MODE);
        }

        RWSViewComponent.instances.push(this);
    }

    passRouteParams(routeParams: Record<string, string> = null) {
        if (routeParams) {
            this.routeParams = routeParams;
        }
    }

    showAsset(assetName: string, options: IAssetShowOptions = {}): ViewTemplate<any, any> {

        if (!this.fileAssets[assetName]) {
            return html`<span></span>`;
            throw new Error(`File asset "${assetName}" not declared in component "${(this.constructor as IWithCompose<this>).definition.name}"`);
        }

        return this.fileAssets[assetName];
    }

    on<T>(type: string, listener: (event: CustomEvent<T>) => any) {
        return on.bind(this)(type, listener);
    }

    $emitDown<T>(eventName: string, payload: T) {
        return $emitDown.bind(this)(eventName, payload);
    }

    observe(callback: (component: RWSViewComponent, node: Node, observer: MutationObserver) => Promise<void>, condition: (component: RWSViewComponent, node: Node) => boolean = null, observeRemoved: boolean = false) {
        return observe.bind(this)(callback, condition, observeRemoved);
    }

    parse$<T extends Element>(input: NodeListOf<T>, directReturn: boolean = false): DOMOutputType<T> {
        return this.domService.parse$<T>(input, directReturn);
    }

    $<T extends Element>(selectors: string, directReturn: boolean = false): DOMOutputType<T> {
        return this.domService.$<T>(this.getShadowRoot(), selectors, directReturn);
    }

    async loadingString<T, C>(item: T, addContent: (cnt: C | { output: string }, paste?: boolean, error?: boolean) => void, shouldStop: (stopItem: T, addContent: (cnt: C | { output: string }, paste?: boolean, error?: boolean) => void) => Promise<boolean>) {
        let dots = 1;
        const maxDots = 3; // Maximum number of dots
        const interval = setInterval(async () => {
            const dotsString = '. '.repeat(dots);

            const doesItStop = await shouldStop(item, addContent);

            if (doesItStop) {
                addContent({ output: '' }, true);
                clearInterval(interval);
            } else {
                addContent({ output: `${dotsString}` }, true);

                dots = (dots % (maxDots)) + 1;
            }
        }, 500);
    }

    async onDOMLoad(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.getShadowRoot() !== null && this.getShadowRoot() !== undefined) {
                resolve();
            } else {
                // If shadowRoot is not yet available, use MutationObserver to wait for it
                const observer = new MutationObserver(() => {
                    if (this.getShadowRoot() !== null && this.getShadowRoot() !== undefined) {
                        observer.disconnect();
                        resolve();
                    }
                });
                observer.observe(this, { childList: true, subtree: true });
            }
        });
    }


    protected getShadowRoot(): ShadowRoot {
        const shRoot: ShadowRoot | null = this.shadowRoot;

        if (!shRoot) {
            throw new Error(`Component ${(this.constructor as IWithCompose<this>).definition.name} lacks shadow root. If you wish to have component without shadow root extend your class with FASTElement`);
        }

        return shRoot;
    }

    forceReload() {
        this.trashIterator += 1;
    }

    hotReplacedCallback() {
        this.forceReload();
    }

    sendEventToOutside<T>(eventName: string, data: T) {
        sendEventToOutside(eventName, data);
    }

    static sendEventToOutside<T>(eventName: string, data: T) {
        sendEventToOutside(eventName, data);
    }

    static injectStyles(linkedStyles: string[], mode?: CSSInjectMode) {
        if (mode) {
            RWSViewComponent.FORCE_INJECT_MODE = mode;
        }

        RWSViewComponent.FORCE_INJECT_STYLES = linkedStyles;
    }

    private applyFileList(): void {
        try {
            (this.constructor as IWithCompose<this>).fileList.forEach((file: string) => {
                if (this.fileAssets[file]) {
                    return;
                }
                this.apiService.pureGet(this.config.get('pubUrlFilePrefix') + file).then((response: string) => {
                    this.fileAssets = { ...this.fileAssets, [file]: html`${response}` };
                });
            });

        } catch (e: Error | any) {
            console.error('Error loading file content:', e.message);
            console.error(e.stack);
        }
    }

    static setExternalAttr(componentName: string, key: string) {
        if (!Object.keys(RWSViewComponent._externalAttrs).includes(componentName)) {
            RWSViewComponent._externalAttrs[componentName] = [];
        }

        RWSViewComponent._externalAttrs[componentName].push(key);
    }

    static hotReplacedCallback() {
        this.getInstances().forEach(instance => instance.forceReload());
    }

    static isDefined<T extends RWSViewComponent>(this: IWithCompose<T>): boolean {
        return isDefined<T>(this);
    }

    static defineComponent<T extends RWSViewComponent>(this: IWithCompose<T>): void {
        return defineComponent<T>(this);
    }

    static getDefinition(tagName: string, htmlTemplate: ViewTemplate, styles: ElementStyles = null) {
        return getDefinition(tagName, htmlTemplate, styles);
    }

    private static getInstances(): RWSViewComponent[] {
        return RWSViewComponent.instances;
    }

    protected async injectStyles(styleLinks: string[], mode: CSSInjectMode = 'adopted', maxDaysExp?: number) {
        const dbName = 'css-cache';
        const storeName = 'styles';
        const db = await this.indexedDBService.openDB(dbName, storeName);
        const maxAgeMs = 1000 * 60 * 60 * 24; // 24h
        const maxDaysAge = maxDaysExp ? maxDaysExp : _DEFAULT_INJECT_CSS_CACHE_LIMIT_DAYS;
        const maxAgeDays = maxAgeMs * maxDaysAge;

        let adoptedSheets: CSSStyleSheet[] = [];

        let doneAdded = false;

        for (const styleLink of styleLinks) {
            const loadPromise = new Promise<void>(async (resolve, reject) => {
                if (mode === 'legacy' || mode === 'both') {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleLink;
                    this.getShadowRoot().appendChild(link);
    
                    link.onload = () => {
                        doneAdded = true;

                        if(mode === 'legacy'){
                            resolve();
                        }
                    };
                }

                if (mode === 'adopted' || mode === 'both') {
                    const entry = await this.indexedDBService.getFromDB(db, storeName, styleLink);

                    let cssText: string | null = null;

                    if (entry && typeof entry === 'object' && 'css' in entry && 'timestamp' in entry) {
                        const expired = Date.now() - entry.timestamp > maxAgeDays;
                        if (!expired) {
                            cssText = entry.css;
                        }
                    }

                    if (!cssText) {
                        cssText = await fetch(styleLink).then(res => res.text());
                        await this.indexedDBService.saveToDB(db, storeName, styleLink, {
                            css: cssText,
                            timestamp: Date.now()
                        });
                        console.log(`System saved stylesheet: ${styleLink} to IndexedDB`)
                    }

                    const sheet = new CSSStyleSheet();
                    await sheet.replace(cssText);

                    adoptedSheets.push(sheet);

                    if(mode === 'adopted' || mode === 'both'){
                        resolve();
                    }
                }
            });

            await loadPromise;
        }

        if (adoptedSheets.length) {
            this.getShadowRoot().adoptedStyleSheets = [
                ...adoptedSheets,
                ...this.getShadowRoot().adoptedStyleSheets,
            ];

            doneAdded = true;
        }

        if (doneAdded) {
            this.$emit(domEvents.loadedLinkedStyles);
        }
    }
}

export default RWSViewComponent;

export { RWSViewComponent };

export type {
    IAssetShowOptions,
    IRWSViewComponent
} from '../types/IRWSViewComponent';