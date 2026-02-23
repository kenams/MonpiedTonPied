'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { apiUrl } from '../lib/api';

type CreatorItem = {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    verified: boolean;
    isSuspended?: boolean;
};

export default function CreatorsPage() {
    const [creators, setCreators] = useState<CreatorItem[]>([]);

    useEffect(() => {
        fetch(apiUrl('/api/creators'))
            .then((res) => res.json())
            .then((data) => setCreators(data || []))
            .catch(() => {});
    }, []);

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        Créateurs
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Les profils à suivre
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        Découvre des univers visuels uniques et choisis les créateurs
                        dont tu veux suivre les publications.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {creators.map((creator) => (
                        <Link
                            key={creator.id}
                            href={`/creators/${creator.id}`}
                            className="group rounded-3xl bg-white/5 p-6 shadow-lg hover:shadow-2xl transition border border-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] flex items-center justify-center text-xl font-semibold overflow-hidden">
                                    {creator.avatarUrl ? (
                                        <img
                                            src={creator.avatarUrl}
                                            alt={creator.displayName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        creator.displayName
                                            .split(' ')
                                            .map((part) => part[0])
                                            .join('')
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-[#f4ede3]">
                                        {creator.displayName}
                                    </p>
                                    <p className="text-sm text-[#b7ad9c] line-clamp-2">
                                        {creator.bio || 'Créateur premium'}
                                    </p>
                                </div>
                            </div>
                            {creator.verified && (
                                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1 text-xs text-[#f0d8ac]">
                                    Créateur vérifié
                                </div>
                            )}
                            {creator.isSuspended && (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#b7ad9c]">
                                    Profil temporairement suspendu
                                </div>
                            )}
                            <div className="mt-6 flex items-center gap-2 text-[#f0d8ac] font-semibold text-sm">
                                Voir le profil
                                <span className="transition group-hover:translate-x-1">→</span>
                            </div>
                        </Link>
                    ))}
                    {creators.length === 0 && (
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-[#b7ad9c]">
                            Aucun créateur disponible pour le moment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
