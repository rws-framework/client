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

        const doneAdded = await CSSInjectionManager.addConstructedStyleSheets(component, styleLinks, options);

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

    private static async addConstructedStyleSheets(component: ICSSInjectionComponent, styleLinks: string[], options: ICSSInjectionOptions = {}): Promise<boolean>
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
                const loadPromise = new Promise<void>(async (resolve, reject) => {
                    const linkMode = Object.keys(RWSViewComponent.FORCE_INJECT_MODE_PER_LINK).includes(styleLink) ? RWSViewComponent.FORCE_INJECT_MODE_PER_LINK[styleLink] : mode;

                    if (linkMode === 'legacy' || linkMode === 'both') {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleLink;
                        component.shadowRoot!.appendChild(link);
        
                        link.onload = () => {
                            doneAdded = true;

                            if(linkMode === 'legacy'){
                                resolve();
                            }
                        };
                    }

                    if (linkMode === 'style-element') {
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
                            console.log(`System saved stylesheet: ${styleLink} to IndexedDB`)
                        }

                        // Create style element and add to host
                        if (component.componentElement) {
                            const styleElement = document.createElement('style');
                            styleElement.textContent = cssText;                            
                            component.componentElement.appendChild(styleElement);
                            doneAdded = true;
                        }

                        resolve();
                    }

                    if (linkMode === 'adopted' || linkMode === 'both') {
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
                            console.log(`System saved stylesheet: ${styleLink} to IndexedDB`)
                        }

                        const sheet = new CSSStyleSheet();
                        await sheet.replace(cssText);

                        // Cache the stylesheet for future use
                        CSSInjectionManager.CACHED_STYLES.set(styleLink, sheet);

                        adoptedSheets.push(sheet);

                        if(linkMode === 'adopted' || linkMode === 'both'){
                            resolve();
                        }
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

    private static setStylesOwner(component: ICSSInjectionComponent): void {
        if (!CSSInjectionManager.STYLES_OWNER_COMPONENT) {
            CSSInjectionManager.STYLES_OWNER_COMPONENT = component;
            console.log({component});
        }
    }
}

export default CSSInjectionManager;
export { CSSInjectMode, ICSSInjectionOptions, ICSSInjectionComponent };