import Link from 'next/link';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

export default function Home() {
    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            Plateforme createurs
                        </p>
                        <h1 className="text-5xl md:text-6xl font-semibold text-[#f4ede3]">
                            L&apos;univers premium des passionnes de pieds.
                        </h1>
                        <p className="text-lg text-[#b7ad9c]">
                            Decouvre des collections exclusives, soutiens tes createurs
                            favoris et accede a des contenus photo et video soigneusement
                            curates.
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
                                Devenir createur
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.35em] text-[#d8c7a8]">
                            <span>Edition luxe</span>
                            <span>Acces immediat</span>
                            <span>Respect et securite</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="noise-bg absolute inset-0 rounded-[32px] opacity-30"></div>
                        <div className="glass rounded-[32px] p-8 relative space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {['Studio rose', 'Lumiere douce', 'Bord de mer', 'Vibes pastel'].map(
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
                            <div className="rounded-2xl bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] p-5 shadow-lg">
                                <p className="text-sm uppercase tracking-[0.3em]">
                                    Nouveau
                                </p>
                                <p className="text-xl font-semibold">
                                    Serie exclusive &quot;Velours&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Curation elegante',
                            text: 'Un feed epure qui met en valeur chaque createur.',
                        },
                        {
                            title: 'Monetisation simple',
                            text: 'Fixe tes prix, publie, et laisse la communaute soutenir.',
                        },
                        {
                            title: 'Connexion directe',
                            text: 'Messages prives et relations durables avec tes fans.',
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
                            Des profils soignes pour mettre en scene ton univers.
                        </h2>
                        <p className="text-[#b7ad9c]">
                            Photos, videos, stories et behind the scenes. Chaque createur a
                            un espace premium pour raconter sa signature visuelle.
                        </p>
                        <Link
                            href="/creators"
                            className="inline-flex items-center gap-2 text-[#f0d8ac] font-semibold"
                        >
                            Voir les createurs
                            <span>-&gt;</span>
                        </Link>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-6 shadow-md border border-white/5 space-y-2">
                        <p className="text-sm text-[#b7ad9c]">Dernier createur a suivre</p>
                        <p className="text-2xl font-semibold text-[#f4ede3]">Luna Atelier</p>
                        <p className="text-sm text-[#b7ad9c]">
                            44 contenus - 5 nouveaux cette semaine
                        </p>
                        <button className="mt-2 rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-2 text-sm font-semibold">
                            Suivre
                        </button>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">
                            Creators spotlight
                        </h2>
                        <Link
                            href="/creators"
                            className="text-sm text-[#f0d8ac] font-semibold"
                        >
                            Voir tout
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'Luna Atelier', tag: '44 contenus', badge: 'Verifie' },
                            { name: 'Sienna Muse', tag: '32 contenus', badge: 'Top creator' },
                            { name: 'Velvet Room', tag: '27 contenus', badge: 'Nouveau' },
                        ].map((creator) => (
                            <div
                                key={creator.name}
                                className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                                        {creator.badge}
                                    </span>
                                    <span className="text-xs text-[#b7ad9c]">{creator.tag}</span>
                                </div>
                                <h3 className="mt-4 text-2xl font-semibold text-[#f4ede3]">
                                    {creator.name}
                                </h3>
                                <p className="mt-2 text-[#b7ad9c]">
                                    Collections premium, acces immediat, style unique.
                                </p>
                                <button className="mt-4 rounded-full border border-white/15 px-5 py-2 text-sm text-[#d6cbb8]">
                                    Voir le profil
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Garantie et qualite',
                            text: 'Moderation active, charte createurs claire, contenu premium.',
                        },
                        {
                            title: 'Createurs verifies',
                            text: 'Badges verifies pour les profils serieux et reguliers.',
                        },
                        {
                            title: 'Paiement securise',
                            text: 'Acces immediat apres paiement. Historique visible dans le profil.',
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

                <section className="glass rounded-3xl p-10 space-y-8">
                    <div className="space-y-4">
                        <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                            Acces et tarifs
                        </p>
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">
                            Pass 5,99 EUR ou abonnement 11,99 EUR.
                        </h2>
                        <p className="text-[#b7ad9c]">
                            La premiere photo est visible. Le reste est floute jusqu&apos;au
                            paiement. Les createurs restent libres et peuvent fixer un prix
                            a l&apos;unite sur leurs contenus.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Pass',
                                price: '5,99 EUR',
                                detail: 'Acces 30 jours',
                            },
                            {
                                title: 'Abonnement',
                                price: '11,99 EUR',
                                detail: 'Acces illimite + chat',
                            },
                            {
                                title: "A l'unite",
                                price: 'Selon createur',
                                detail: 'Prix libre par contenu',
                            },
                        ].map((plan) => (
                            <div
                                key={plan.title}
                                className="rounded-2xl bg-white/5 p-6 shadow-md border border-white/5 space-y-2"
                            >
                                <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                                    {plan.title}
                                </p>
                                <p className="text-2xl font-semibold text-[#f4ede3]">
                                    {plan.price}
                                </p>
                                <p className="text-sm text-[#b7ad9c]">{plan.detail}</p>
                                <button className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm text-[#d6cbb8]">
                                    Choisir
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
                    <div className="glass rounded-3xl p-8 space-y-6">
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">FAQ</h2>
                        {[
                            {
                                q: 'Que voit-on avant paiement ?',
                                a: 'La premiere photo est visible, le reste est floute.',
                            },
                            {
                                q: "Les createurs fixent-ils leurs prix ?",
                                a: "Oui, chaque createur peut fixer ses prix a l'unite.",
                            },
                            {
                                q: 'Le contenu est-il modere ?',
                                a: 'Oui, moderation active et charte stricte.',
                            },
                            {
                                q: 'Puis-je resilier mon abonnement ?',
                                a: 'Oui, a tout moment depuis ton profil.',
                            },
                        ].map((item) => (
                            <div key={item.q} className="border-b border-white/10 pb-4">
                                <p className="text-[#f4ede3] font-semibold">{item.q}</p>
                                <p className="text-[#b7ad9c] mt-2">{item.a}</p>
                            </div>
                        ))}
                    </div>
                    <div className="glass rounded-3xl p-8 space-y-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Support
                        </p>
                        <h3 className="text-2xl font-semibold text-[#f4ede3]">
                            Besoin d&apos;aide ?
                        </h3>
                        <p className="text-[#b7ad9c]">
                            Ecris-nous et une equipe premium repondra rapidement.
                        </p>
                        <button className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold">
                            Contacter le support
                        </button>
                    </div>
                </section>

                <Footer />
            </main>
        </div>
    );
}
