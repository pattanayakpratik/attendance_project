export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPERADMIN';
  phone?: string;
  class?: string;
  token?: string;
  institute_id?: number;
  institute_name?: string;
  institute_code?: string;
}

export function getSavedUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('attendance_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveUser(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('attendance_user', JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('attendance_user');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const saved = getSavedUser();
  let finalEndpoint = endpoint;
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  if (saved?.id) {
    if (isGet) {
      const sep = finalEndpoint.includes('?') ? '&' : '?';
      if (!finalEndpoint.includes('request_id=') && !finalEndpoint.includes('id=')) {
        finalEndpoint = `${finalEndpoint}${sep}request_id=${saved.id}&id=${saved.id}`;
      } else if (!finalEndpoint.includes('request_id=')) {
        finalEndpoint = `${finalEndpoint}${sep}request_id=${saved.id}`;
      } else if (!finalEndpoint.includes('id=')) {
        finalEndpoint = `${finalEndpoint}${sep}id=${saved.id}`;
      }
    }
  }

  // Inject into JSON body for mutations if not present
  let finalBody = options.body;
  if (!isGet && saved?.id && typeof options.body === 'string') {
    try {
      const parsed = JSON.parse(options.body);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        if (parsed.request_id === undefined && parsed.requesting_user_id === undefined) {
          parsed.request_id = saved.id;
          parsed.requesting_user_id = saved.id;
        }
        if (parsed.created_by === undefined) {
          parsed.created_by = saved.id;
        }
        finalBody = JSON.stringify(parsed);
      }
    } catch {
      // ignore
    }
  }

  const url = `${API_BASE_URL}${finalEndpoint}`;

  const authHeaders: Record<string, string> = {};
  if (saved?.token) {
    authHeaders['Authorization'] = `Bearer ${saved.token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      body: finalBody,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data: data as T,
      error: res.ok ? undefined : data.message || 'Request failed',
    };
  } catch (err: any) {
    const isNetworkError =
      err?.message === 'Failed to fetch' ||
      err?.name === 'TypeError' ||
      err?.code === 'ECONNREFUSED';

    return {
      ok: false,
      status: 0,
      data: {} as T,
      error: isNetworkError
        ? 'Backend server is not running on http://127.0.0.1:5000. Please start the Flask backend or click "Continue as a guest".'
        : err.message || 'Unable to connect to backend server',
    };
  }
}
