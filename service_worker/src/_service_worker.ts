import IRWSUser from '../../src/types/IRWSUser';

type SWMsgType<T = unknown> = {
    command: string,
    asset_type?: string,
    params: T
};

abstract class RWSServiceWorker<UserType extends IRWSUser> {
    protected user: UserType = null;
    protected ignoredUrls: RegExp[] = [];    
    protected regExTypes: { [key: string]: RegExp };  

    public workerScope: ServiceWorkerGlobalScope;

    protected static _instances: { [key: string]: RWSServiceWorker<IRWSUser> } | null = {};

    private confirmedHandlers: Map<string, (params: unknown) => Promise<void> | void> = new Map();

    onInit(): Promise<void> { return; }   

    onInstall(): Promise<void> { return; }
    onActivate(): Promise<void> { return; }

    /**
     * Register a handler for a SW message command. After the handler resolves,
     * the base class automatically replies to the source client with
     * `{ command: '<originalCommand>_confirmed' }` so the main thread can await it.
     */
    registerConfirmedHandler<T = unknown>(command: string, handler: (params: T) => Promise<void> | void): void {
        this.confirmedHandlers.set(command, handler as (params: unknown) => Promise<void> | void);
    }

    constructor(workerScope: ServiceWorkerGlobalScope) {
        this.workerScope = workerScope;

        // Central router for confirmed-message handlers registered via registerConfirmedHandler.
        // Must be set up before onInit so handlers registered there are active from the start.
        this.workerScope.addEventListener('message', (event: ExtendableMessageEvent) => {
            // Built-in: allow the main thread to force a waiting SW to skip waiting.
            // This handles old SWs that don't have automatic skipWaiting in their install handler.
            if (event.data?.command === 'SKIP_WAITING') {
                console.log('[SW] Received SKIP_WAITING — calling skipWaiting()');
                this.workerScope.skipWaiting();
                return;
            }

            if (!event.data?.command) return;
            const handler = this.confirmedHandlers.get(event.data.command);
            if (!handler) return;

            event.waitUntil(
                Promise.resolve(handler(event.data.params)).then(() => {
                    if (event.source) {
                        (event.source as Client).postMessage({ command: `${event.data.command}_confirmed` });
                    }
                })
            );
        });

        // install and activate MUST be registered synchronously in the constructor.
        // If they are inside onInit().then(), the browser can fire these lifecycle events
        // before the async callback runs, causing skipWaiting/claim to never execute.
        this.workerScope.addEventListener('install', (event: ExtendableEvent) => {
            console.log('[SW] Service Worker: Installing — calling skipWaiting()');

            // Take over immediately — don't wait for the existing SW to be released.
            // This ensures controllerchange fires promptly so the main thread can
            // deliver the auth token before any image fetches start.
            event.waitUntil(
                Promise.resolve(this.workerScope.skipWaiting()).then(() => {
                    console.log('[SW] skipWaiting complete');
                    return this.onInstall() || Promise.resolve();
                })
            );
        });

        this.workerScope.addEventListener('activate', (event: ExtendableEvent) => {
            console.log('[SW] Service Worker: Activating — calling clients.claim()');

            this.onActivate();

            event.waitUntil(
                workerScope.clients.claim().then(() => {
                    console.log('[SW] clients.claim() complete — broadcasting sw_activated');
                    return workerScope.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({ command: 'sw_activated' });
                        });
                    });
                })
            );
        });

        // onInit runs after lifecycle listeners are in place, so subclass setup
        // (fetch handlers, confirmed handlers) is ready when the SW becomes active.
        this.onInit();
    }       

    sendMessageToClient = <T = unknown>(clientId: string, payload: T) => {
        return this.workerScope.clients.get(clientId)
            .then((client: Client | undefined) => {
                if (client) {
                    client.postMessage(payload);
                }
            });
    };

    getUser(): UserType
    {
        return this.user;
    }

    setUser(user: UserType): RWSServiceWorker<UserType>
    {
        this.user = user;        

        return this;
    }

    static create<T extends new (...args: unknown[]) => RWSServiceWorker<IRWSUser>>(this: T, workerScope: ServiceWorkerGlobalScope): InstanceType<T> 
    {
        const className = this.name;

        if (!RWSServiceWorker._instances[className]) {            
            RWSServiceWorker._instances[className] = new this(workerScope);
        }

        return RWSServiceWorker._instances[className] as InstanceType<T>;
    }
}

export default RWSServiceWorker;

export { SWMsgType };