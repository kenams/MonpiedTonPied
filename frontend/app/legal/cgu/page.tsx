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
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>Un compte unique par utilisateur.</li>
                        <li>Respect de la ligne editoriale et des regles de moderation.</li>
                        <li>Utilisation conforme aux lois en vigueur.</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">2. Comptes et securite</h2>
                    <p className="text-[#b7ad9c]">
                        L&apos;utilisateur est responsable de la confidentialite de son
                        compte. Toute activite effectuee depuis le compte est reputee
                        realisee par son titulaire.
                    </p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>Ne partage pas tes identifiants.</li>
                        <li>Signale toute activite suspecte.</li>
                        <li>Le compte peut etre suspendu en cas d&apos;usage frauduleux.</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">3. Contenus et moderation</h2>
                    <p className="text-[#b7ad9c]">
                        Le contenu publie est modere. Les propos haineux, racistes,
                        violents ou non conformes a la ligne editoriale sont interdits.
                    </p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>Contenu uniquement autour des pieds.</li>
                        <li>Respect des createurs et de la communaute.</li>
                        <li>Signalement disponible sur chaque page de contenu.</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">4. Abonnements et acces</h2>
                    <p className="text-[#b7ad9c]">
                        Le pass et l&apos;abonnement donnent acces aux contenus. Le chat est
                        reserve aux abonnes. Les achats a l&apos;unite restent au prix fixe
                        par chaque createur.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">5. Propriete intellectuelle</h2>
                    <p className="text-[#b7ad9c]">
                        Les contenus restent la propriete de leurs createurs. Toute
                        reproduction ou diffusion non autorisee est interdite.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">6. Suspension et suppression</h2>
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
