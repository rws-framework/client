import { ApiServiceInstance, IAPIOptions } from "../ApiService";

const _DEFAULT_CONTENT_TYPE = 'application/json';

type HeadersType = Headers | [string, string][] | Record<string, string>;

export const calls = {
    addHeader(headers: HeadersType, key: string, val: string): void {
        if (headers instanceof Headers) {
            headers.append(key, val);
        } else if (Array.isArray(headers)) {
            headers.push([key, val]);
        } else {
            headers[key] = val;
        }
    },

    getHeaders(token: string | null = null, optHeaders: HeadersInit = {}): HeadersInit {
        const headers: Record<string, string> = { ...(optHeaders as Record<string, string>) };

        if (!('Content-Type' in headers)) {
            this.addHeader(headers, 'Content-Type', _DEFAULT_CONTENT_TYPE);
        }

        if (token) {
            this.addHeader(headers, 'Authorization', `Bearer ${token}`);
        }

        if (headers['Content-Type']) {
            this.addHeader(headers, 'Accept', '*/*');
        } else {
            this.addHeader(headers, 'Accept', headers['Content-Type'] || _DEFAULT_CONTENT_TYPE);
        }

        return headers;
    },

    async pureGet(this: ApiServiceInstance, url: string, options: IAPIOptions = {}): Promise<string> {
        try {
            const response = await fetch(url, {
                headers: calls.getHeaders(this.token, options.headers),
            });
            return await response.text();
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    },

    async get<T>(this: ApiServiceInstance, url: string, options: IAPIOptions = {}): Promise<T> {
        try {
            const response = await fetch(url, {
                headers: calls.getHeaders(this.token, options.headers),
            });
            const data: T = await response.json();
            return data;
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    },

    async post<T, P extends object = object>(
        this: ApiServiceInstance,
        url: string,
        payload?: P,
        options: IAPIOptions = {}
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: calls.getHeaders(this.token, options.headers),
                body: payload ? JSON.stringify(payload) : null,
            });
            const data: T = await response.json();
            return data;
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    },

    async put<T, P extends object = object>(
        this: ApiServiceInstance,
        url: string,
        payload: P,
        options: IAPIOptions = {}
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: calls.getHeaders(this.token, options.headers),
                body: JSON.stringify(payload),
            });
            const data: T = await response.json();
            return data;
        } catch (error) {
            console.error('PUT request failed:', error);
            throw error;
        }
    },

    async delete<T>(this: ApiServiceInstance, url: string, options: IAPIOptions = {}): Promise<T> {
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: calls.getHeaders(this.token, options.headers),
            });
            const data: T = await response.json();
            return data;
        } catch (error) {
            console.error('DELETE request failed:', error);
            throw error;
        }
    }
};