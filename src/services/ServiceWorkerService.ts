import RWSService from './_service';

export interface ISWOpts {
    scope?: string;
    fileName?: string;
}
class ServiceWorkerService extends RWSService {   
    static _DEFAULT: boolean = true;
    async registerServiceWorker(): Promise<void>
    {
        await ServiceWorkerService.registerServiceWorker();
    }

    static registerServiceWorker(options ?: ISWOpts): Promise<void>
    {
        if ('serviceWorker' in navigator) 
        {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                if (registrations.length) {
                    return;
                }

                try {
                    return (navigator.serviceWorker.register(
                        options?.fileName || '/service_worker.js',
                        {
                            scope: options?.scope || '/'          
                        }
                    ).then((registration) => {
                        if (registration.installing) {
                            console.log('Service worker installing');
                        } else if (registration.waiting) {
                            console.log('Service worker installed');
                        } else if (registration.active) {
                            console.log('Service worker active');
                        }
                    }));                
                            
                } catch (error) {      
                    console.error(`Registration failed with ${error}`);
                }
            });    
            
            return;
        }
    }

    sendDataToServiceWorker(type: string, data: any, asset_type: string = 'data_push')
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

    onMessage(type: string, handler: (data: any) => void): () => void
    {
        const listener = (event: MessageEvent) => {
            if (event.data && event.data.command === type) {
                handler(event.data);
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