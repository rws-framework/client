import { ITypesResponse } from '../../../components/src/types/IBackendCore';
import TheService from './_service';
import axios from 'axios';

//@4DI
import ConfigService, { ConfigServiceInstance } from './ConfigService';

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

interface IHTTProute<P = { [key: string]: any }> {
    name: string;
    path: string | string[];
    method: string;
    noParams?: boolean;
    options?: any;
    plugins?: P
}

interface IPrefixedHTTProutes<P = { [key: string]: any }> {
    prefix: string;
    controllerName: string;
    exportAutoRoutes?: boolean,
    routes: IHTTProute<P>[];
}


type IBackendRoute = IHTTProute | IPrefixedHTTProutes;

interface UploadFunctionOptions {
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT' | 'PATCH';
    onProgress?: (progress: number) => void;
}

class ApiService extends TheService {
    static _DEFAULT: boolean = true;
    public token?: string;

    private defaultUploadOptions: () => UploadFunctionOptions = () => ({
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        method: 'POST' as const,
        onProgress: (progress: number) => null,
    });

    constructor(@ConfigService public config: ConfigServiceInstance) {
        super();
    }

    public setToken(token: string) {
        this.token = token;
    }



    public async isGetTargetReachable(url: string, options: IAPIOptions = {}): Promise<boolean> {
        try {
            return !!(await calls.pureGet.bind(this)(url, options));
        } catch (error) {
            return false;
        }
    }

    async uploadFiles<T = any, P = any>(url: string, files: Record<string, File>, payload: P = undefined, uploadOptions: UploadFunctionOptions = this.defaultUploadOptions()): Promise<T> {
        const formData = new FormData();

        // Add files to FormData
        Object.entries(files).forEach(([key, file]) => {
            formData.append(key, file);
        });

        // Add payload data to FormData
        if(payload){
            Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
            }
        });
        }        

        const options = {
            ...this.defaultUploadOptions(),
            ...uploadOptions
        };


        const method = options.method || 'POST';

        const axiosConfig = {
            method: method.toLowerCase() as any,
            url,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...options.headers
            },
            onUploadProgress: (progressEvent: any) => {
                if (options.onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    options.onProgress(progress);
                }
            }
        };        

        return (await axios(axiosConfig)).data;
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
        uploadFiles: async <T = any, P = any>(routeName: string, files: Record<string, File>, payload: P = undefined, uploadOptions: UploadFunctionOptions = this.defaultUploadOptions(), options: IAPIOptions = {}): Promise<T> => this.uploadFiles<T, P>(backend.getBackendUrl.bind(this)(routeName, options?.routeParams), files, payload, uploadOptions),
    };

    async getResource(resourceName: string): Promise<ITypesResponse> {
        return calls.get.bind(this)(`${this.config.get('backendUrl')}${this.config.get('apiPrefix') || ''}/api/rws/resource/${resourceName}`) as Promise<ITypesResponse>
    }

    getBackendUrl: (routeName: string, params?: { [key: string]: string }, queryParams?: { [key: string]: string }) => string = backend.getBackendUrl.bind(this);
}

export default ApiService.getSingleton();
export { IBackendRoute, RequestOptions, ApiService as ApiServiceInstance, IHTTProute, IPrefixedHTTProutes, IAPIOptions, UploadFunctionOptions };