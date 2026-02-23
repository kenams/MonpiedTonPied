import Link from 'next/link';
import Navigation from './components/Navigation';

export default function Home() {
    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            Plateforme créateurs
                        </p>
                        <h1 className="text-5xl md:text-6xl font-semibold text-[#f4ede3]">
                            L’univers premium des passionnés de pieds.
                        </h1>
                        <p className="text-lg text-[#b7ad9c]">
                            Découvre des collections exclusives, soutiens tes créateurs
                            favoris et accède à des contenus photo et vidéo soigneusement
                            curatés.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/browse"
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-8 py-3 font-semibold text-sm shadow-lg"
                            >
                                Explorer le contenu
                            </Link>
                            <Link
                                href="/create"
                                className="rounded-full border border-white/15 px-8 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                Devenir créateur
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="noise-bg absolute inset-0 rounded-[32px] opacity-30"></div>
                        <div className="glass rounded-[32px] p-8 relative">
                            <div className="grid grid-cols-2 gap-4">
                                {['Studio rose', 'Lumière douce', 'Bord de mer', 'Vibes pastel'].map(
                                    (label) => (
                                        <div
                                            key={label}
                                            className="rounded-2xl bg-white/5 p-4 shadow-md border border-white/5"
                                        >
                                            <p className="text-xs text-[#b7ad9c]">Collection</p>
                                            <p className="font-semibold text-[#f4ede3]">{label}</p>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] p-5 shadow-lg">
                                <p className="text-sm uppercase tracking-[0.3em]">
                                    Nouveau
                                </p>
                                <p className="text-xl font-semibold">
                                    Série exclusive “Velours”
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Curation élégante',
                            text: 'Un feed épuré qui met en valeur chaque créateur.',
                        },
                        {
                            title: 'Monétisation simple',
                            text: 'Fixe tes prix, publie, et laisse la communauté soutenir.',
                        },
                        {
                            title: 'Connexion directe',
                            text: 'Messages privés et relations durables avec tes fans.',
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5"
                        >
                            <h3 className="text-xl font-semibold text-[#f4ede3]">
                                {item.title}
                            </h3>
                            <p className="text-[#b7ad9c] mt-3">{item.text}</p>
                        </div>
                    ))}
                </section>

                <section className="glass rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">
                            Des profils soignés pour mettre en scène ton univers.
                        </h2>
                        <p className="text-[#b7ad9c]">
                            Photos, vidéos, stories et behind the scenes. Chaque créateur a
                            un espace premium pour raconter sa signature visuelle.
                        </p>
                        <Link
                            href="/creators"
                            className="inline-flex items-center gap-2 text-[#f0d8ac] font-semibold"
                        >
                            Voir les créateurs
                            <span>→</span>
                        </Link>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-6 shadow-md border border-white/5">
                        <p className="text-sm text-[#b7ad9c]">Dernier créateur à suivre</p>
                        <p className="text-2xl font-semibold text-[#f4ede3]">Luna Atelier</p>
                        <p className="text-sm text-[#b7ad9c] mt-2">
                            44 contenus · 5 nouveaux cette semaine
                        </p>
                        <button className="mt-4 rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-2 text-sm font-semibold">
                            Suivre
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Garantie & qualité',
                            text: 'Modération active, charte créateurs claire, contenu premium.',
                        },
                        {
                            title: 'Créateurs vérifiés',
                            text: 'Badges vérifiés pour les profils sérieux et réguliers.',
                        },
                        {
                            title: 'Paiement sécurisé',
                            text: 'Accès immédiat après paiement. Historique visible dans le profil.',
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5"
                        >
                            <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                                Confiance
                            </p>
                            <h3 className="mt-3 text-xl font-semibold text-[#f4ede3]">
                                {item.title}
                            </h3>
                            <p className="text-[#b7ad9c] mt-3">{item.text}</p>
                        </div>
                    ))}
                </section>

                <section className="glass rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="space-y-4">
                        <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                            Accès & tarifs
                        </p>
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">
                            Pass 5,99€ ou abonnement 11,99€.
                        </h2>
                        <p className="text-[#b7ad9c]">
                            La première photo est visible. Le reste est flouté jusqu’au
                            paiement. Les créateurs restent libres et peuvent fixer un prix
                            à l’unité sur leurs contenus.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-6 shadow-md border border-white/5 space-y-3">
                        <p className="text-sm text-[#b7ad9c]">Conditions</p>
                        <p className="text-sm text-[#f4ede3]">
                            Pass 5,99€ valable 30 jours
                        </p>
                        <p className="text-sm text-[#f4ede3]">
                            Abonnement 11,99€ mensuel
                        </p>
                        <p className="text-xs text-[#b7ad9c]">
                            Achat à l’unité selon le créateur
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
