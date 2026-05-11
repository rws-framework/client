/**
 * Plain service registry for the Service Worker context.
 * No fast-foundation / DOM-dependent DI – just a Map.
 */

export class SWContainer {
    private _registry = new Map<string, any>();

    register<T>(key: string, instance: T): void {
        this._registry.set(key, instance);
    }

    get<T>(key: string): T | null {
        return (this._registry.get(key) as T) ?? null;
    }

    has(key: string): boolean {
        return this._registry.has(key);
    }
}

let _container: SWContainer | null = null;

function getSWContainer(): SWContainer {
    if (!_container) {
        _container = new SWContainer();
    }
    return _container;
}

export default getSWContainer;
export { getSWContainer };
