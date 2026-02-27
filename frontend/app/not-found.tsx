import Link from 'next/link';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

export default function NotFound() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-20 space-y-6 text-center">
                <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                    Erreur 404
                </p>
                <h1 className="text-4xl font-semibold text-[#f4ede3]">
                    Page introuvable
                </h1>
                <p className="text-[#b7ad9c]">
                    Cette page n&apos;existe pas ou a ete deplacee.
                </p>
                <Link
                    href="/"
                    className="inline-flex rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                >
                    Retourner a l&apos;accueil
                </Link>
            </div>
            <Footer />
        </div>
    );
}
