import { ApiServiceInstance, IBackendRoute, IHTTProute } from "../ApiService";
import { ConfigServiceInstance } from "../ConfigService";

export const backend = {
    getBackendUrl(this: ApiServiceInstance, routeName: string, params: {[key: string]: string} = {}, queryParams: {[key: string]: string} = {}): string
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
                        path: Array.isArray(subRouteItem.path) ? subRouteItem.path.map(subPath => item.prefix + subPath) : item.prefix + subRouteItem.path,
                        name: backend.checkPrefixedRouteName(subRouteItem.name, item.controllerName),
                        method: subRouteItem.method || 'GET'
                    };            
                    return subRoute;
                })];

            } else {
                // Handle the case where item is of type IHTTProute
                routes.push(item as IHTTProute);
            }          
        });        

        const route = routes.find((item: IHTTProute) => item.name === routeName);        

        if(!route){
            throw new Error(`Backend route '${routeName}' does not exist.`);
        }

        let apiPath: string | string[] = route.path;        

        if(Array.isArray(apiPath)){
            const paramsLength = Object.keys(params).length;
            if(paramsLength > 0){               
                for(const searchedPath of apiPath){
                    let foundParams = 0;
                    for(const p of Object.keys(params)){
                        if(searchedPath.indexOf(`:${p}`) !== -1){
                            foundParams++;
                        }
                    }

                    if(foundParams === paramsLength){
                        apiPath = searchedPath;
                        break;
                    }
                }
            }else{
                for(const searchedPath of apiPath){
                    if(!searchedPath.includes(':')){
                        apiPath = searchedPath;
                        break;
                    }
                }
            }
        }

        Object.keys(params).forEach((paramKey: string) => {
            const paramValue = params[paramKey];

            apiPath = (apiPath as string).replace(`:${paramKey}`, paramValue);
        });        

        let finalUrl = `${config.get('backendUrl')}${config.get('apiPrefix') || ''}${apiPath}`;

        if(Object.keys(queryParams).length > 0){
            const queryString = new URLSearchParams(queryParams).toString();
            finalUrl += `?${queryString}`;
        }

        return finalUrl;
    },
    checkPrefixedRouteName(routeName: string, prefixName: string){
        let finalRoute = routeName;

        if(routeName.indexOf(prefixName) === -1){
            finalRoute = `${routeName}`;
        }

        return finalRoute;
    }
}