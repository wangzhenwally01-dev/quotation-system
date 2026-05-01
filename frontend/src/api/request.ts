export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken(): string {
  // Try multiple storage mechanisms for cross-platform compatibility
  try {
    const token = uni.getStorageSync('token');
    if (token) return token;
  } catch {}
  // Fallback for H5
  try {
    const token = localStorage.getItem('token');
    if (token) return token;
  } catch {}
  return '';
}

export async function request<T = any>(
  url: string,
  options: { method?: string; data?: any; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', data, auth = true } = options;
  const header: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: method as any,
      data,
      header,
      timeout: 120000,
      success: (res) => {
        if (res.statusCode === 401) {
          // Only redirect on auth-required requests
          if (auth) {
            // Clear stale token
            try { uni.removeStorageSync('token'); } catch {}
            try { localStorage.removeItem('token'); } catch {}
            uni.redirectTo({ url: '/pages/admin/login' });
          }
          reject(new Error('未登录'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error((res.data as any)?.error || '请求失败'));
          return;
        }
        resolve(res.data as T);
      },
      fail: (err) => reject(new Error(err.errMsg || '网络错误')),
    });
  });
}
