import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

const client = new MongoClient(process.env.MONGO_URL);
const dbName = process.env.DB_NAME || 'ai_second_brain';
let db;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db(dbName);
    }
    return db;
}

// Parse ChatGPT share link and extract conversation
async function parseChatGPTLink(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Try to extract from __NEXT_DATA__ script tag
        const scriptTag = $('script#__NEXT_DATA__').html();
        if (scriptTag) {
            const data = JSON.parse(scriptTag);
            const serverData = data?.props?.pageProps?.serverResponse?.data;

            if (serverData) {
                const mapping = serverData.mapping || {};
                const messages = [];

                Object.values(mapping).forEach(node => {
                    if (node.message && node.message.content) {
                        const content = node.message.content;
                        const role = node.message.author?.role || 'unknown';

                        if (content.parts && content.parts.length > 0) {
                            const text = content.parts.join('\n');
                            if (text.trim()) {
                                messages.push({
                                    role: role === 'user' ? 'user' : 'assistant',
                                    content: text
                                });
                            }
                        }
                    }
                });

                return messages;
            }
        }

        // Fallback: try to extract from HTML
        const conversation = [];
        $('.min-h-\\[20px\\]').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text) {
                conversation.push({
                    role: i % 2 === 0 ? 'user' : 'assistant',
                    content: text
                });
            }
        });

        return conversation.length > 0 ? conversation : null;
    } catch (error) {
        console.error('Error parsing ChatGPT link:', error);
        throw new Error('Failed to parse ChatGPT link. Please ensure the link is a valid shared conversation.');
    }
}

// Analyze conversation with OpenAI
async function analyzeConversation(messages) {
    try {
        const conversationText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

        const prompt = `Analyze the following ChatGPT conversation and provide a structured analysis.

Conversation:
${conversationText}

Provide your response in the following JSON format:
{
  "title": "A clear, concise title (max 60 chars)",
  "summary": "A comprehensive summary of the conversation (2-3 sentences)",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "code_snippets": ["code snippet if any"]
}

IMPORTANT: Return ONLY valid JSON, no additional text.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);
        return analysis;
    } catch (error) {
        console.error('Error analyzing conversation:', error);
        throw new Error('Failed to analyze conversation with AI.');
    }
}

// Generate embeddings for semantic search
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}

export async function POST(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        // Parse ChatGPT link
        if (path === 'chat/parse') {
            const body = await request.json();
            const { chatUrl } = body;

            if (!chatUrl) {
                return NextResponse.json({ error: 'ChatGPT URL is required' }, { status: 400 });
            }

            // Parse conversation
            const messages = await parseChatGPTLink(chatUrl);
            if (!messages || messages.length === 0) {
                return NextResponse.json({ error: 'Could not extract conversation from URL' }, { status: 400 });
            }

            // Analyze with AI
            const analysis = await analyzeConversation(messages);

            // Generate embedding for semantic search
            const embeddingText = `${analysis.title} ${analysis.summary} ${analysis.key_insights.join(' ')}`;
            const embedding = await generateEmbedding(embeddingText);

            // Save to database
            const note = {
                id: uuidv4(),
                userId: 'default_user', // For MVP, using default user
                title: analysis.title,
                summary: analysis.summary,
                keyInsights: analysis.key_insights || [],
                tags: analysis.tags || [],
                codeSnippets: analysis.code_snippets || [],
                originalUrl: chatUrl,
                messages: messages,
                embedding: embedding,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await db.collection('notes').insertOne(note);

            return NextResponse.json({ success: true, note });
        }

        // Search notes
        if (path === 'notes/search') {
            const body = await request.json();
            const { query, searchType = 'keyword' } = body;

            if (!query) {
                return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
            }

            let notes = [];

            if (searchType === 'semantic' && query.trim()) {
                // Generate embedding for search query
                const queryEmbedding = await generateEmbedding(query);

                if (queryEmbedding) {
                    // Get all notes with embeddings
                    const allNotes = await db.collection('notes')
                        .find({ embedding: { $exists: true } })
                        .toArray();

                    // Calculate cosine similarity
                    const notesWithSimilarity = allNotes.map(note => {
                        if (!note.embedding) return { ...note, similarity: 0 };

                        const similarity = cosineSimilarity(queryEmbedding, note.embedding);
                        return { ...note, similarity };
                    });

                    // Sort by similarity and filter
                    notes = notesWithSimilarity
                        .filter(n => n.similarity > 0.7)
                        .sort((a, b) => b.similarity - a.similarity)
                        .slice(0, 20);
                }
            } else {
                // Keyword search
                notes = await db.collection('notes')
                    .find({
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { summary: { $regex: query, $options: 'i' } },
                            { tags: { $regex: query, $options: 'i' } },
                            { keyInsights: { $elemMatch: { $regex: query, $options: 'i' } } }
                        ]
                    })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .toArray();
            }

            return NextResponse.json({ notes });
        }

        // Create note manually
        if (path === 'notes') {
            const body = await request.json();
            const note = {
                id: uuidv4(),
                userId: 'default_user',
                ...body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await db.collection('notes').insertOne(note);
            return NextResponse.json({ success: true, note });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        // Get all notes
        if (path === 'notes' || path === '') {
            const notes = await db.collection('notes')
                .find({ userId: 'default_user' })
                .sort({ createdAt: -1 })
                .toArray();

            return NextResponse.json({ notes });
        }

        // Get single note
        if (path.startsWith('notes/')) {
            const noteId = path.replace('notes/', '');
            const note = await db.collection('notes').findOne({ id: noteId });

            if (!note) {
                return NextResponse.json({ error: 'Note not found' }, { status: 404 });
            }

            return NextResponse.json({ note });
        }

        // Get tags
        if (path === 'tags') {
            const notes = await db.collection('notes').find({ userId: 'default_user' }).toArray();
            const tagsSet = new Set();
            notes.forEach(note => {
                if (note.tags) {
                    note.tags.forEach(tag => tagsSet.add(tag));
                }
            });
            return NextResponse.json({ tags: Array.from(tagsSet) });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/', '');
        const db = await connectDB();

        if (path.startsWith('notes/')) {
            const noteId = path.replace('notes/', '');
            await db.collection('notes').deleteOne({ id: noteId });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// Helper: Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


