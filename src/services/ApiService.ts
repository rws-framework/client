import { IKDBTypesResponse } from '../types/IBackendCore';
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
}

interface IHTTProute<P = {[key: string]: any}> {
    name: string;
    path: string;  
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
    private token?: string;    

    constructor(@ConfigService public config: ConfigServiceInstance) {
        super();        
    }

    public setToken(token: string)
    {
        this.token = token;
    }

    

    public async isGetTargetReachable(url: string, options: IAPIOptions = {}): Promise<boolean> {
        try {    
            return !!(await calls.pureGet(url, options, this.token));
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
        get: <T>(routeName: string, options?: IAPIOptions): Promise<T> => calls.get(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), options, this.token),
        post: <T, P extends object = object>(routeName: string, payload?: P, options?: IAPIOptions): Promise<T> => calls.post(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), payload, options, this.token),
        put: <T, P extends object = object>(routeName: string, payload: P, options?: IAPIOptions): Promise<T> => calls.put(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), payload, options, this.token),
        delete: <T>(routeName: string, options?: IAPIOptions): Promise<T> => calls.delete(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), options, this.token),
        uploadFile: (routeName: string, file: File, onProgress: (progress: number) => void, options: IAPIOptions = {}, payload: any = {}): Promise<UploadResponse> => this.uploadFile(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), file, onProgress, payload),
    };

    async getResource(resourceName: string): Promise<IKDBTypesResponse>
    {        
        return calls.get(`${this.config.get('backendUrl')}${this.config.get('apiPrefix') || ''}/api/rws/resource/${resourceName}`)
    }
}

export default ApiService.getSingleton();
export { IBackendRoute, RequestOptions, ApiService as ApiServiceInstance, IHTTProute, IPrefixedHTTProutes, IAPIOptions };