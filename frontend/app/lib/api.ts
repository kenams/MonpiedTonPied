export const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export function apiUrl(path: string) {
    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
