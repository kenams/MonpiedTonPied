import { API_BASE } from './api';

export function resolveMediaUrl(value?: string | null) {
    if (!value) return '';
    if (value.startsWith('/api/')) {
        return `${API_BASE}${value}`;
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }
    if (value.startsWith('/uploads/')) {
        return `${API_BASE}${value}`;
    }
    return value;
}
