const STORAGE_KEY = 'auth_token';

export function getAuthToken() {
    if (typeof window === 'undefined') {
        return '';
    }
    return localStorage.getItem(STORAGE_KEY) || '';
}

export function setAuthToken(token: string) {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken() {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(STORAGE_KEY);
}
