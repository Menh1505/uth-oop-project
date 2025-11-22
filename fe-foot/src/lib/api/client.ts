// API Client with Token Management + FULL DEBUG LOG
const API_BASE = 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  baseURL?: string;
}

export class ApiClient {
  private static baseURL = API_BASE;

  static setBaseURL(url: string) {
    this.baseURL = url;
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { baseURL = this.baseURL, ...fetchOptions } = options;
    const url = `${baseURL}${endpoint}`;

    // Add auth token if available
    const headers = new Headers(fetchOptions.headers || {});
    const token = localStorage.getItem('accessToken');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Set default content type
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const method = (fetchOptions.method || 'GET').toUpperCase();
      let loggedBody: any = undefined;

      try {
        if (typeof fetchOptions.body === 'string') {
          loggedBody = fetchOptions.body;
        } else if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
          loggedBody = fetchOptions.body;
        }
      } catch {
        loggedBody = '[unserializable body]';
      }

      console.group(`📤 API REQUEST → ${method} ${url}`);
      console.log('Headers:', Array.from(headers.entries()));
      console.log('Body:', loggedBody);
      console.groupEnd();

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // ===== ✅ LOG FULL RESPONSE =====
      const cloned = response.clone();
      const rawText = await cloned.text();

      console.group(`📥 API RESPONSE → ${method} ${url}`);
      console.log('Status:', response.status);
      console.log('OK:', response.ok);
      console.log('Headers:', Array.from(response.headers.entries()));
      console.log('Raw response:', rawText);

      let payload: any = null;
      try {
        payload = rawText ? JSON.parse(rawText) : null;
        console.log('✅ Parsed JSON:', payload);
      } catch {
        console.warn('❌ Response is not JSON, using raw text');
        payload = rawText;
      }
      console.groupEnd();

      // Handle 401 - token expired
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      // Handle 403 - forbidden
      if (response.status === 403) {
        throw new Error('Forbidden');
      }

      // Handle other errors
      if (!response.ok) {
        const errMsg =
          typeof payload === 'object' && payload?.message
            ? payload.message
            : response.statusText;

        console.error('❌ API Error:', errMsg);
        throw new Error(errMsg || `HTTP ${response.status}`);
      }

      // Return empty object for 204 No Content
      if (response.status === 204) {
        console.warn('[ApiClient] 204 No Content');
        return {} as T;
      }

      // 🧠 Auto unwrap { success, data }
      if (
        payload &&
        typeof payload === 'object' &&
        'success' in payload &&
        'data' in payload
      ) {
        console.log('📦 Unwrapped data:', payload.data);
        return payload.data as T;
      }

      return payload as T;
    } catch (error) {
      console.error(`🔥 API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Convenience methods
  static get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static put<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
