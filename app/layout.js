import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'SecondBrain — AI Second Brain',
    description: 'Archive, search, and revisit your ChatGPT conversations. Your personal conversation vault.',
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
