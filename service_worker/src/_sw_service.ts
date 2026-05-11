import getSWContainer from './_sw_container';
import type { SWContainer } from './_sw_container';

export default abstract class RWSSWService {
    _RELOADABLE: boolean = false;

    constructor() {}

    /**
     * Returns the singleton instance of this service, creating and registering it
     * in the SW container the first time it is called.
     */
    public static getSingleton<T extends RWSSWService>(this: new (...args: any[]) => T): T {
        const key = (this as any).name as string;
        const container: SWContainer = getSWContainer();

        if (!container.has(key)) {
            container.register<T>(key, new this());
        }

        return container.get<T>(key)!;
    }
}
