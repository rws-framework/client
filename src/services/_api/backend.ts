import { ApiServiceInstance, IBackendRoute, IHTTProute } from "../ApiService";
import { ConfigServiceInstance } from "../ConfigService";

export const backend = {
    getBackendUrl(this: ApiServiceInstance, routeName: string, params: {[key: string]: string} = {})
    {       
        const config = this.config;
        const routesPackage = config.get('backendRoutes');

        let routes: IHTTProute[] = [];       

        routesPackage.forEach((item: IBackendRoute) => {
            // Check if item is an instance of IPrefixedHTTProutes
            if ('prefix' in item && 'routes' in item && Array.isArray(item.routes)) {
                // Handle the case where item is of type IPrefixedHTTProutes
                if(item.exportAutoRoutes){
                    item.routes = [...item.routes, 
                        {
                            name: `list`,
                            path: '/',
                            method: 'GET'
                        },
                        {
                            name: `create`,
                            path: '/',
                            method: 'POST'
                        },
                        {
                            name: `show`,
                            path: '/:id',
                            method: 'GET'
                        },                      
                        {
                            name: `update`,
                            path: '/:id',
                            method: 'PUT'
                        },
                        {
                            name: `delete`,
                            path: '/:id',
                            method: 'DELETE'
                        },
                    ];
                }

                routes = [...routes, ...item.routes.map((subRouteItem: IHTTProute): IHTTProute => {
                    const subRoute: IHTTProute = {
                        path: item.prefix + subRouteItem.path,
                        name: backend.checkPrefixedRouteName(subRouteItem.name, item.controllerName),
                        method: subRouteItem.method || 'GET'
                    };
            
                    return subRoute;
                })];

                console.log({routes});
            } else {
                // Handle the case where item is of type IHTTProute
                routes.push(item as IHTTProute);
            }          
        });        

        const route = routes.find((item: IHTTProute) => item.name === routeName);        

        if(!route){
            throw new Error(`Backend route '${routeName}' does not exist.`);
        }

        let apiPath = route.path;

        Object.keys(params).forEach((paramKey: string) => {
            const paramValue = params[paramKey];

            apiPath = apiPath.replace(`:${paramKey}`, paramValue);
        });

        return `${config.get('backendUrl')}${config.get('apiPrefix') || ''}${apiPath}`;
    },
    checkPrefixedRouteName(routeName: string, prefixName: string){
        let finalRoute = routeName;

        if(routeName.indexOf(prefixName) === -1){
            finalRoute = `${prefixName}:${routeName}`;
        }

        return finalRoute;
    }
}