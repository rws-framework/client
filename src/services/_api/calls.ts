import { IAPIOptions } from "../ApiService";

const _DEFAULT_CONTENT_TYPE = 'application/json';

export const calls = {
    addHeader(headers: Headers | [string, string][] | {[key: string]: string}, key: string, val: string)
    {
        if (headers instanceof Headers) {
            headers.append(key, val);
        } else if (Array.isArray(headers)) {
            headers.push([key, val]);
        } else {
            headers[key] = val;
        }
    },
    getHeaders(token: string = null, optHeaders: HeadersInit = {}): HeadersInit {
        const headers: HeadersInit = { ...optHeaders };                

        if (!('Content-Type' in headers)) {
            this.addHeader(headers, 'Content-Type', _DEFAULT_CONTENT_TYPE);
        }            
 
        if (token) {
            this.addHeader(headers, 'Authorization', `Bearer ${token}`);            
        }        

        if((headers as any)['Content-Type']){
            this.addHeader(headers, 'Accept', '*/*');
        }else{
            this.addHeader(headers, 'Accept', (headers as any)['Content-Type']);
        }

        return headers;
    },
    async pureGet(url: string, options: IAPIOptions = {}, token: string = null): Promise<string> {
        try {
            const response = await fetch(url, {
                headers: this.getHeaders(token, options.headers),
            });
            return await response.text();
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    },
    async get<T>(url: string, options: IAPIOptions = {}, token: string = null): Promise<T> {
        try {
            const response = await fetch(url, {
                headers: this.getHeaders(token, options.headers),
            });
            return await response.json();
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    },    
    async post<T, P extends object = object>(url: string, payload?: P, options: IAPIOptions = {}, token: string = null): Promise<T> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(token, options.headers),
                body: payload ? JSON.stringify(payload) : null,
            });
            return await response.json();
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    },    
    async put<T, P extends object = object>(url: string, payload?: P, options: IAPIOptions = {}, token: string = null): Promise<T> {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(token, options.headers),
                body: payload ? JSON.stringify(payload) : null,
            });
            return await response.json();
        } catch (error) {
            console.error('PUT request failed:', error);
            throw error;
        }
    },    
    async delete<T>(url: string, options: IAPIOptions = {}, token: string = null): Promise<T> {
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(token, options.headers),
            });
            return await response.json();
        } catch (error) {
            console.error('DELETE request failed:', error);
            throw error;
        }
    }
}