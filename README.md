# AI Second Brain for ChatGPT 🧠✨

A production-ready SaaS application that helps you organize, summarize, and search your ChatGPT conversations automatically. Build your personal knowledge base from your AI chats.


### Prerequisites

- MongoDB instance (local or cloud)

### Installation

1. **Install dependencies**:
```bash
yarn install
```

2. **Configure environment variables** (`.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_second_brain
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_BASE_URL=your_app_url
```

3. **Start the development server**:
```bash
yarn dev
```

4. **Access the application**:
Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 How to Use

### Adding a ChatGPT Conversation

1. **Create a share link** from ChatGPT:
   - Open any ChatGPT conversation
   - Click the share button (↗️) in the top right
   - Copy the share link (format: `https://chatgpt.com/share/...`)

2. **Paste the link** into the AI Second Brain:
   - Go to the "Add ChatGPT Conversation" section
   - Paste your share link
   - Click "Analyze" button

3. **AI processes your conversation**:
   - Extracts all messages
   - Generates title, summary, insights, and tags
   - Creates vector embeddings for semantic search
   - Saves to your knowledge base

### Searching Your Knowledge

**Keyword Search**:
- Type any text in the search bar
- Searches through titles, summaries, tags, and insights
- Real-time filtering as you type

**Semantic Search**:
- Click "Keyword" button to switch to "Semantic" mode
- Enter your query describing what you're looking for
- AI finds conceptually similar notes, not just keyword matches
- Example: Search "authentication best practices" to find notes about security, JWT, OAuth, etc.

### Organizing Notes

- **Filter by Tags**: Click tag tabs to view notes by category
- **View Details**: Click any note card to see full details
- **Delete Notes**: Open note details and click "Delete Note"

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **AI/ML**: OpenAI GPT-4-turbo, text-embedding-3-small
- **Styling**: Tailwind CSS with custom glassmorphic design

### Project Structure
```
/app
├── app/
│   ├── api/[[...path]]/route.js   # Backend API (all endpoints)
│   ├── page.js                    # Frontend UI (main app)
│   ├── layout.js                  # Root layout
│   └── globals.css                # Global styles
├── components/ui/                 # shadcn UI components
├── lib/                          # Utility functions
├── tests/                        # Test files
└── .env                          # Environment variables
```

### API Endpoints

**POST /api/chat/parse**
- Parse ChatGPT share link and create note
- Body: `{ chatUrl: string }`
- Returns: Created note with AI analysis

**GET /api/notes**
- Retrieve all notes for user
- Returns: Array of notes

**GET /api/notes/:id**
- Get single note by ID
- Returns: Note object

**POST /api/notes/search**
- Search notes (keyword or semantic)
- Body: `{ query: string, searchType: 'keyword' | 'semantic' }`
- Returns: Array of matching notes

**GET /api/tags**
- Get all unique tags
- Returns: Array of tag strings

**DELETE /api/notes/:id**
- Delete a note
- Returns: Success status

## 🎨 UI Features

- **Glassmorphic Design**: Modern frosted glass effect with backdrop blur
- **Gradient Accents**: Beautiful blue-to-indigo gradients
- **Responsive Grid**: Adapts to mobile, tablet, and desktop
- **Smooth Animations**: Hover effects and transitions
- **Modal Details**: Full-screen note viewer with scrollable content
- **Toast Notifications**: User feedback for all actions
- **Dark Mode Ready**: Prepared for dark theme switching

## 🧪 Testing

Run the test suite:

```bash
# Test basic API connectivity
node tests/test_chat_parser.js

# Test full workflow (CRUD operations)
node tests/test_full_workflow.js
```

## 🔧 Development Notes

### ChatGPT Link Parsing
The parser extracts conversations from ChatGPT share links by:
1. Fetching the HTML page
2. Parsing `__NEXT_DATA__` JSON from the page
3. Extracting message nodes from the conversation mapping
4. Cleaning and structuring the dialogue

### Vector Search Implementation
- Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- Stores embeddings alongside notes in MongoDB
- Calculates cosine similarity for semantic matching
- Returns results with similarity scores

### AI Analysis
GPT-4-turbo analyzes conversations with structured JSON output:
- Generates concise, meaningful titles
- Creates 2-3 sentence summaries
- Extracts 3-5 key insights
- Suggests relevant tags
- Identifies and extracts code snippets

## 📝 Future Enhancements

Planned features for future versions:
- [ ] User authentication (multi-user support)
- [ ] Stripe subscription system
- [ ] Export notes to Markdown/PDF
- [ ] Folder organization
- [ ] Note linking and relationships
- [ ] Browser extension for one-click saving
- [ ] Collaborative knowledge bases
- [ ] Advanced ChromaDB integration
- [ ] Custom AI analysis prompts
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is an MVP version. Contributions welcome!

## 📄 License

MIT License - feel free to use for your own projects

---

## 🚀 Production Deployment Guide

This app deploys as a **single Next.js project to Vercel**. The API routes and frontend are bundled together — no separate backend server is needed.

### Prerequisites

- [Vercel account](https://vercel.com) (free tier works)
- [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (free M0 cluster)
- [Clerk account](https://clerk.com) (free tier works)
- GitHub repository with this code

---

### Step 1 — MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free **M0 cluster**
2. Click **Database Access** → Add a database user with a strong password
3. Click **Network Access** → Add IP `0.0.0.0/0` (allow all — Vercel uses dynamic IPs)
4. Click **Connect** → **Connect your application** → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai_second_brain?retryWrites=true&w=majority
   ```
5. Save this as your `MONGODB_URI`

---

### Step 2 — Clerk Authentication

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create a new application
2. Choose your sign-in methods (Email, Google, GitHub, etc.)
3. In **API Keys**, copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → starts with `pk_live_` or `pk_test_`
   - `CLERK_SECRET_KEY` → starts with `sk_live_` or `sk_test_`
4. In **Paths** settings, configure:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`

---

### Step 3 — Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. Vercel auto-detects Next.js — keep default settings
4. Add all **Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Your Atlas connection string |
   | `DB_NAME` | `ai_second_brain` |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard |
   | `CLERK_SECRET_KEY` | From Clerk dashboard |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/` |
   | `NEXT_PUBLIC_BASE_URL` | Your Vercel app URL (e.g. `https://yourapp.vercel.app`) |
   | `CORS_ORIGINS` | Your Vercel app URL |

5. Click **Deploy**

---

### Step 4 — Configure Clerk Allowed Origins

After deploying, go back to Clerk Dashboard:
1. **Domains** → Add your Vercel production URL (e.g. `https://yourapp.vercel.app`)
2. This allows Clerk to issue tokens for your production domain

---

### Local Development with Auth

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Clerk test keys (from Clerk dashboard → Development instance)
3. Keep `MONGO_URL=mongodb://localhost:27017` for local DB
4. Run:
   ```bash
   yarn dev
   ```

> **Note:** The first time you visit `http://localhost:3000` after adding Clerk keys, you'll be redirected to sign in. Create an account — each user gets their own private vault.

---

**Built with ❤️ using Next.js, MongoDB, and Clerk**
