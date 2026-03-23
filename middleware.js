// middleware.js — Clerk authentication middleware for Next.js
// Placed at the project root so Next.js picks it up automatically.

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const HAS_CLERK = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
);

// Routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
    '/',              // homepage is always public
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/(.*)',      // API routes handle auth themselves
]);

export default clerkMiddleware(async (auth, request) => {
    // If Clerk keys are missing, skip authentication entirely
    if (!HAS_CLERK) return;
    // Protect all routes except the explicitly public ones
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
