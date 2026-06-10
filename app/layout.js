import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: 'SecondBrain — Never lose a ChatGPT conversation again',
        template: '%s · SecondBrain',
    },
    description: 'Archive your ChatGPT conversations into a private, searchable vault. Paste a share link once — search, tag, star, and export it forever.',
    keywords: ['ChatGPT', 'archive', 'second brain', 'knowledge base', 'AI conversations', 'export', 'search'],
    openGraph: {
        title: 'SecondBrain — Never lose a ChatGPT conversation again',
        description: 'Archive your ChatGPT conversations into a private, searchable vault. Search, tag, star, and export them forever.',
        url: BASE_URL,
        siteName: 'SecondBrain',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SecondBrain — Never lose a ChatGPT conversation again',
        description: 'Archive your ChatGPT conversations into a private, searchable vault.',
    },
    robots: { index: true, follow: true },
};

const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }) {
    // Wrap with ClerkProvider only when Clerk keys are configured.
    // Without keys the app runs in "no-auth" mode for local development.
    if (hasClerkKey) {
        return (
            <ClerkProvider>
                <html lang="en">
                    <body className={inter.className}>{children}</body>
                </html>
            </ClerkProvider>
        );
    }

    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
