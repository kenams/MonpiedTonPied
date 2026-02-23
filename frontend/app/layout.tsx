import type { Metadata } from 'next';
import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const displayFont = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-display',
    weight: ['400', '500', '600', '700'],
});

const bodyFont = Source_Sans_3({
    subsets: ['latin'],
    variable: '--font-body',
    weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
    title: 'MonPiedTonPied',
    description: 'Plateforme communautaire',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body
                className={`${displayFont.variable} ${bodyFont.variable} font-sans`}
                suppressHydrationWarning
            >
                {children}
            </body>
        </html>
    );
}
