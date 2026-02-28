'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function CGVPage() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
                <div className="space-y-3">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">Legal</p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">Conditions Generales de Vente</h1>
                    <p className="text-[#b7ad9c]">Derniere mise a jour : 27 fevrier 2026</p>
                </div>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">1. Offres</h2>
                    <p className="text-[#b7ad9c]">
                        Pass 5,99 EUR (30 jours) ou abonnement 11,99 EUR. L&apos;achat
                        a l&apos;unite est fixe par chaque createur.
                    </p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>Pass: acces complet aux collections pendant 30 jours.</li>
                        <li>Abonnement: acces complet + chat illimite.</li>
                        <li>A l&apos;unite: prix libre par createur.</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">2. Paiements</h2>
                    <p className="text-[#b7ad9c]">
                        Les paiements sont securises et traites par Stripe. L&apos;acces
                        est active apres validation du paiement.
                    </p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>Transactions en EUR.</li>
                        <li>Facture disponible dans le profil.</li>
                        <li>En cas d&apos;echec, l&apos;acces reste bloque.</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">3. Repartition</h2>
                    <p className="text-[#b7ad9c]">
                        Les createurs sont remuneres apres deduction des frais de
                        plateforme. Le taux actuel est affiche dans l&apos;interface
                        createur.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">4. Demandes personnalisees</h2>
                    <p className="text-[#b7ad9c]">
                        Le consommateur peut commander un contenu sur demande. Le
                        createur dispose de 48h pour repondre. Le contenu doit rester
                        strictement autour des pieds.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">5. Remboursements</h2>
                    <p className="text-[#b7ad9c]">
                        Les remboursements sont examines au cas par cas selon les
                        politiques en vigueur et le respect de la charte.
                    </p>
                </section>
            </div>
            <Footer />
        </div>
    );
}
