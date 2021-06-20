export interface RequestAdapter {
    (config: RequestRequestConfig): Promise<RequestResponse>;
}

export interface RequestResponseAdapter {
    (res: RequestResponse): Promise<any>;
}

export interface RequestProxyConfig {
    host: string;
    port: number;
}

export type Method =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'purge' | 'PURGE'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK'

export type ResponseType =
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text'
    | 'stream'

export interface RequestRequestConfig {
    url?: string;
    params?: any;
    method?: Method;
    baseURL?: string;
    headers?: any;
    body?:any;
    data?: any;
    timeout?: number;
    adapter?: RequestAdapter;
    responseType?: ResponseType;
    proxy?: RequestProxyConfig;
    onResponse?: RequestResponseAdapter;
}

export interface RequestRequest {
    method: Method;
    url: string;
    headers: any;
    body: string | any;
}

export interface RequestResponse<T = any> {
    status: number;
    headers: any;
    data: T;
    config?: RequestRequestConfig;
    request?: RequestRequest;
}

export interface RequestInstance {
    defaults: RequestRequestConfig;

    request<T = any, R = RequestResponse<T> | any>(config: RequestRequestConfig): Promise<R>;

    get<T = any, R = RequestResponse<T> | any>(url: string, config?: RequestRequestConfig): Promise<R>;

    delete<T = any, R = RequestResponse<T> | any>(url: string, config?: RequestRequestConfig): Promise<R>;

    head<T = any, R = RequestResponse<T> | any>(url: string, config?: RequestRequestConfig): Promise<R>;

    options<T = any, R = RequestResponse<T> | any>(url: string, config?: RequestRequestConfig): Promise<R>;

    post<T = any, R = RequestResponse<T> | any>(url: string, data?: any, config?: RequestRequestConfig): Promise<R>;

    put<T = any, R = RequestResponse<T> | any>(url: string, data?: any, config?: RequestRequestConfig): Promise<R>;

    patch<T = any, R = RequestResponse<T> | any>(url: string, data?: any, config?: RequestRequestConfig): Promise<R>;

    onResponse<R = any>(f: RequestResponseAdapter): Promise<R>;
}

export interface RequestStatic extends RequestInstance {
    create(config?: RequestRequestConfig): RequestInstance;
}

declare const request: RequestStatic;

export default request;
