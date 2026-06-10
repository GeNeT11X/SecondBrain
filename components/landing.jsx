'use client';
// Marketing/landing page shown to logged-out visitors.
// Only rendered when Clerk is configured, so Clerk components are safe here.

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import {
    Archive, Search, Tag, Download, Lock, Infinity as InfinityIcon,
    Link2, Sparkles, ChevronRight, MessageSquare, Star, Github
} from 'lucide-react';

const FEATURES = [
    {
        icon: InfinityIcon,
        title: 'Archive forever',
        desc: 'ChatGPT share links expire or get deleted. Your vault keeps a permanent, exact copy of every conversation.',
    },
    {
        icon: Search,
        title: 'Full-text search',
        desc: 'Search across every message in every saved conversation. Find that one answer from months ago in seconds.',
    },
    {
        icon: Tag,
        title: 'Organize with tags',
        desc: 'Tag conversations by topic, project, or anything else. Filter your whole vault with one click.',
    },
    {
        icon: Download,
        title: 'Export to Markdown',
        desc: 'Download any conversation as a clean Markdown file — perfect for Obsidian, Notion, or your own notes.',
    },
    {
        icon: Star,
        title: 'Mark what matters',
        desc: 'Star your most valuable conversations and keep them one tab away, always.',
    },
    {
        icon: Lock,
        title: 'Private by default',
        desc: 'Your vault is yours alone. Every conversation is tied to your account and invisible to everyone else.',
    },
];

const STEPS = [
    {
        icon: Link2,
        step: '01',
        title: 'Copy a share link',
        desc: 'In ChatGPT, hit the share button on any conversation and copy the link.',
    },
    {
        icon: Archive,
        step: '02',
        title: 'Paste & save',
        desc: 'Drop the link into SecondBrain. We extract and archive every message exactly as it was.',
    },
    {
        icon: Sparkles,
        step: '03',
        title: 'Search & revisit',
        desc: 'Search, tag, star, and export your conversations whenever you need them again.',
    },
];

function CTAButton({ children, large = false }) {
    return (
        <SignUpButton mode="modal">
            <button className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all ${large ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'}`}>
                {children}
                <ChevronRight className={`${large ? 'h-5 w-5' : 'h-4 w-4'} group-hover:translate-x-0.5 transition-transform`} />
            </button>
        </SignUpButton>
    );
}

export default function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-32 -right-24 w-[32rem] h-[32rem] bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
                <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
            </div>

            {/* ── Nav ── */}
            <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
                            <Archive className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            SecondBrain
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all">
                                Sign In
                            </button>
                        </SignInButton>
                        <CTAButton>Get Started</CTAButton>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative z-10 container mx-auto px-4 pt-24 pb-20 max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-sm font-medium mb-8">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Your ChatGPT conversations, saved forever
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                    Never lose a great
                    <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        AI conversation again
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    SecondBrain archives your ChatGPT chats into a private, searchable vault.
                    Paste a share link once — search, tag, and export it forever.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <CTAButton large>Start your vault — free</CTAButton>
                </div>
                <p className="text-xs text-slate-600 mt-4">No credit card required · Free to use</p>

                {/* Hero mock card */}
                <div className="mt-16 relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 rounded-3xl blur-xl" />
                    <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/60" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <div className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 text-sm text-slate-500 truncate">
                                https://chatgpt.com/share/abc123…
                            </div>
                            <div className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-semibold">
                                <Archive className="h-4 w-4 mr-2" /> Save Chat
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {['System design deep-dive', 'Trip itinerary: Japan 2026', 'Debugging async Python'].map((t, i) => (
                                <div key={t} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-semibold text-white mb-2 truncate">{t}</div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                        <MessageSquare className="h-3 w-3" /> {12 + i * 7} messages
                                        {i === 0 && <Star className="h-3 w-3 text-amber-400 fill-amber-400 ml-auto" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="relative z-10 container mx-auto px-4 py-20 max-w-5xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How it works</h2>
                <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">Three steps between you and a permanent, searchable archive of your best AI conversations.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {STEPS.map(({ icon: Icon, step, title, desc }) => (
                        <div key={step} className="relative rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-7">
                            <div className="text-5xl font-extrabold text-white/5 absolute top-4 right-5">{step}</div>
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 w-fit mb-5">
                                <Icon className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section className="relative z-10 container mx-auto px-4 py-20 max-w-6xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything your second brain needs</h2>
                <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">Built for people who actually use their AI conversations as a knowledge base.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="group rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 hover:bg-black/50 hover:border-blue-500/20 transition-all duration-300">
                            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-400/20 w-fit mb-4 group-hover:bg-indigo-500/20 transition-colors">
                                <Icon className="h-5 w-5 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-semibold mb-1.5">{title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="relative z-10 container mx-auto px-4 py-24 max-w-3xl text-center">
                <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/15 via-indigo-600/15 to-purple-600/15 backdrop-blur-xl p-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Start building your second brain</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">Free, private, and takes less than a minute to set up.</p>
                    <CTAButton large>Create your free vault</CTAButton>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-white/10 bg-black/20">
                <div className="container mx-auto px-4 py-8 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Archive className="h-4 w-4" />
                        <span>SecondBrain — your personal conversation archive</span>
                    </div>
                    <div className="text-xs text-slate-600">
                        © {new Date().getFullYear()} SecondBrain. Built with Next.js & MongoDB.
                    </div>
                </div>
            </footer>
        </div>
    );
}
