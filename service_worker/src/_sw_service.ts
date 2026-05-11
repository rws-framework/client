import getSWContainer, { DI, Registration, _registered } from './_sw_container';
import type { InterfaceSymbol, Key } from '@microsoft/fast-foundation/dist/dts/di/di';

export interface IWithSWDI<T> {
    new (...args: any[]): T;
    getSingleton: <T extends Key>(this: IWithSWDI<T>) => InterfaceSymbol<T>;
}

export default abstract class RWSSWService {
    _RELOADABLE: boolean = false;

    constructor() {}

    public static register<T extends Key>(this: IWithSWDI<T>): void {
        this.getSingleton();
    }

    public static getSingleton<T extends Key>(this: IWithSWDI<T>, serviceName: string = null): InterfaceSymbol<T> {
        if (!serviceName) {
            serviceName = this.name;
        }

        if (Object.keys(_registered).includes(serviceName)) {
            return _registered[serviceName];
        }

        const interf = DI.createInterface<T>(serviceName);

        getSWContainer().register(
            Registration.singleton(interf, this)
        );

        _registered[serviceName] = interf;

        return interf;
    }
}
