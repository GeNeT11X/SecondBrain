import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

// ─── MongoDB ───────────────────────────────────────────────────────────────────
const client = new MongoClient(process.env.MONGO_URL);
const dbName = process.env.DB_NAME || 'ai_second_brain';
let db;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db(dbName);
        // Ensure indexes exist
        await db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('conversations').createIndex({ userId: 1, isImportant: 1 });
        await db.collection('messages').createIndex({ conversationId: 1, messageOrder: 1 });
    }
    return db;
}

// ─── Chat Fetching ─────────────────────────────────────────────────────────────
async function fetchRawMessages(url) {
    // Strategy 1: ChatGPT backend share API
    const shareIdMatch = url.match(/(?:chatgpt\.com|chat\.openai\.com)\/share\/([a-zA-Z0-9_-]+)/);
    if (shareIdMatch) {
        const shareId = shareIdMatch[1];
        try {
            const apiResponse = await fetch(`https://chatgpt.com/backend-api/share/${shareId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                }
            });
            if (apiResponse.ok) {
                const shareData = await apiResponse.json();
                const mapping = shareData?.linear_conversation || shareData?.mapping;
                const messages = [];

                if (Array.isArray(mapping)) {
                    let order = 0;
                    for (const node of mapping) {
                        const msg = node?.message;
                        if (!msg || !msg.content) continue;
                        const role = msg.author?.role;
                        if (!role || role === 'system' || role === 'tool') continue;
                        const parts = msg.content?.parts || [];
                        const text = parts.filter(p => typeof p === 'string').join('\n').trim();
                        if (text) {
                            messages.push({
                                role: role === 'user' ? 'user' : 'assistant',
                                content: text,
                                messageOrder: order++,
                                createdAt: msg.create_time ? new Date(msg.create_time * 1000).toISOString() : new Date().toISOString()
                            });
                        }
                    }
                } else if (mapping && typeof mapping === 'object') {
                    let order = 0;
                    Object.values(mapping).forEach(node => {
                        const msg = node?.message;
                        if (!msg || !msg.content) return;
                        const role = msg.author?.role;
                        if (!role || role === 'system' || role === 'tool') return;
                        const parts = msg.content?.parts || [];
                        const text = parts.filter(p => typeof p === 'string').join('\n').trim();
                        if (text) {
                            messages.push({
                                role: role === 'user' ? 'user' : 'assistant',
                                content: text,
                                messageOrder: order++,
                                createdAt: msg.create_time ? new Date(msg.create_time * 1000).toISOString() : new Date().toISOString()
                            });
                        }
                    });
                }

                if (messages.length > 0) return messages;
            }
        } catch (err) {
            console.warn('Backend API strategy failed, falling back to HTML parsing:', err.message);
        }
    }

    // Strategy 2: Fetch HTML and parse __NEXT_DATA__
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const scriptTag = $('script#__NEXT_DATA__').html();
    if (scriptTag) {
        try {
            const data = JSON.parse(scriptTag);
            const mapping = data?.props?.pageProps?.serverResponse?.data?.mapping || {};
            const messages = [];
            let order = 0;
            Object.values(mapping).forEach(node => {
                if (node.message && node.message.content) {
                    const role = node.message.author?.role || 'unknown';
                    if (role === 'system' || role === 'tool') return;
                    const parts = node.message.content?.parts || [];
                    const text = parts.filter(p => typeof p === 'string').join('\n').trim();
                    if (text) {
                        messages.push({
                            role: role === 'user' ? 'user' : 'assistant',
                            content: text,
                            messageOrder: order++,
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            });
            if (messages.length > 0) return messages;
        } catch (_) { /* fall through */ }
    }

    // Strategy 3: data-message-author-role attributes
    const conversation = [];
    let order = 0;
    $('[data-message-author-role]').each((_, elem) => {
        const role = $(elem).attr('data-message-author-role');
        const text = $(elem).text().trim();
        if (text && (role === 'user' || role === 'assistant')) {
            conversation.push({ role, content: text, messageOrder: order++, createdAt: new Date().toISOString() });
        }
    });
    if (conversation.length > 0) return conversation;

    // Strategy 4: article elements
    $('article').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) {
            conversation.push({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: text,
                messageOrder: i,
                createdAt: new Date().toISOString()
            });
        }
    });
    if (conversation.length > 0) return conversation;

    return null;
}

// Derive a title from the first user message (no LLM)
function deriveTitle(messages) {
    const first = messages.find(m => m.role === 'user');
    if (!first) return 'Untitled Conversation';
    return first.content.slice(0, 80).replace(/\n/g, ' ').trim() + (first.content.length > 80 ? '…' : '');
}

// ─── POST handlers ─────────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        // POST /api/save-chat
        if (path === 'save-chat') {
            const body = await request.json();
            const { chatUrl } = body;

            if (!chatUrl) {
                return NextResponse.json({ error: 'ChatGPT URL is required' }, { status: 400 });
            }

            const rawMessages = await fetchRawMessages(chatUrl);
            if (!rawMessages || rawMessages.length === 0) {
                return NextResponse.json({
                    error: 'Could not extract conversation from this link. Make sure the ChatGPT conversation is shared publicly and the link is valid.'
                }, { status: 400 });
            }

            const conversationId = uuidv4();
            const title = deriveTitle(rawMessages);
            const now = new Date().toISOString();

            // Insert conversation record
            const conversation = {
                id: conversationId,
                userId: 'default_user',
                title,
                sourceUrl: chatUrl,
                isImportant: false,
                messageCount: rawMessages.length,
                createdAt: now,
            };
            await db.collection('conversations').insertOne(conversation);

            // Insert raw messages (exact content, no modification)
            const messageDocs = rawMessages.map(m => ({
                id: uuidv4(),
                conversationId,
                role: m.role,
                content: m.content,           // exact, unmodified
                messageOrder: m.messageOrder,
                createdAt: m.createdAt || now,
            }));
            await db.collection('messages').insertMany(messageDocs);

            return NextResponse.json({ success: true, conversation });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// ─── GET handlers ──────────────────────────────────────────────────────────────
export async function GET(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        // GET /api/conversations  — paginated list
        if (path === 'conversations' || path === '') {
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const skip = (page - 1) * limit;

            const [conversations, total] = await Promise.all([
                db.collection('conversations')
                    .find({ userId: 'default_user' })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                db.collection('conversations').countDocuments({ userId: 'default_user' })
            ]);

            return NextResponse.json({ conversations, total, page, limit });
        }

        // GET /api/conversations/:id — full conversation with messages
        if (path.startsWith('conversations/')) {
            const convId = path.replace('conversations/', '');
            const [conversation, messages] = await Promise.all([
                db.collection('conversations').findOne({ id: convId }),
                db.collection('messages')
                    .find({ conversationId: convId })
                    .sort({ messageOrder: 1 })
                    .toArray()
            ]);

            if (!conversation) {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }

            return NextResponse.json({ conversation, messages });
        }

        // GET /api/search?q=keyword
        if (path === 'search') {
            const q = url.searchParams.get('q') || '';
            if (!q.trim()) {
                return NextResponse.json({ conversations: [] });
            }

            // Find matching message content (exact keyword, no LLM)
            const matchingMsgs = await db.collection('messages')
                .find({ content: { $regex: q, $options: 'i' } })
                .toArray();

            const conversationIds = [...new Set(matchingMsgs.map(m => m.conversationId))];

            // Also search by conversation title
            const titleMatches = await db.collection('conversations')
                .find({
                    userId: 'default_user',
                    title: { $regex: q, $options: 'i' }
                })
                .toArray();

            const titleMatchIds = titleMatches.map(c => c.id);
            const allIds = [...new Set([...conversationIds, ...titleMatchIds])];

            const conversations = await db.collection('conversations')
                .find({ id: { $in: allIds } })
                .sort({ createdAt: -1 })
                .toArray();

            return NextResponse.json({ conversations, query: q });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// ─── PATCH handler ─────────────────────────────────────────────────────────────
export async function PATCH(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        // PATCH /api/conversations/:id/important
        if (path.match(/^conversations\/[^/]+\/important$/)) {
            const convId = path.replace('conversations/', '').replace('/important', '');
            const conversation = await db.collection('conversations').findOne({ id: convId });
            if (!conversation) {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }

            const newValue = !conversation.isImportant;
            await db.collection('conversations').updateOne(
                { id: convId },
                { $set: { isImportant: newValue } }
            );

            return NextResponse.json({ success: true, isImportant: newValue });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// ─── DELETE handler ────────────────────────────────────────────────────────────
export async function DELETE(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        // DELETE /api/conversations/:id
        if (path.startsWith('conversations/')) {
            const convId = path.replace('conversations/', '');
            await Promise.all([
                db.collection('conversations').deleteOne({ id: convId }),
                db.collection('messages').deleteMany({ conversationId: convId })
            ]);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
