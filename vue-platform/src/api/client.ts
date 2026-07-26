export interface ApiErrorResponse {
  code: string;
  error: string;
}

class ApiClient {
  private baseUrl: string = '/api';

  public getToken(): string | null {
    return localStorage.getItem('vfridge_access_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('vfridge_access_token', token);
  }

  public removeToken(): void {
    localStorage.removeItem('vfridge_access_token');
    localStorage.removeItem('vfridge_refresh_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('vfridge_refresh_token');
  }

  public setRefreshToken(token: string): void {
    localStorage.setItem('vfridge_refresh_token', token);
  }

  public getActiveFridgeId(): number | null {
    const raw = localStorage.getItem('vfridge_active_fridge_id');
    return raw ? parseInt(raw, 10) : null;
  }

  public setActiveFridgeId(id: number): void {
    localStorage.setItem('vfridge_active_fridge_id', id.toString());
  }

  public async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fridgeId = this.getActiveFridgeId();
    if (fridgeId) {
      headers['X-Fridge-Id'] = fridgeId.toString();
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Attempt token refresh if available
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return this.handleResponse<T>(retryResponse);
      } else {
        this.removeToken();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    return this.handleResponse<T>(response);
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.accessToken && data.refreshToken) {
        this.setToken(data.accessToken);
        this.setRefreshToken(data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = { code: 'UNKNOWN_ERROR', error: response.statusText || 'An unexpected error occurred' };
      }
      throw errorData;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const api = new ApiClient();
