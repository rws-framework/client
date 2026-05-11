import { DI, Registration, Container } from '@microsoft/fast-foundation/dist/esm/di/di';

type SWServiceKey = (new (...args: any[]) => any);

const _registered: Record<string, any> = {};
let _container: Container | null = null;

function getSWContainer(): Container {
    if (!_container) {
        _container = DI.createContainer();
    }
    return _container;
}

export default getSWContainer;
export { getSWContainer, DI, Registration, Container, SWServiceKey, _registered };
