'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
                <div className="space-y-3">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">Legal</p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">Politique de Confidentialite</h1>
                    <p className="text-[#b7ad9c]">Derniere mise a jour : 27 fevrier 2026</p>
                </div>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">1. Donnees collectees</h2>
                    <p className="text-[#b7ad9c]">
                        Nous collectons les informations necessaires a la creation du
                        compte, a la verification d&apos;age et au traitement des paiements.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">2. Usage</h2>
                    <p className="text-[#b7ad9c]">
                        Les donnees servent a securiser la plateforme, personnaliser
                        l&apos;experience et respecter nos obligations legales.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">3. Conservation</h2>
                    <p className="text-[#b7ad9c]">
                        Les donnees sont conservees pendant la duree necessaire a
                        l&apos;execution du service et conforme aux exigences legales.
                    </p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">4. Contact</h2>
                    <p className="text-[#b7ad9c]">
                        Pour toute demande, ecris a support@monpiedtonpied.com.
                    </p>
                </section>
            </div>
            <Footer />
        </div>
    );
}
