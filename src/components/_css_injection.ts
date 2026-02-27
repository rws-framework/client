import { domEvents } from '../events';
import IndexedDBService, { IndexedDBServiceInstance } from '../services/IndexedDBService';
import RWSViewComponent from './_component';

type CSSInjectMode = 'adopted' | 'legacy' | 'both' | 'style-element';

const _DEFAULT_INJECT_CSS_CACHE_LIMIT_DAYS = 1;

interface ICSSInjectionOptions {
    mode?: CSSInjectMode;
    maxDaysExp?: number;
}

interface ICSSInjectionComponent {
    componentElement?: RWSViewComponent;
    shadowRoot: ShadowRoot | null;
    indexedDBService: IndexedDBServiceInstance;
    $emit(eventName: string): void;
}

export class CSSInjectionManager {
    private static CACHED_STYLES: Map<string, CSSStyleSheet> = new Map();
    private static STYLES_OWNER_COMPONENT: ICSSInjectionComponent | null = null;

    static getCachedStyles(styleLinks: string[]): CSSStyleSheet[] {
        return styleLinks
            .filter(link => CSSInjectionManager.CACHED_STYLES.has(link))
            .map(link => CSSInjectionManager.CACHED_STYLES.get(link)!);
    }

    static hasCachedStyles(styleLinks: string[]): boolean {
        return styleLinks.every(link => CSSInjectionManager.CACHED_STYLES.has(link));
    }

    static getStylesOwnerComponent(): ICSSInjectionComponent | null {
        return CSSInjectionManager.STYLES_OWNER_COMPONENT;
    }

    static clearCachedStyles(): void {
        CSSInjectionManager.CACHED_STYLES.clear();
        CSSInjectionManager.STYLES_OWNER_COMPONENT = null;
    }

    static async injectStyles(
        component: ICSSInjectionComponent, 
        styleLinks: string[], 
        options: ICSSInjectionOptions = {}
    ): Promise<void> {

        if (!component.shadowRoot) {
            throw new Error('Component must have a shadow root for CSS injection');
        }

        // Only proceed if there are actually styles to inject
        if (!styleLinks || styleLinks.length === 0) {
            return;
        }

        // Add initial transition styles to host element only when injecting styles
        const transitionSheet = new CSSStyleSheet();
        await transitionSheet.replace(`
            :host {
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }
        `);
        
        component.shadowRoot.adoptedStyleSheets = [
            transitionSheet,
            ...component.shadowRoot.adoptedStyleSheets,
        ];

        const doneAdded = await CSSInjectionManager.addStyleSheets(component, styleLinks, options);        

        if (doneAdded) {
            // Set opacity to 1 to fade in the component
            const opacitySheet = new CSSStyleSheet();
            await opacitySheet.replace(`
                :host {
                    opacity: 1 !important;
                }
            `);
            component.shadowRoot.adoptedStyleSheets = [
                opacitySheet,
                ...component.shadowRoot.adoptedStyleSheets,
            ];

            component.$emit(domEvents.loadedLinkedStyles);
        }
    }

    private static async addStyleSheets(component: ICSSInjectionComponent, styleLinks: string[], options: ICSSInjectionOptions = {}): Promise<boolean>
    {
        const { mode = 'adopted', maxDaysExp } = options;        

        let adoptedSheets: CSSStyleSheet[] = [];
        let doneAdded = false;

        // Check if we already have cached styles from the owner component
        const cachedSheets: CSSStyleSheet[] = [];
        const uncachedLinks: string[] = [];

        let hasCached = false;

        for (const styleLink of styleLinks) {
            if (CSSInjectionManager.CACHED_STYLES.has(styleLink)) {
                cachedSheets.push(CSSInjectionManager.CACHED_STYLES.get(styleLink)!);
                hasCached = true;
            } else {
                uncachedLinks.push(styleLink);
            }
        }

        if(hasCached){
            CSSInjectionManager.setStylesOwner(component);
        }

        // If we have cached styles, use them immediately
        if (cachedSheets.length > 0) {
            adoptedSheets.push(...cachedSheets);
            doneAdded = true;
        }

        // Only process uncached styles
        if (uncachedLinks.length > 0) {
            // Set this component as the owner if no owner exists yet
            CSSInjectionManager.setStylesOwner(component);

            const dbName = 'css-cache';
            const storeName = 'styles';
            const db = await component.indexedDBService.openDB(dbName, storeName);
            const maxAgeMs = 1000 * 60 * 60 * 24; // 24h
            const maxDaysAge = maxDaysExp ? maxDaysExp : _DEFAULT_INJECT_CSS_CACHE_LIMIT_DAYS;
            const maxAgeDays = maxAgeMs * maxDaysAge;

            for (const styleLink of uncachedLinks) {
                const linkMode = Object.keys(RWSViewComponent.FORCE_INJECT_MODE_PER_LINK).includes(styleLink) ? RWSViewComponent.FORCE_INJECT_MODE_PER_LINK[styleLink] : mode;
                
                const loadPromise = new Promise<void>(async (resolve) => {
                    try {
                        if (linkMode === 'legacy') {
                            await CSSInjectionManager.injectLegacyStyle(component, styleLink, () => {
                                doneAdded = true;
                                resolve();
                            });
                        } else if (linkMode === 'style-element') {
                            await CSSInjectionManager.injectStyleElement(component, styleLink, db, storeName, maxAgeDays);
                            doneAdded = true;
                            resolve();
                        } else if (linkMode === 'adopted') {
                            const sheet = await CSSInjectionManager.injectAdoptedStyle(component, styleLink, db, storeName, maxAgeDays);
                            adoptedSheets.push(sheet);
                            doneAdded = true;
                            resolve();
                        } else if (linkMode === 'both') {
                            // Handle both modes
                            const [sheet] = await Promise.all([
                                CSSInjectionManager.injectAdoptedStyle(component, styleLink, db, storeName, maxAgeDays),
                                new Promise<void>((resolveLegacy) => {
                                    CSSInjectionManager.injectLegacyStyle(component, styleLink, () => {
                                        resolveLegacy();
                                    });
                                })
                            ]);
                            adoptedSheets.push(sheet);
                            doneAdded = true;
                            resolve();
                        }
                    } catch (error) {
                        console.error(`Failed to inject styles for ${styleLink}:`, error);
                        resolve();
                    }
                });

                await loadPromise;
            }

            doneAdded = true;
        }

        if (adoptedSheets.length) {
            component.shadowRoot.adoptedStyleSheets = [
                ...adoptedSheets,
                ...component.shadowRoot.adoptedStyleSheets,
            ];

            doneAdded = true;
        }

        return doneAdded;
    }

    private static async injectLegacyStyle(
        component: ICSSInjectionComponent,
        styleLink: string,
        onLoad: () => void
    ): Promise<void> {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleLink;
        link.onload = onLoad;
        component.shadowRoot!.appendChild(link);
    }

    private static async injectStyleElement(
        component: ICSSInjectionComponent,
        styleLink: string,
        db: IDBDatabase,
        storeName: string,
        maxAgeDays: number
    ): Promise<void> {
        const cssText = await CSSInjectionManager.getCachedOrFetchCSS(component, styleLink, db, storeName, maxAgeDays);
        
        if (component.componentElement) {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssText;
            component.componentElement.appendChild(styleElement);
        }
    }

    private static async injectAdoptedStyle(
        component: ICSSInjectionComponent,
        styleLink: string,
        db: IDBDatabase,
        storeName: string,
        maxAgeDays: number
    ): Promise<CSSStyleSheet> {
        const cssText = await CSSInjectionManager.getCachedOrFetchCSS(component, styleLink, db, storeName, maxAgeDays);
        
        const sheet = new CSSStyleSheet();
        await sheet.replace(cssText);
        
        // Cache the stylesheet for future use
        CSSInjectionManager.CACHED_STYLES.set(styleLink, sheet);
        
        return sheet;
    }

    private static async getCachedOrFetchCSS(
        component: ICSSInjectionComponent,
        styleLink: string,
        db: IDBDatabase,
        storeName: string,
        maxAgeDays: number
    ): Promise<string> {
        const entry = await component.indexedDBService.getFromDB(db, storeName, styleLink);
        let cssText: string | null = null;

        if (entry && typeof entry === 'object' && 'css' in entry && 'timestamp' in entry) {
            const expired = Date.now() - entry.timestamp > maxAgeDays;
            if (!expired) {
                cssText = entry.css;
            }
        }

        if (!cssText) {
            cssText = await fetch(styleLink).then(res => res.text());
            await component.indexedDBService.saveToDB(db, storeName, styleLink, {
                css: cssText,
                timestamp: Date.now()
            });
            console.log(`System saved stylesheet: ${styleLink} to IndexedDB`);
        }

        return cssText;
    }

    private static setStylesOwner(component: ICSSInjectionComponent): void {
        if (!CSSInjectionManager.STYLES_OWNER_COMPONENT) {
            CSSInjectionManager.STYLES_OWNER_COMPONENT = component;
            console.log({component});
        }
    }
}

export default CSSInjectionManager;
export { CSSInjectMode, ICSSInjectionOptions, ICSSInjectionComponent };