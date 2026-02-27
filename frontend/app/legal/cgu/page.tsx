'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function CGUPage() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
                <div className="space-y-3">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">Legal</p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">Conditions Generales d&apos;Utilisation</h1>
                    <p className="text-[#b7ad9c]">
                        Derniere mise a jour : 27 fevrier 2026
                    </p>
                </div>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">1. Acces au service</h2>
                    <p className="text-[#b7ad9c]">
                        L&apos;acces est reserve aux personnes majeures (18 ans minimum).
                        La creation d&apos;un compte implique la verification de l&apos;age
                        et l&apos;acceptation des presentes conditions.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">2. Comptes et securite</h2>
                    <p className="text-[#b7ad9c]">
                        L&apos;utilisateur est responsable de la confidentialite de son
                        compte. Toute activite effectuee depuis le compte est reputee
                        realisee par son titulaire.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">3. Contenus et moderation</h2>
                    <p className="text-[#b7ad9c]">
                        Le contenu publie est modere. Les propos haineux, racistes,
                        violents ou non conformes a la ligne editoriale sont interdits.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">4. Suspension et suppression</h2>
                    <p className="text-[#b7ad9c]">
                        La plateforme peut suspendre un compte en cas de non-respect des
                        regles, sans preavis, afin de garantir un environnement securise.
                    </p>
                </section>
            </div>
            <Footer />
        </div>
    );
}
