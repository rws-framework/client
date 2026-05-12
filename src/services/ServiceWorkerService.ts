import RWSService from './_service';

export interface ISWOpts {
    scope?: string;
    fileName?: string;
}
class ServiceWorkerService extends RWSService {   
    static _DEFAULT: boolean = true;
    async registerServiceWorker(options?: ISWOpts): Promise<void>
    {
        await ServiceWorkerService.registerServiceWorker(options);
    }

    static registerServiceWorker(options?: ISWOpts): Promise<void>
    {
        if (!('serviceWorker' in navigator)) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            // Already controlling — resolve immediately
            if (navigator.serviceWorker.controller) {
                console.log('[SW] registerServiceWorker: already controlling, resolving immediately');
                resolve();
                return;
            }

            console.log('[SW] registerServiceWorker: waiting for SW activation...');

            // Timeout fallback so the app never hangs if SW fails to activate
            const timeout = setTimeout(() => {
                console.warn('[SW] registerServiceWorker: timed out waiting for activation, continuing anyway');
                cleanup();
                resolve();
            }, 5000);

            const cleanup = () => {
                clearTimeout(timeout);
                navigator.serviceWorker.removeEventListener('message', onMessage);
                navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            };

            const onMessage = (event: MessageEvent) => {
                if (event.data?.command === 'sw_activated') {
                    console.log('[SW] registerServiceWorker: received sw_activated message');
                    cleanup();
                    resolve();
                }
            };

            const onControllerChange = () => {
                console.log('[SW] registerServiceWorker: controllerchange fired');
                cleanup();
                resolve();
            };

            navigator.serviceWorker.addEventListener('message', onMessage);
            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true } as any);

            // Always call register() — the browser deduplicates and installs updates automatically.
            // If we find an existing registration first, check for a waiting SW to SKIP_WAITING on,
            // but do NOT skip calling register() (that would prevent updated SW files from installing).
            navigator.serviceWorker.getRegistrations().then(registrations => {
                const existingReg = registrations[0];
                if (existingReg?.waiting) {
                    console.log('[SW] registerServiceWorker: waiting SW found — posting SKIP_WAITING');
                    existingReg.waiting.postMessage({ command: 'SKIP_WAITING' });
                }

                navigator.serviceWorker.register(
                    options?.fileName || '/service_worker.js',
                    { scope: options?.scope || '/' }
                ).then((registration) => {
                    if (registration.installing) {
                        console.log('[SW] registerServiceWorker: SW installing (new version)');
                        // New SW has skipWaiting() in its install handler — controllerchange will fire soon
                    } else if (registration.waiting) {
                        console.log('[SW] registerServiceWorker: SW waiting after register — posting SKIP_WAITING');
                        registration.waiting.postMessage({ command: 'SKIP_WAITING' });
                    } else if (registration.active) {
                        console.log('[SW] registerServiceWorker: SW active after register');
                        // Resolve regardless of controller — SW is ready.
                        // controller may be null after Ctrl+Shift+R (hard reload bypasses SW),
                        // but sendConfirmedMessage will fall back to registration.active.postMessage().
                        cleanup();
                        resolve();
                    }
                }).catch(error => {
                    console.error(`Registration failed with ${error}`);
                    cleanup();
                    resolve();
                });
            });
        });
    }

    sendDataToServiceWorker<T = unknown>(type: string, data: T, asset_type: string = 'data_push')
    {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                command: type,
                asset_type,
                params: data
            });
        } else {
            throw new Error('Service worker is not available');
        }
    }

    /**
     * Send a message to the SW controller and wait for a confirmation reply.
     * The SW is expected to reply with `{ command: confirmCommand }` after processing.
     * By default confirmCommand is `<command>_confirmed`.
     * Resolves immediately (no throw) if no controller is available or on timeout.
     */
    sendConfirmedMessage<T = unknown>(
        command: string,
        data: T,
        opts?: { confirmCommand?: string; timeout?: number; asset_type?: string }
    ): Promise<void> {
        // Prefer the controlling SW; fall back to registration.active (e.g. after hard reload)
        return navigator.serviceWorker.getRegistration('/').then(reg => {
            const target = navigator.serviceWorker.controller ?? reg?.active ?? null;

            if (!target) {
                console.warn('[SW] sendConfirmedMessage: no SW target, skipping command:', command);
                return Promise.resolve();
            }

            return new Promise<void>((resolve) => {
                const confirmCommand = opts?.confirmCommand ?? `${command}_confirmed`;
                const timeoutMs = opts?.timeout ?? 3000;

                console.log(`[SW] sendConfirmedMessage: sending '${command}' via ${
                    navigator.serviceWorker.controller ? 'controller' : 'registration.active'
                }, waiting for '${confirmCommand}'`);

                const timeout = setTimeout(() => {
                    console.warn(`[SW] sendConfirmedMessage: timed out waiting for '${confirmCommand}'`);
                    cleanup();
                    resolve();
                }, timeoutMs);

                const cleanup = () => {
                    clearTimeout(timeout);
                    navigator.serviceWorker.removeEventListener('message', onMessage);
                };

                const onMessage = (event: MessageEvent) => {
                    if (event.data?.command === confirmCommand) {
                        console.log(`[SW] sendConfirmedMessage: received confirmation '${confirmCommand}'`);
                        cleanup();
                        resolve();
                    }
                };

                navigator.serviceWorker.addEventListener('message', onMessage);

                target.postMessage({
                    command,
                    asset_type: opts?.asset_type ?? 'data_push',
                    params: data
                });
            });
        });
    }

    setToken(token: string): Promise<void>
    {
        return this.sendConfirmedMessage('set_token', { token }, { asset_type: 'auth' });
    }

    onMessage<T = unknown>(type: string, handler: (data: T) => void): () => void
    {
        const listener = (event: MessageEvent) => {
            if (event.data && event.data.command === type) {
                handler(event.data as T);
            }
        };

        navigator.serviceWorker.addEventListener('message', listener);

        return () => {
            navigator.serviceWorker.removeEventListener('message', listener);
        };
    }

    onAnyMessage(handler: (event: MessageEvent) => void): () => void
    {
        navigator.serviceWorker.addEventListener('message', handler);

        return () => {
            navigator.serviceWorker.removeEventListener('message', handler);
        };
    }
}


export default ServiceWorkerService.getSingleton();
export { ServiceWorkerService as ServiceWorkerServiceInstance };