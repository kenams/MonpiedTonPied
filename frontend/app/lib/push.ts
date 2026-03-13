import { apiUrl } from './api';
import { getAuthToken } from './auth';

type PushResult = {
    ok: boolean;
    message: string;
    enabled?: boolean;
    configured?: boolean;
    subscriptionCount?: number;
};

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getRegistration = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || navigator.serviceWorker.register('/sw.js');
};

export const getPushStatus = async (): Promise<PushResult> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return {
            ok: false,
            message: 'Service worker indisponible.',
            configured: false,
            enabled: false,
        };
    }
    const token = getAuthToken();
    if (!token) {
        return { ok: false, message: 'Authentification requise.', enabled: false };
    }

    const response = await fetch(apiUrl('/api/push/status'), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        return {
            ok: false,
            message: data.message || 'Statut push indisponible.',
            enabled: false,
        };
    }
    return {
        ok: true,
        message: data.enabled ? 'Push actif.' : 'Push inactif.',
        enabled: Boolean(data.enabled),
        configured: Boolean(data.configured),
        subscriptionCount: Number(data.subscriptionCount || 0),
    };
};

export const registerPush = async (): Promise<PushResult> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return { ok: false, message: 'Service worker indisponible.' };
    }
    const token = getAuthToken();
    if (!token) {
        return { ok: false, message: 'Authentification requise.' };
    }

    const keyResponse = await fetch(apiUrl('/api/push/public-key'));
    const keyData = await keyResponse.json();
    if (!keyResponse.ok) {
        return { ok: false, message: keyData.message || 'Push indisponible.' };
    }

    const registration = await getRegistration();
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });
    }

    const response = await fetch(apiUrl('/api/push/subscribe'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
    });
    const data = await response.json();
    if (!response.ok) {
        return { ok: false, message: data.message || 'Erreur push.' };
    }
    return { ok: true, message: data.message || 'Push actif.', enabled: true, configured: true };
};

export const unregisterPush = async (): Promise<PushResult> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return { ok: false, message: 'Service worker indisponible.' };
    }
    const token = getAuthToken();
    if (!token) {
        return { ok: false, message: 'Authentification requise.' };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;

    if (subscription?.endpoint) {
        const response = await fetch(apiUrl('/api/push/unsubscribe'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return {
                ok: false,
                message: data.message || 'Desactivation push impossible.',
                enabled: true,
                configured: true,
            };
        }
        await subscription.unsubscribe();
    }

    return {
        ok: true,
        message: 'Push desactive.',
        enabled: false,
        configured: true,
    };
};
