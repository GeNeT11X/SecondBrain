'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Brain, Search, Plus, Tag, Calendar, Code, Lightbulb, Loader2, Sparkles, MessageSquare, X, Zap, TrendingUp, BookOpen, Archive, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatUrl, setChatUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('keyword');
    const [selectedNote, setSelectedNote] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [allTags, setAllTags] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchNotes();
        fetchTags();
    }, []);

    useEffect(() => {
        filterNotes();
    }, [notes, activeTab, searchQuery]);

    const fetchNotes = async () => {
        try {
            const response = await fetch('/api/notes');
            const data = await response.json();
            setNotes(data.notes || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await fetch('/api/tags');
            const data = await response.json();
            setAllTags(data.tags || []);
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const filterNotes = () => {
        let filtered = [...notes];

        if (activeTab !== 'all') {
            filtered = filtered.filter(note =>
                note.tags && note.tags.includes(activeTab)
            );
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(note =>
                note.title?.toLowerCase().includes(query) ||
                note.summary?.toLowerCase().includes(query) ||
                note.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        setFilteredNotes(filtered);
    };

    const handleAddChat = async () => {
        if (!chatUrl.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a ChatGPT share link',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/chat/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatUrl })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process chat');
            }

            toast({
                title: 'Success! ✨',
                description: 'Your chat has been analyzed and saved to your knowledge base',
            });

            setChatUrl('');
            await fetchNotes();
            await fetchTags();

        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a search query',
                variant: 'destructive'
            });
            return;
        }

        if (searchType === 'semantic') {
            setLoading(true);
            try {
                const response = await fetch('/api/notes/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, searchType: 'semantic' })
                });

                const data = await response.json();
                setFilteredNotes(data.notes || []);

                toast({
                    title: 'Search complete',
                    description: `Found ${data.notes?.length || 0} relevant results`,
                });
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Search failed',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
            toast({
                title: 'Deleted',
                description: 'Note removed from your knowledge base',
            });
            await fetchNotes();
            await fetchTags();
            setSelectedNote(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete note',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
            {/* Animated background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            <Toaster />

            {/* Header */}
            <header className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
                                    <Brain className="h-7 w-7 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                                    AI Second Brain
                                </h1>
                                <p className="text-sm text-slate-400 mt-0.5">Your ChatGPT Knowledge Base</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <Sparkles className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-white">{notes.length} Notes</span>
                            </div>
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                                <Zap className="h-4 w-4 text-purple-400" />
                                <span className="text-sm font-medium text-purple-300">AI Powered</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative container mx-auto px-4 py-8 space-y-8">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20 border border-white/10 backdrop-blur-xl p-8 md:p-12">
                    <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                                <Plus className="h-5 w-5 text-blue-300" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Add ChatGPT Conversation</h2>
                        </div>
                        <p className="text-slate-300 mb-6 max-w-2xl text-lg">
                            Transform your ChatGPT conversations into searchable knowledge. Just paste a share link and let AI do the magic ✨
                        </p>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                                <Input
                                    placeholder="https://chatgpt.com/share/..."
                                    value={chatUrl}
                                    onChange={(e) => setChatUrl(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddChat()}
                                    disabled={loading}
                                    className="relative bg-black/40 border-white/10 text-white placeholder:text-slate-500 h-14 text-lg focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <Button
                                onClick={handleAddChat}
                                disabled={loading}
                                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5 mr-2" />
                                        Analyze with AI
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <Card className="border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                                <Search className="h-5 w-5 text-purple-300" />
                            </div>
                            <div>
                                <CardTitle className="text-white text-xl">Search Your Knowledge</CardTitle>
                                <CardDescription className="text-slate-400">Find insights with keyword or semantic AI search</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                                <Input
                                    placeholder="Search by keywords or meaning..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    disabled={loading}
                                    className="relative bg-black/40 border-white/10 text-white placeholder:text-slate-500 h-12 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setSearchType(searchType === 'keyword' ? 'semantic' : 'keyword')}
                                className="h-12 px-6 bg-black/40 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {searchType === 'keyword' ? 'Keyword' : 'Semantic AI'}
                            </Button>
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30"
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 to-blue-700/10 border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <BookOpen className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{notes.length}</p>
                                <p className="text-sm text-slate-400">Total Notes</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/10 to-purple-700/10 border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <Tag className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{allTags.length}</p>
                                <p className="text-sm text-slate-400">Unique Tags</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/10 to-indigo-700/10 border border-indigo-500/20 p-6 hover:border-indigo-500/40 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-500/20">
                                <Lightbulb className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{notes.reduce((acc, note) => acc + (note.keyInsights?.length || 0), 0)}</p>
                                <p className="text-sm text-slate-400">Key Insights</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600/10 to-pink-700/10 border border-pink-500/20 p-6 hover:border-pink-500/40 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-pink-500/20">
                                <Code className="h-6 w-6 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{notes.reduce((acc, note) => acc + (note.codeSnippets?.length || 0), 0)}</p>
                                <p className="text-sm text-slate-400">Code Snippets</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags Filter */}
                <div className="relative">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-black/40 border border-white/10 backdrop-blur-xl p-1 h-auto flex-wrap gap-2">
                            <TabsTrigger
                                value="all"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-slate-300 px-6 py-2.5 rounded-lg font-medium"
                            >
                                All Notes
                            </TabsTrigger>
                            {allTags.slice(0, 6).map(tag => (
                                <TabsTrigger
                                    key={tag}
                                    value={tag}
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-slate-300 px-6 py-2.5 rounded-lg font-medium capitalize"
                                >
                                    {tag}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 backdrop-blur-xl p-16 text-center">
                        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]"></div>
                        <div className="relative">
                            <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 mb-6">
                                <MessageSquare className="h-16 w-16 text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No notes yet</h3>
                            <p className="text-slate-400 text-lg max-w-md mx-auto">
                                {searchQuery ? 'No results found. Try a different search term.' : 'Start building your knowledge base by adding your first ChatGPT conversation'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className="group relative"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                                <Card
                                    className="relative cursor-pointer border-white/10 bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-all duration-300 overflow-hidden h-full"
                                    onClick={() => setSelectedNote(note)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <CardHeader className="relative pb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <CardTitle className="text-lg font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors flex-1">
                                                {note.title}
                                            </CardTitle>
                                            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                                                <Star className="h-4 w-4 text-blue-400" />
                                            </div>
                                        </div>
                                        <CardDescription className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative space-y-4">
                                        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                                            {note.summary}
                                        </p>

                                        {note.tags && note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {note.tags.slice(0, 4).map((tag, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {note.tags.length > 4 && (
                                                    <Badge variant="secondary" className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                        +{note.tags.length - 4}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        <Separator className="bg-white/10" />

                                        <div className="flex items-center justify-between text-xs">
                                            {note.keyInsights && note.keyInsights.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-indigo-400">
                                                    <Lightbulb className="h-3.5 w-3.5" />
                                                    <span>{note.keyInsights.length} insights</span>
                                                </div>
                                            )}
                                            {note.codeSnippets && note.codeSnippets.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-purple-400">
                                                    <Code className="h-3.5 w-3.5" />
                                                    <span>{note.codeSnippets.length} snippets</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note Detail Dialog */}
            <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-900 to-slate-950 border-white/20 text-white backdrop-blur-2xl">
                    {selectedNote && (
                        <>
                            <DialogHeader className="space-y-4 pb-4 border-b border-white/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pr-8">
                                            {selectedNote.title}
                                        </DialogTitle>
                                        <DialogDescription className="flex items-center gap-3 text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(selectedNote.createdAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="max-h-[calc(85vh-200px)] pr-4">
                                <div className="space-y-6 py-4">
                                    {/* Summary */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <Sparkles className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-white">Summary</h3>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed pl-12">{selectedNote.summary}</p>
                                    </div>

                                    <Separator className="bg-white/10" />

                                    {/* Key Insights */}
                                    {selectedNote.keyInsights && selectedNote.keyInsights.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                    <Lightbulb className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <h3 className="font-semibold text-lg text-white">Key Insights</h3>
                                            </div>
                                            <ul className="space-y-3 pl-12">
                                                {selectedNote.keyInsights.map((insight, idx) => (
                                                    <li key={idx} className="text-slate-300 flex gap-3 leading-relaxed">
                                                        <span className="text-indigo-400 font-bold shrink-0">•</span>
                                                        <span>{insight}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <Separator className="bg-white/10" />

                                    {/* Tags */}
                                    {selectedNote.tags && selectedNote.tags.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                                    <Tag className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <h3 className="font-semibold text-lg text-white">Tags</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-12">
                                                {selectedNote.tags.map((tag, idx) => (
                                                    <Badge key={idx} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 px-3 py-1">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Code Snippets */}
                                    {selectedNote.codeSnippets && selectedNote.codeSnippets.length > 0 && (
                                        <>
                                            <Separator className="bg-white/10" />
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                                        <Code className="h-4 w-4 text-pink-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg text-white">Code Snippets</h3>
                                                </div>
                                                <div className="space-y-3 pl-12">
                                                    {selectedNote.codeSnippets.map((snippet, idx) => (
                                                        <pre key={idx} className="bg-black/40 border border-white/10 p-4 rounded-xl text-xs overflow-x-auto">
                                                            <code className="text-blue-300">{snippet}</code>
                                                        </pre>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="flex justify-between pt-4 border-t border-white/10">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteNote(selectedNote.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Delete Note
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedNote(null)}
                                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
        </div>
    );
}


