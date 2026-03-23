'use client';
// Dedicated client boundary for Clerk auth UI components.
// Clerk v7 removed SignedIn/SignedOut — use useAuth hook instead.

import { UserButton, SignInButton, useAuth } from '@clerk/nextjs';

// Process env is inlined at build time by Next.js (NEXT_PUBLIC_ vars only)
const HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkUserButton() {
    const { isSignedIn } = useAuth();
    // Render nothing if Clerk is not configured yet (local dev without keys)
    if (!HAS_CLERK) return null;
    if (!isSignedIn) return null;
    return (
        <UserButton
            afterSignOutUrl="/"
            appearance={{
                elements: {
                    avatarBox: 'w-9 h-9 ring-2 ring-blue-500/40 hover:ring-blue-500/70 transition-all',
                }
            }}
        />
    );
}

export function ClerkSignInButton() {
    const { isSignedIn } = useAuth();
    if (!HAS_CLERK) return null;
    if (isSignedIn) return null;
    return (
        <SignInButton mode="modal">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/20 text-blue-300 text-sm font-medium transition-all">
                Sign In
            </button>
        </SignInButton>
    );
}
