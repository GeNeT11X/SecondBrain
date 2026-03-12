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

/** Extract share ID from any supported ChatGPT share URL format */
function extractShareId(url) {
    // Handles: chatgpt.com/share/abc123 and chatgpt.com/share/e/abc123
    const match = url.match(/(?:chatgpt\.com|chat\.openai\.com)\/share\/(?:e\/)?([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

/** Recursively search an object for a 'mapping' or 'linear_conversation' key */
function deepFindMapping(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 10) return null;
    if (obj.mapping && typeof obj.mapping === 'object' && !Array.isArray(obj.mapping)) {
        const vals = Object.values(obj.mapping);
        if (vals.some(v => v?.message?.content)) return obj.mapping;
    }
    if (obj.linear_conversation && Array.isArray(obj.linear_conversation)) {
        if (obj.linear_conversation.some(v => v?.message?.content)) {
            return obj.linear_conversation;
        }
    }
    for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
            const found = deepFindMapping(val, depth + 1);
            if (found) return found;
        }
    }
    return null;
}

/** Parse messages from a ChatGPT mapping object or linear_conversation array */
function parseMappingToMessages(mapping) {
    const messages = [];
    let order = 0;

    const nodes = Array.isArray(mapping) ? mapping : Object.values(mapping);
    for (const node of nodes) {
        const msg = node?.message;
        if (!msg || !msg.content) continue;
        const role = msg.author?.role;
        if (!role || role === 'system' || role === 'tool') continue;

        let text = '';
        const parts = msg.content?.parts || [];
        if (parts.length > 0) {
            text = parts
                .filter(p => typeof p === 'string')
                .join('\n')
                .trim();
        } else if (typeof msg.content?.text === 'string') {
            text = msg.content.text.trim();
        }

        if (text) {
            messages.push({
                role: role === 'user' ? 'user' : 'assistant',
                content: text,
                messageOrder: order++,
                createdAt: msg.create_time
                    ? new Date(msg.create_time * 1000).toISOString()
                    : new Date().toISOString()
            });
        }
    }
    return messages;
}

/** Browser-like headers to avoid bot detection */
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
};

async function fetchRawMessages(url) {
    const shareId = extractShareId(url);
    console.log(`[save-chat] Fetching share URL: ${url}, extractedId: ${shareId}`);

    // ── Strategy 1: ChatGPT share JSON API endpoints ──────────────────────────
    // Try multiple endpoints — backend-anon is the unauthenticated public share API
    if (shareId) {
        const endpoints = [
            `https://chatgpt.com/backend-anon/share/${shareId}`,
            `https://chatgpt.com/backend-api/share/${shareId}`,
            `https://chat.openai.com/backend-api/share/${shareId}`,
        ];
        for (const endpoint of endpoints) {
            try {
                console.log(`[save-chat] Trying API endpoint: ${endpoint}`);
                const resp = await fetch(endpoint, {
                    headers: {
                        ...BROWSER_HEADERS,
                        'Accept': 'application/json',
                        'Referer': `https://chatgpt.com/share/${shareId}`,
                    },
                    redirect: 'follow',
                });
                console.log(`[save-chat] API response status: ${resp.status}`);
                if (resp.ok) {
                    const data = await resp.json();
                    const mapping = data?.linear_conversation || data?.mapping || deepFindMapping(data);
                    if (mapping) {
                        const messages = parseMappingToMessages(mapping);
                        if (messages.length > 0) {
                            console.log(`[save-chat] Strategy 1 succeeded (${endpoint}): ${messages.length} messages`);
                            return messages;
                        }
                    }
                }
            } catch (err) {
                console.warn(`[save-chat] Strategy 1 endpoint ${endpoint} failed:`, err.message);
            }
        }
    }

    // ── Strategy 2: Fetch HTML and parse embedded JSON ──────────────────────
    let html = '';
    try {
        console.log(`[save-chat] Fetching HTML page: ${url}`);
        const resp = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' });
        console.log(`[save-chat] HTML fetch status: ${resp.status}, content-type: ${resp.headers.get('content-type')}`);
        html = await resp.text();
        console.log(`[save-chat] HTML length: ${html.length}`);
    } catch (err) {
        console.error('[save-chat] Failed to fetch HTML:', err.message);
    }

    if (html) {
        const $ = cheerio.load(html);

        // Strategy 2a: __NEXT_DATA__ script tag (multiple path variations)
        const nextDataRaw = $('script#__NEXT_DATA__').html();
        if (nextDataRaw) {
            try {
                const nextData = JSON.parse(nextDataRaw);
                // Try all known pageProps paths for different ChatGPT frontend versions
                const candidatePaths = [
                    nextData?.props?.pageProps?.serverResponse?.data?.mapping,
                    nextData?.props?.pageProps?.data?.mapping,
                    nextData?.props?.pageProps?.sharedConversation?.mapping,
                    nextData?.props?.pageProps?.conversation?.mapping,
                    nextData?.props?.pageProps?.initialData?.mapping,
                    nextData?.props?.pageProps?.serverResponse?.data?.linear_conversation,
                    nextData?.props?.pageProps?.data?.linear_conversation,
                    nextData?.props?.pageProps?.sharedConversation?.linear_conversation,
                ];
                for (const candidate of candidatePaths) {
                    if (candidate) {
                        const messages = parseMappingToMessages(candidate);
                        if (messages.length > 0) {
                            console.log(`[save-chat] Strategy 2a (__NEXT_DATA__ path) succeeded: ${messages.length} messages`);
                            return messages;
                        }
                    }
                }
                // Deep recursive search as last resort
                const deepMapping = deepFindMapping(nextData);
                if (deepMapping) {
                    const messages = parseMappingToMessages(deepMapping);
                    if (messages.length > 0) {
                        console.log(`[save-chat] Strategy 2a (__NEXT_DATA__ deep search) succeeded: ${messages.length} messages`);
                        return messages;
                    }
                }
            } catch (err) {
                console.warn('[save-chat] Strategy 2a (__NEXT_DATA__) parse failed:', err.message);
            }
        } else {
            console.log('[save-chat] No __NEXT_DATA__ script tag found in HTML');
        }

        // Strategy 2b: React Router v7 / Remix RSC streaming format (ChatGPT's current format)
        // ChatGPT now uses: streamController.enqueue(new TextEncoder().encode("0:{...json...}"))
        // The conversation data is base64 or string-embedded in these enqueue() calls
        const allScripts = $('script').toArray();
        for (const script of allScripts) {
            if ($(script).attr('src')) continue; // skip external scripts
            const scriptText = $(script).html() || '';

            // Look for React Router RSC streaming payload — data chunks encoded as strings
            // Pattern: encode("0:{\"linear_conversation\":[...],...}") or similar
            const encodeMatches = scriptText.match(/encode\("((?:[^"\\]|\\.)*)"\)/g) || [];
            for (const match of encodeMatches) {
                try {
                    // Unescape the string inside encode("...")
                    const inner = match.slice(8, -2).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    // RSC format: "0:{json}" or "1:{json}" etc.
                    const jsonStr = inner.replace(/^\d+:/, '');
                    const parsed = JSON.parse(jsonStr);
                    const deepMapping = deepFindMapping(parsed);
                    if (deepMapping) {
                        const messages = parseMappingToMessages(deepMapping);
                        if (messages.length > 0) {
                            console.log(`[save-chat] Strategy 2b (RSC encode stream) succeeded: ${messages.length} messages`);
                            return messages;
                        }
                    }
                } catch (_) { /* skip invalid */ }
            }

            // Also scan for any JSON objects in scripts containing conversation keywords
            if (!scriptText.includes('linear_conversation') && !scriptText.includes('"mapping"')) continue;
            const jsonChunks = scriptText.match(/\{[^<]{50,}\}/gs) || [];
            for (const chunk of jsonChunks) {
                try {
                    const parsed = JSON.parse(chunk);
                    const deepMapping = deepFindMapping(parsed);
                    if (deepMapping) {
                        const messages = parseMappingToMessages(deepMapping);
                        if (messages.length > 0) {
                            console.log(`[save-chat] Strategy 2b (inline script JSON) succeeded: ${messages.length} messages`);
                            return messages;
                        }
                    }
                } catch (_) { /* not valid JSON, skip */ }
            }
        }

        // Strategy 3: data-message-author-role attributes (server-rendered HTML fallback)
        const domMessages = [];
        let order = 0;
        $('[data-message-author-role]').each((_, elem) => {
            const role = $(elem).attr('data-message-author-role');
            const text = $(elem).text().trim();
            if (text && (role === 'user' || role === 'assistant')) {
                domMessages.push({ role, content: text, messageOrder: order++, createdAt: new Date().toISOString() });
            }
        });
        if (domMessages.length > 0) {
            console.log(`[save-chat] Strategy 3 (data-message-author-role) succeeded: ${domMessages.length} messages`);
            return domMessages;
        }

        // Strategy 4: article elements (last resort)
        const articleMessages = [];
        $('article').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text) {
                articleMessages.push({
                    role: i % 2 === 0 ? 'user' : 'assistant',
                    content: text,
                    messageOrder: i,
                    createdAt: new Date().toISOString()
                });
            }
        });
        if (articleMessages.length > 0) {
            console.log(`[save-chat] Strategy 4 (article elements) succeeded: ${articleMessages.length} messages`);
            return articleMessages;
        }

        console.log(`[save-chat] All strategies failed. Page title: "${$('title').text()}". HTML length: ${html.length}`);
    }

    console.error('[save-chat] Could not extract any messages from:', url);
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
