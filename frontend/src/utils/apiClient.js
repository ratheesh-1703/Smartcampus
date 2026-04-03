// API client with safe handling for non-JSON responses.

export const BASE_URL = (() => {
  const QUICK_TUNNEL_BACKEND = 'https://merchants-essence-visit-cashiers.trycloudflare.com/SmartCampus/backend';

  // Try Vite's import.meta.env safely
  try {
    const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : null;
    if (viteEnv && viteEnv.DEV) {
      return '/backend';
    }
    const url = viteEnv ? (viteEnv.VITE_API_URL || viteEnv.REACT_APP_API_URL) : null;
    if (url) return String(url).replace(/\/$/, '');
  } catch {
    // ignore - import.meta may not be available in some runtimes
  }

  // Fallbacks for other environments
  const runtimeProcess = globalThis?.process;
  if (runtimeProcess && runtimeProcess.env && runtimeProcess.env.REACT_APP_API_URL) {
    return String(runtimeProcess.env.REACT_APP_API_URL).replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.__API_URL__) {
    return String(window.__API_URL__).replace(/\/$/, '');
  }

  // In production, never default to same-origin when hosted on Netlify.
  // Netlify does not host the PHP backend, so same-origin would produce 404 HTML.
  if (typeof window !== 'undefined') {
    const host = String(window.location.hostname || '').toLowerCase();

    if (host.endsWith('.netlify.app')) {
      return QUICK_TUNNEL_BACKEND;
    }

    // Keep same-origin fallback for localhost/LAN development cases.
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    const isPrivateLan = /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if (isLocalHost || isPrivateLan) {
      return `${window.location.origin}/backend`;
    }

    return QUICK_TUNNEL_BACKEND;
  }

  // Non-browser fallback
  return QUICK_TUNNEL_BACKEND;
})();

export const buildUrl = (path) => {
  if (!path) return BASE_URL;
  return path.startsWith('http') ? path : `${BASE_URL}/${path.replace(/^\//, '')}`;
};

export const fetchJSON = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const text = await response.text();

    try {
      if (!contentType || !contentType.includes('application/json')) {
        const trimmed = text.trim();
        const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');

        if (!looksLikeJson) {
          console.error('Backend returned non-JSON response:', {
            url,
            status: response.status,
            contentType,
            body: text.substring(0, 200)
          });

          throw new Error(
            `Server returned ${response.status} ${response.statusText}. ` +
            `Expected JSON but got ${contentType || 'text/html'}. ` +
            `URL: ${url}`
          );
        }

        console.warn('Backend returned JSON with non-JSON content-type:', {
          url,
          status: response.status,
          contentType
        });
      }

      return JSON.parse(text);
    } catch {
      console.error('Backend returned invalid JSON:', {
        url,
        status: response.status,
        body: text.substring(0, 200)
      });

      throw new Error(
        `Invalid JSON from server. URL: ${url}. ` +
        `First bytes: ${text.substring(0, 80)}`
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Wrapper for common API call patterns.
export const apiCall = async (url, options = {}) => {
  try {
    const { suppressStatusWarning = false, ...fetchOptions } = options || {};
    const data = await fetchJSON(url, fetchOptions);
    
    if (!data.status && !suppressStatusWarning) {
      console.warn('API returned status: false', data.message || data);
    }
    
    return data;
  } catch (error) {
    // Return error object matching expected format
    return {
      status: false,
      message: error.message,
      error: true
    };
  }
};
