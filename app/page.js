'use client';
// Auth gate: logged-out visitors see the landing page, signed-in users
// see their vault. Without Clerk keys (local dev) the vault renders directly.

import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import Vault from '@/components/vault';
import Landing from '@/components/landing';

// Inlined at build time — NEXT_PUBLIC_ vars only
const HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// useAuth() must only be called inside <ClerkProvider>, so this inner
// component is only mounted when Clerk is configured (layout.js wraps the
// tree with ClerkProvider in that case).
function AuthGate() {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }

    return isSignedIn ? <Vault /> : <Landing />;
}

export default function Home() {
    if (!HAS_CLERK) return <Vault />;
    return <AuthGate />;
}
