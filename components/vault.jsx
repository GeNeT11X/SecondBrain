'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClerkUserButton, ClerkSignInButton } from '@/components/clerk-user-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Archive, Search, Plus, Calendar, Loader2, MessageSquare, X,
    Star, ExternalLink, Trash2, User, Bot, Clock, ChevronRight,
    BookMarked, Inbox, AlignLeft, Tag, Download, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateTime(iso) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Build a Markdown document from a conversation and its messages */
function buildMarkdown(conv, messages) {
    const lines = [
        `# ${conv.title}`,
        '',
        `> Archived from [ChatGPT](${conv.sourceUrl}) · ${conv.messageCount} messages · saved ${formatDate(conv.createdAt)}`,
    ];
    if (conv.tags?.length) lines.push(`> Tags: ${conv.tags.map(t => `\`${t}\``).join(' ')}`);
    lines.push('', '---', '');
    for (const msg of messages) {
        lines.push(msg.role === 'user' ? '### 👤 You' : '### 🤖 ChatGPT', '', msg.content, '');
    }
    return lines.join('\n');
}

function downloadMarkdown(conv, messages) {
    const md = buildMarkdown(conv, messages);
    const slug = conv.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'conversation';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────
function TagChip({ tag, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-medium">
            <Tag className="h-2.5 w-2.5" />
            {tag}
            {onRemove && (
                <button onClick={() => onRemove(tag)} className="ml-0.5 hover:text-red-400 transition-colors" title={`Remove tag "${tag}"`}>
                    <X className="h-3 w-3" />
                </button>
            )}
        </span>
    );
}

// ─── Conversation Card ────────────────────────────────────────────────────────
function ConversationCard({ conv, onOpen, onToggleImportant, onDelete, onExport, onTagClick }) {
    return (
        <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-500" />
            <Card className="relative border-white/10 bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle
                            className="text-base font-semibold text-white line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors flex-1"
                            onClick={() => onOpen(conv)}
                        >
                            {conv.title}
                        </CardTitle>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleImportant(conv.id); }}
                            className={`shrink-0 p-1.5 rounded-lg transition-all ${conv.isImportant
                                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                                : 'bg-white/5 text-slate-500 border border-white/10 hover:text-amber-400 hover:bg-amber-400/10'}`}
                            title={conv.isImportant ? 'Unmark important' : 'Mark important'}
                        >
                            <Star className={`h-4 w-4 ${conv.isImportant ? 'fill-amber-400' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(conv.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{conv.messageCount} messages</span>
                    </div>
                    {conv.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {conv.tags.map(tag => (
                                <button key={tag} onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }} title={`Filter by "${tag}"`}>
                                    <TagChip tag={tag} />
                                </button>
                            ))}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                        <a
                            href={conv.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Original link
                        </a>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onExport(conv)}
                                title="Export as Markdown"
                                className="h-7 px-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            >
                                <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(conv)}
                                title="Delete conversation"
                                className="h-7 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onOpen(conv)}
                                className="h-7 px-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/20 text-xs"
                            >
                                Open <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white
                ${isUser ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                ${isUser
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm'
                    : 'bg-white/8 border border-white/10 text-slate-200 rounded-tl-sm'}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {msg.content}
                <div className={`text-xs mt-1.5 ${isUser ? 'text-blue-200/60' : 'text-slate-500'}`}>
                    <Clock className="h-2.5 w-2.5 inline mr-1" />
                    {formatDateTime(msg.createdAt)}
                </div>
            </div>
        </div>
    );
}

// ─── Tag Editor (inside conversation dialog) ──────────────────────────────────
function TagEditor({ conv, onUpdateTags }) {
    const [input, setInput] = useState('');

    const addTag = () => {
        const tag = input.trim().toLowerCase();
        if (!tag) return;
        if (conv.tags?.includes(tag)) { setInput(''); return; }
        onUpdateTags(conv.id, [...(conv.tags || []), tag]);
        setInput('');
    };
    const removeTag = (tag) => {
        onUpdateTags(conv.id, (conv.tags || []).filter(t => t !== tag));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 px-6 py-2.5 border-b border-white/10 bg-black/20 shrink-0">
            <Tag className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            {(conv.tags || []).map(tag => (
                <TagChip key={tag} tag={tag} onRemove={removeTag} />
            ))}
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder={conv.tags?.length ? 'Add tag…' : 'Add a tag and press Enter…'}
                maxLength={30}
                className="bg-transparent border-none outline-none text-xs text-slate-300 placeholder:text-slate-600 min-w-[120px] flex-1"
            />
        </div>
    );
}

// ─── Conversation Dialog ──────────────────────────────────────────────────────
function ConversationDialog({ conv, onClose, onToggleImportant, onDelete, onUpdateTags }) {
    const [messages, setMessages] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!conv) return;
        setLoading(true);
        fetch(`/api/conversations/${conv.id}`)
            .then(r => r.json())
            .then(d => setMessages(d.messages || []))
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, [conv?.id]);

    if (!conv) return null;

    const handleExport = () => {
        if (!messages?.length) {
            toast({ title: 'Nothing to export', description: 'Messages are still loading', variant: 'destructive' });
            return;
        }
        downloadMarkdown(conv, messages);
        toast({ title: 'Exported ✓', description: 'Markdown file downloaded' });
    };

    return (
        <Dialog open={!!conv} onOpenChange={onClose}>
            {/*
             * Layout: DialogContent is a full-screen flex column.
             * Header + tag bar are shrink-0; the messages div is min-h-0 +
             * overflow-y-auto so it fills remaining space and scrolls.
             */}
            <DialogContent className="!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 w-screen h-screen max-w-none !rounded-none bg-gradient-to-br from-slate-900 to-slate-950 border-0 text-white flex flex-col p-0">
                <DialogHeader className="px-6 pr-14 pt-5 pb-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-4">

                        {/* ── LEFT: danger zone ── */}
                        <button
                            onClick={() => onDelete(conv)}
                            title="Delete conversation"
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-xs font-medium"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>

                        <div className="w-px h-8 bg-white/10 shrink-0" />

                        {/* ── MIDDLE: title + meta ── */}
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-lg font-bold text-white leading-snug truncate">{conv.title}</DialogTitle>
                            <DialogDescription className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateTime(conv.createdAt)}</span>
                                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{conv.messageCount} messages</span>
                                <a href={conv.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                    <ExternalLink className="h-3 w-3" /> Original
                                </a>
                            </DialogDescription>
                        </div>

                        {/* ── RIGHT: export + star ── */}
                        <button
                            onClick={handleExport}
                            title="Export as Markdown"
                            className="shrink-0 p-2 rounded-lg border bg-white/5 text-slate-400 border-white/10 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onToggleImportant(conv.id)}
                            title={conv.isImportant ? 'Unmark important' : 'Mark important'}
                            className={`shrink-0 p-2 rounded-lg border transition-all ${conv.isImportant
                                ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-amber-400 hover:bg-amber-400/10'}`}
                        >
                            <Star className={`h-4 w-4 ${conv.isImportant ? 'fill-amber-400' : ''}`} />
                        </button>

                    </div>
                </DialogHeader>

                {/* Tag editor bar */}
                <TagEditor conv={conv} onUpdateTags={onUpdateTags} />

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                        </div>
                    ) : messages && messages.length > 0 ? (
                        messages.map((msg, i) => (
                            <MessageBubble key={msg.id || i} msg={msg} />
                        ))
                    ) : (
                        <div className="text-center py-16 text-slate-500">No messages found</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────
function ConfirmDeleteDialog({ conv, onCancel, onConfirm }) {
    if (!conv) return null;
    return (
        <Dialog open={!!conv} onOpenChange={onCancel}>
            <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        Delete this conversation?
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 pt-1">
                        “{conv.title}” and all its messages will be permanently removed from your vault. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onCancel}
                        className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                        Cancel
                    </Button>
                    <Button onClick={() => onConfirm(conv.id)}
                        className="bg-red-600 hover:bg-red-700 text-white">
                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, color = 'blue' }) {
    const colors = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    };
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg border ${colors[color]}`}>
                <Icon className={`h-4 w-4 ${colors[color].split(' ')[0]}`} />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {count !== undefined && (
                <Badge className={`ml-1 text-xs ${colors[color].split(' ').slice(1).join(' ')}`}>{count}</Badge>
            )}
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
            <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{message}</p>
        </div>
    );
}

// ─── Card Grid ────────────────────────────────────────────────────────────────
function CardGrid({ items, handlers }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(c => <ConversationCard key={c.id} conv={c} {...handlers} />)}
        </div>
    );
}

// ─── Main Vault App ───────────────────────────────────────────────────────────
export default function Vault() {
    const [conversations, setConversations] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [activeTag, setActiveTag] = useState(null);
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [chatUrl, setChatUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConv, setSelectedConv] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [activeTab, setActiveTab] = useState('recent'); // recent | important | all
    const { toast } = useToast();

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations?limit=100');
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (e) {
            console.error('Failed to load conversations', e);
        }
    }, []);

    const fetchTags = useCallback(async () => {
        try {
            const res = await fetch('/api/tags');
            const data = await res.json();
            setAllTags(data.tags || []);
        } catch (e) {
            console.error('Failed to load tags', e);
        }
    }, []);

    useEffect(() => { fetchConversations(); fetchTags(); }, [fetchConversations, fetchTags]);

    // ── Save Chat ──────────────────────────────────────────────────────────────
    const handleSaveChat = async () => {
        if (!chatUrl.trim()) {
            toast({ title: 'Enter a URL', description: 'Please paste a ChatGPT share link', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/save-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatUrl })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save chat');
            toast({ title: 'Conversation saved ✓', description: `"${data.conversation.title}"` });
            setChatUrl('');
            await fetchConversations();
            setSearchResults(null);
        } catch (e) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // ── Search ─────────────────────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data.conversations || []);
        } catch (e) {
            toast({ title: 'Search failed', description: e.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => { setSearchResults(null); setSearchQuery(''); };

    // ── Toggle Important ───────────────────────────────────────────────────────
    const handleToggleImportant = async (convId) => {
        try {
            const res = await fetch(`/api/conversations/${convId}/important`, { method: 'PATCH' });
            const data = await res.json();
            setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, isImportant: data.isImportant } : c
            ));
            setSearchResults(prev => prev ? prev.map(c =>
                c.id === convId ? { ...c, isImportant: data.isImportant } : c
            ) : prev);
            setSelectedConv(prev => prev?.id === convId ? { ...prev, isImportant: data.isImportant } : prev);
            toast({ title: data.isImportant ? '⭐ Marked important' : 'Unmarked' });
        } catch (e) {
            toast({ title: 'Error', description: 'Could not update', variant: 'destructive' });
        }
    };

    // ── Tags ───────────────────────────────────────────────────────────────────
    const handleUpdateTags = async (convId, tags) => {
        try {
            const res = await fetch(`/api/conversations/${convId}/tags`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update tags');
            setConversations(prev => prev.map(c => c.id === convId ? { ...c, tags: data.tags } : c));
            setSearchResults(prev => prev ? prev.map(c => c.id === convId ? { ...c, tags: data.tags } : c) : prev);
            setSelectedConv(prev => prev?.id === convId ? { ...prev, tags: data.tags } : prev);
            fetchTags();
        } catch (e) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };

    // ── Export ─────────────────────────────────────────────────────────────────
    const handleExportFromCard = async (conv) => {
        try {
            const res = await fetch(`/api/conversations/${conv.id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load conversation');
            downloadMarkdown(conv, data.messages || []);
            toast({ title: 'Exported ✓', description: 'Markdown file downloaded' });
        } catch (e) {
            toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
        }
    };

    // ── Delete (two-step: request → confirm) ──────────────────────────────────
    const requestDelete = (conv) => setDeleteTarget(conv);

    const confirmDelete = async (convId) => {
        setDeleteTarget(null);
        try {
            await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
            setConversations(prev => prev.filter(c => c.id !== convId));
            if (searchResults) setSearchResults(prev => prev.filter(c => c.id !== convId));
            setSelectedConv(prev => prev?.id === convId ? null : prev);
            fetchTags();
            toast({ title: 'Deleted', description: 'Conversation removed from vault' });
        } catch (e) {
            toast({ title: 'Error', description: 'Could not delete', variant: 'destructive' });
        }
    };

    // ── Derived lists ──────────────────────────────────────────────────────────
    const byTag = activeTag ? conversations.filter(c => c.tags?.includes(activeTag)) : conversations;
    const recent = [...byTag].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    const important = byTag.filter(c => c.isImportant);

    const cardHandlers = {
        onOpen: setSelectedConv,
        onToggleImportant: handleToggleImportant,
        onDelete: requestDelete,
        onExport: handleExportFromCard,
        onTagClick: (tag) => { setActiveTag(tag); setSearchResults(null); },
    };

    const tabs = [
        { id: 'recent', label: 'Recent', icon: Clock, count: Math.min(byTag.length, 6) },
        { id: 'important', label: 'Important', icon: Star, count: important.length },
        { id: 'all', label: 'All Chats', icon: AlignLeft, count: byTag.length },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-8 animate-blob" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-8 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-8 animate-blob animation-delay-4000" />
            </div>

            <Toaster />

            {/* ── Header ── */}
            <header className="relative border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-50 group-hover:opacity-80 transition duration-500" />
                                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
                                    <Archive className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                    TwoBrain
                                </h1>
                                <p className="text-xs text-slate-400">Your personal conversation archive</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <BookMarked className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-white">{conversations.length} saved</span>
                            </div>
                            <ClerkSignInButton />
                            <ClerkUserButton />
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative container mx-auto px-4 py-8 space-y-8 max-w-6xl">

                {/* Save Chat Panel */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/15 via-indigo-600/15 to-purple-600/15 border border-white/10 backdrop-blur-xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Plus className="h-4 w-4 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Save a Conversation</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-5">
                        Paste a public ChatGPT share link. The conversation will be archived exactly as it is — forever, even if the original is deleted.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-15 group-hover:opacity-30 transition" />
                            <Input
                                id="chat-url-input"
                                placeholder="https://chatgpt.com/share/..."
                                value={chatUrl}
                                onChange={e => setChatUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveChat()}
                                disabled={saving}
                                className="relative h-12 bg-black/40 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50"
                            />
                        </div>
                        <Button
                            id="save-chat-btn"
                            onClick={handleSaveChat}
                            disabled={saving}
                            className="h-12 px-7 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all"
                        >
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Archive className="h-4 w-4 mr-2" />Save Chat</>}
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-10 group-hover:opacity-25 transition" />
                        <Input
                            id="search-input"
                            placeholder="Search inside conversations…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="relative h-11 bg-black/40 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/40"
                        />
                    </div>
                    <Button
                        id="search-btn"
                        onClick={handleSearch}
                        disabled={loading}
                        className="h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2">Search</span>
                    </Button>
                    {searchResults !== null && (
                        <Button id="clear-search-btn" variant="outline" onClick={clearSearch}
                            className="h-11 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                            <X className="h-4 w-4 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                {/* Tag Filter Bar */}
                {allTags.length > 0 && searchResults === null && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
                            <Tag className="h-3.5 w-3.5" /> Filter by tag:
                        </span>
                        {allTags.map(({ tag, count }) => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${activeTag === tag
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-indigo-500/15 hover:text-indigo-300 hover:border-indigo-400/25'}`}
                            >
                                {tag}
                                <span className={`px-1.5 rounded-full text-[10px] ${activeTag === tag ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
                            </button>
                        ))}
                        {activeTag && (
                            <button onClick={() => setActiveTag(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-slate-400 hover:text-white transition-colors">
                                <X className="h-3 w-3" /> Clear filter
                            </button>
                        )}
                    </div>
                )}

                {/* Search Results */}
                {searchResults !== null && (
                    <div>
                        <SectionHeader icon={Search} title={`Search results for "${searchQuery}"`} count={searchResults.length} color="slate" />
                        {searchResults.length === 0 ? (
                            <EmptyState message="No conversations match your search." />
                        ) : (
                            <CardGrid items={searchResults} handlers={cardHandlers} />
                        )}
                    </div>
                )}

                {/* Tab Navigation */}
                {searchResults === null && (
                    <div>
                        <div className="flex items-center gap-1 mb-6 bg-black/30 border border-white/10 rounded-xl p-1 w-fit">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {tab.label}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {activeTab === 'recent' && (
                            <div>
                                <SectionHeader icon={Clock} title="Recent Conversations" count={recent.length} color="blue" />
                                {recent.length === 0 ? (
                                    <EmptyState message={activeTag ? `No conversations tagged "${activeTag}".` : 'No conversations yet. Save a ChatGPT link above to get started.'} />
                                ) : (
                                    <CardGrid items={recent} handlers={cardHandlers} />
                                )}
                            </div>
                        )}

                        {activeTab === 'important' && (
                            <div>
                                <SectionHeader icon={Star} title="Important Conversations" count={important.length} color="amber" />
                                {important.length === 0 ? (
                                    <EmptyState message={activeTag ? `No important conversations tagged "${activeTag}".` : 'No important conversations yet. Click the ⭐ on any card to mark it.'} />
                                ) : (
                                    <CardGrid items={important} handlers={cardHandlers} />
                                )}
                            </div>
                        )}

                        {activeTab === 'all' && (
                            <div>
                                <SectionHeader icon={Inbox} title="All Conversations" count={byTag.length} color="slate" />
                                {byTag.length === 0 ? (
                                    <EmptyState message={activeTag ? `No conversations tagged "${activeTag}".` : 'Your vault is empty. Save a ChatGPT share link to begin.'} />
                                ) : (
                                    <CardGrid items={byTag} handlers={cardHandlers} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Conversation Detail Dialog */}
            <ConversationDialog
                conv={selectedConv}
                onClose={() => setSelectedConv(null)}
                onToggleImportant={handleToggleImportant}
                onDelete={requestDelete}
                onUpdateTags={handleUpdateTags}
            />

            {/* Delete Confirmation */}
            <ConfirmDeleteDialog
                conv={deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
