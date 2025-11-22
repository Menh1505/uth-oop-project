// API Client with Token Management + DEBUG LOG + FormData support
const API_BASE = 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  baseURL?: string;
}

export class ApiClient {
  private static baseURL = API_BASE;

  static setBaseURL(url: string) {
    this.baseURL = url;
  }

  // Chuẩn hoá body: hỗ trợ FormData + JSON
  private static prepareBody(body: any, headers: Headers): BodyInit | undefined {
    if (body == null) return undefined;

    // Nếu là FormData → để nguyên, KHÔNG set Content-Type
    if (body instanceof FormData) {
      if (headers.has('Content-Type')) {
        headers.delete('Content-Type');
      }
      return body;
    }

    // Nếu là string → giữ nguyên, set Content-Type nếu chưa có
    if (typeof body === 'string') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return body;
    }

    // Còn lại coi như object JSON
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return JSON.stringify(body);
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { baseURL = this.baseURL, ...fetchOptions } = options;
    const url = `${baseURL}${endpoint}`;

    const headers = new Headers(fetchOptions.headers || {});
    const token = localStorage.getItem('accessToken');

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const method = (fetchOptions.method || 'GET').toUpperCase();

    // Chuẩn hoá body (JSON vs FormData)
    const finalBody = this.prepareBody(fetchOptions.body, headers);

    // Log request
    let loggedBody: any = finalBody;
    if (finalBody instanceof FormData) {
      const obj: Record<string, any> = {};
      for (const [k, v] of finalBody.entries()) {
        obj[k] = v;
      }
      loggedBody = obj;
    }
    console.log('[ApiClient] REQUEST', {
      method,
      url,
      headers: Object.fromEntries(headers.entries()),
      body: loggedBody,
    });

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: finalBody,
      });

      // Log response (raw + json)
      const cloned = response.clone();
      const rawText = await cloned.text();

      console.log('[ApiClient] RESPONSE RAW', {
        method,
        url,
        status: response.status,
        ok: response.ok,
        rawText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      let payload: any = null;
      try {
        payload = rawText ? JSON.parse(rawText) : null;
        console.log('[ApiClient] RESPONSE JSON', payload);
      } catch {
        console.warn('[ApiClient] Cannot parse JSON, using raw text');
        payload = rawText;
      }

      // 401
      if (response.status === 401) {
        console.warn('[ApiClient] 401 Unauthorized – clearing tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      // 403
      if (response.status === 403) {
        console.warn('[ApiClient] 403 Forbidden');
        throw new Error('Forbidden');
      }

      // other errors
      if (!response.ok) {
        const errMsg =
          typeof payload === 'object' && payload?.message
            ? payload.message
            : response.statusText;
        console.error('[ApiClient] HTTP ERROR', errMsg);
        throw new Error(errMsg || `HTTP ${response.status}`);
      }

      // 204
      if (response.status === 204) {
        console.warn('[ApiClient] 204 No Content');
        return {} as T;
      }

      // auto unwrap { success, data }
      if (
        payload &&
        typeof payload === 'object' &&
        'success' in payload &&
        'data' in payload
      ) {
        console.log('[ApiClient] UNWRAP DATA', payload.data);
        return payload.data as T;
      }

      return payload as T;
    } catch (error) {
      console.error(`🔥 API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Convenience methods: KHÔNG tự stringify body nữa
  static get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  static put<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  static patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  static delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
