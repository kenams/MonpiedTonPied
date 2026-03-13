'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    defaultLocale,
    getTranslation,
    locales,
    type Locale,
} from '../lib/i18n';

type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
};

const STORAGE_KEY = 'monpiedtonpied-locale';

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === 'undefined') {
            return defaultLocale;
        }

        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'fr' || stored === 'en') {
            return stored;
        }

        return window.navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    });

    useEffect(() => {
        document.documentElement.lang = locale;
        window.localStorage.setItem(STORAGE_KEY, locale);
    }, [locale]);

    const setLocale = useCallback((nextLocale: Locale) => {
        if (locales.includes(nextLocale)) {
            setLocaleState(nextLocale);
        }
    }, []);

    const t = useCallback((key: string) => getTranslation(locale, key), [locale]);

    const value = useMemo(
        () => ({
            locale,
            setLocale,
            t,
        }),
        [locale, setLocale, t]
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used inside LocaleProvider');
    }
    return context;
}
