import { ITypesResponse } from '../../../components/src/types/IBackendCore';
import TheService from './_service';

//@4DI
import ConfigService, { ConfigServiceInstance } from './ConfigService';

import { upload, UploadResponse } from 'upload';

import { backend } from './_api/backend';
import { calls } from './_api/calls';

interface RequestOptions {
    method?: string;
    headers: HeadersInit;
    body?: string;
}

interface IAPIOptions {
    headers?: Headers,
    routeParams?: {
        [key: string]: string
    }, 
    queryParams?: {
        [key: string]: string
    }
}

interface IHTTProute<P = {[key: string]: any}> {
    name: string;
    path: string | string[];  
    method: string;
    noParams?: boolean;
    options?: any;
    plugins?: P
}

interface IPrefixedHTTProutes<P = {[key: string]: any}> {
    prefix: string;
    controllerName: string;
    exportAutoRoutes?: boolean,
    routes: IHTTProute<P>[];
}


type IBackendRoute = IHTTProute | IPrefixedHTTProutes;



class ApiService extends TheService {
    static _DEFAULT: boolean = true;
    public token?: string;    

    constructor(@ConfigService public config: ConfigServiceInstance) {
        super();        
    }

    public setToken(token: string)
    {
        this.token = token;
    }

    

    public async isGetTargetReachable(url: string, options: IAPIOptions = {}): Promise<boolean> {
        try {    
            return !!(await calls.pureGet.bind(this)(url, options));
        } catch (error) {
            return false;
        }
    }    

    async uploadFile(url: string, file: File, onProgress: (progress: number) => void, payload: any = {}): Promise<UploadResponse>
    {
        return upload(
            
            url,
            {
                file,
                ...payload
            },
            {
                onProgress,
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : null,
            }
        );
    }

    public pureGet = calls.pureGet;
    public get = calls.get;
    public post = calls.post;
    public put = calls.put;
    public delete = calls.delete;

    public back = {
        get: async <T>(routeName: string, options?: IAPIOptions, token?: string): Promise<T> => calls.get.bind(this)(backend.getBackendUrl.bind(this)(routeName, options?.routeParams, options?.queryParams), options) as Promise<T>,
        post: async <T, P extends object = object>(routeName: string, payload?: P, options?: IAPIOptions): Promise<T> => calls.post.bind(this)(backend.getBackendUrl.bind(this)(routeName, options?.routeParams, options?.queryParams), payload, options) as Promise<T>,
        put: async <T, P extends object = object>(routeName: string, payload: P, options?: IAPIOptions): Promise<T> => calls.put.bind(this)(backend.getBackendUrl.bind(this)(routeName, options?.routeParams, options?.queryParams), payload, options) as Promise<T>,
        delete: async <T>(routeName: string, options?: IAPIOptions): Promise<T> => calls.delete.bind(this)(backend.getBackendUrl.bind(this)(routeName, options?.routeParams, options?.queryParams), options) as Promise<T>,
        uploadFile: async (routeName: string, file: File, onProgress: (progress: number) => void, options: IAPIOptions = {}, payload: any = {}): Promise<UploadResponse> => this.uploadFile(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), file, onProgress, payload),
    };

    async getResource(resourceName: string): Promise<ITypesResponse>
    {        
        return calls.get.bind(this)(`${this.config.get('backendUrl')}${this.config.get('apiPrefix') || ''}/api/rws/resource/${resourceName}`) as Promise<ITypesResponse>
    }

    getBackendUrl = backend.getBackendUrl.bind(this);
}

export default ApiService.getSingleton();
export { IBackendRoute, RequestOptions, ApiService as ApiServiceInstance, IHTTProute, IPrefixedHTTProutes, IAPIOptions };