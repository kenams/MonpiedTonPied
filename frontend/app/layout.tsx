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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: 'MonPiedTonPied',
    description: 'Plateforme premium pour createurs et collectionneurs.',
    openGraph: {
        title: 'MonPiedTonPied',
        description: 'Plateforme premium pour createurs et collectionneurs.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MonPiedTonPied',
        description: 'Plateforme premium pour createurs et collectionneurs.',
    },
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
