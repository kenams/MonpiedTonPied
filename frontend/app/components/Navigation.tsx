'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clearAuthToken, getAuthToken } from '../lib/auth';
import LogoMark from './LogoMark';

export default function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [token, setToken] = useState(() => getAuthToken());

    const handleLogout = () => {
        clearAuthToken();
        setToken('');
        setIsMenuOpen(false);
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0e0d12]/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center h-20">
                    <Link href="/" className="flex items-center gap-3">
                        <LogoMark size={44} />
                        <div>
                            <span className="text-xl font-semibold text-[#f4ede3]">
                                MonPiedTonPied
                            </span>
                            <p className="text-xs text-[#b7ad9c]">
                                Creators and collection · by Kah-Prod
                            </p>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#d6cbb8]">
                        <Link
                            href="/browse"
                            className="hover:text-[#f0d8ac] transition-colors"
                        >
                            Galerie
                        </Link>
                        <Link
                            href="/creators"
                            className="hover:text-[#f0d8ac] transition-colors"
                        >
                            Creators
                        </Link>
                        <Link
                            href="/offers"
                            className="hover:text-[#f0d8ac] transition-colors"
                        >
                            Offres
                        </Link>
                        <Link
                            href="/create"
                            className="hover:text-[#f0d8ac] transition-colors"
                        >
                            Publier
                        </Link>
                        <Link
                            href="/profile"
                            className="hover:text-[#f0d8ac] transition-colors"
                        >
                            Profil
                        </Link>
                        {token ? (
                            <button
                                onClick={handleLogout}
                                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#d6cbb8] hover:border-[#c7a46a]"
                            >
                                Se deconnecter
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="hover:text-[#f0d8ac] transition-colors"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-xs shadow-lg"
                                >
                                    S&apos;inscrire
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        className="md:hidden flex flex-col space-y-1"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Ouvrir le menu"
                    >
                        <span className="w-6 h-0.5 bg-[#d6cbb8]"></span>
                        <span className="w-6 h-0.5 bg-[#d6cbb8]"></span>
                        <span className="w-6 h-0.5 bg-[#d6cbb8]"></span>
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10 space-y-3 text-sm font-semibold text-[#d6cbb8]">
                        <Link
                            href="/browse"
                            className="block"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Galerie
                        </Link>
                        <Link
                            href="/creators"
                            className="block"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Creators
                        </Link>
                        <Link
                            href="/offers"
                            className="block"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Offres
                        </Link>
                        <Link
                            href="/create"
                            className="block"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Publier
                        </Link>
                        <Link
                            href="/profile"
                            className="block"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Profil
                        </Link>
                        {token ? (
                            <button
                                onClick={handleLogout}
                                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#d6cbb8]"
                            >
                                Se deconnecter
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="block"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="inline-flex rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-xs shadow-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    S&apos;inscrire
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
