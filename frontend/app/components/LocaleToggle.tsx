'use client';

import { useLocale } from './LocaleProvider';

export default function LocaleToggle() {
    const { locale, setLocale } = useLocale();

    return (
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
            {(['fr', 'en'] as const).map((item) => {
                const active = locale === item;
                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setLocale(item)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                            active
                                ? 'bg-[#c7a46a] text-[#0b0a0f]'
                                : 'text-[#d6cbb8]'
                        }`}
                    >
                        {item}
                    </button>
                );
            })}
        </div>
    );
}
