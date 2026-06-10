# SecondBrain 🧠

**Never lose a great ChatGPT conversation again.**

SecondBrain is a production-ready SaaS app that archives your ChatGPT conversations into a private, searchable vault. Paste a public share link once — the full conversation is saved forever, even if the original link expires or is deleted.

Runs entirely on **free tiers**: Vercel (hosting) + MongoDB Atlas (database) + Clerk (authentication). $0/month.

---

## ✨ Features

- **Archive forever** — paste a `chatgpt.com/share/...` link and every message is extracted and stored exactly as it was
- **Multi-user accounts** — Clerk authentication (email, Google, GitHub, …); every user gets a private vault
- **Full-text search** — search across every message and title in your vault
- **Tags** — organize conversations with custom tags and filter your vault by tag with one click
- **Important ⭐** — star conversations that matter and keep them one tab away
- **Export to Markdown** — download any conversation as a clean `.md` file (Obsidian/Notion-friendly)
- **Modern landing page** — logged-out visitors see a marketing page with sign-up CTAs
- **Modern UI** — dark glassmorphic design, responsive grid, smooth animations, toast feedback
- **Hardened API** — per-user data isolation, rate limiting, duplicate detection, regex-injection protection, security headers

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, single project — frontend + API routes) |
| UI | React 18, Tailwind CSS, shadcn/ui, lucide-react |
| Database | MongoDB (Atlas M0 free tier in production) |
| Auth | Clerk (free tier) |
| Hosting | Vercel (free tier) |

## 📁 Project Structure

```
├── app/
│   ├── api/[[...path]]/route.js   # All API endpoints (catch-all route)
│   ├── page.js                    # Auth gate: landing (logged out) vs vault (signed in)
│   ├── layout.js                  # Root layout + SEO metadata + ClerkProvider
│   ├── sign-in/ · sign-up/        # Clerk auth pages
│   └── globals.css                # Global styles + animations
├── components/
│   ├── vault.jsx                  # Main app (save, search, tags, export, …)
│   ├── landing.jsx                # Marketing page for logged-out visitors
│   ├── clerk-user-button.jsx      # Clerk UI client boundary
│   └── ui/                        # shadcn components
├── middleware.js                  # Clerk route protection
├── next.config.js                 # Security + CORS headers
└── vercel.json                    # Function timeout config
```

## 🔌 API Endpoints

All endpoints require authentication (Clerk session). Every query is scoped to the signed-in user.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/save-chat` | Parse a ChatGPT share link and archive it. Body: `{ chatUrl }`. Rate-limited (10/min), rejects duplicates. |
| `GET` | `/api/conversations?page=&limit=&tag=` | List conversations (paginated, optional tag filter) |
| `GET` | `/api/conversations/:id` | Single conversation + all messages |
| `GET` | `/api/search?q=` | Full-text search across titles and message content |
| `GET` | `/api/tags` | All tags for the user, with usage counts |
| `PATCH` | `/api/conversations/:id/important` | Toggle the ⭐ flag |
| `PATCH` | `/api/conversations/:id/tags` | Replace tags. Body: `{ tags: string[] }` (max 10, 30 chars each) |
| `DELETE` | `/api/conversations/:id` | Delete a conversation and its messages |

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+ and Yarn
- A MongoDB instance — local (`mongodb://localhost:27017`) or an Atlas cluster
- (Optional) Clerk keys — without them the app runs in single-user "no-auth" mode

### Setup

```bash
# 1. Install dependencies
yarn install

# 2. Configure environment
cp .env.example .env
# → fill in MONGODB_URI (or keep MONGO_URL=mongodb://localhost:27017)
# → optionally add Clerk test keys for the full auth experience

# 3. Run
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

> Without Clerk keys, the vault opens directly with a fixed local user — handy for quick hacking. With Clerk keys, you get the real landing page → sign up → private vault flow.

---

## 🌍 Production Deployment (100% free tier)

The app deploys as a **single Next.js project on Vercel** — API routes and frontend are bundled together; no separate backend server.

### Step 1 — MongoDB Atlas (free M0 cluster)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a free **M0 cluster**
2. **Database Access** → add a database user with a strong password
3. **Network Access** → add IP `0.0.0.0/0` (Vercel uses dynamic IPs)
4. **Connect → Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ai_second_brain?retryWrites=true&w=majority
   ```
   This is your `MONGODB_URI`.

### Step 2 — Clerk (free tier)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → create an application
2. Choose sign-in methods (Email, Google, GitHub, …)
3. From **API Keys**, copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…` / `pk_test_…`)
   - `CLERK_SECRET_KEY` (`sk_live_…` / `sk_test_…`)

### Step 3 — Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo (Next.js auto-detected)
3. Add **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Atlas connection string from Step 1 |
   | `DB_NAME` | `ai_second_brain` |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | from Clerk |
   | `CLERK_SECRET_KEY` | from Clerk |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/` |
   | `NEXT_PUBLIC_BASE_URL` | your domain, e.g. `https://yourdomain.com` (use the `*.vercel.app` URL until your domain is connected) |

4. Click **Deploy**

### Step 4 — Connect your custom domain

1. Vercel → your project → **Settings → Domains** → add `yourdomain.com`
2. At your domain registrar, add the DNS records Vercel shows you
   (usually an `A` record to `76.76.21.21` and a `CNAME` for `www` → `cname.vercel-dns.com`)
3. Wait for DNS to propagate — Vercel provisions HTTPS automatically
4. Update `NEXT_PUBLIC_BASE_URL` in Vercel env vars to `https://yourdomain.com` and **redeploy**

### Step 5 — Tell Clerk about the domain

In the Clerk Dashboard:
1. **Domains** → add your production domain (`https://yourdomain.com`)
2. For a `pk_live_` production instance, follow Clerk's DNS verification steps
3. **Paths**: sign-in `/sign-in`, sign-up `/sign-up`, after both → `/`

Done — visit your domain. Logged-out visitors get the landing page; signing up creates a private vault.

---

## 🔧 How It Works

### ChatGPT link parsing
`POST /api/save-chat` extracts conversations with a multi-strategy fallback chain:
1. ChatGPT's share JSON API endpoints (`backend-anon` / `backend-api`)
2. Embedded `__NEXT_DATA__` JSON in the share page HTML
3. RSC streaming chunks / inline script JSON scanning
4. DOM scraping (`data-message-author-role`, `<article>` elements)

### Data model
Two collections, both indexed per user:
- `conversations` — `{ id, userId, title, sourceUrl, tags[], isImportant, messageCount, createdAt }`
- `messages` — `{ id, conversationId, role, content, messageOrder, createdAt }`

### Security
- All API routes require a Clerk session in production (401 otherwise)
- Every DB query is scoped by `userId` — users can never see each other's data
- Save endpoint rate-limited (10/min/user) with duplicate-URL rejection
- Search input is regex-escaped (ReDoS protection); tags are normalized and capped
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) + CORS scoped to your domain

## 📝 Roadmap Ideas

- [ ] Export entire vault as a zip of Markdown files
- [ ] Support Claude / Gemini share links
- [ ] Browser extension for one-click saving
- [ ] Folders & note linking
- [ ] Optional AI summaries and semantic search

## 📄 License

MIT — free to use for your own projects.

---

**Built with Next.js, MongoDB, Clerk & Vercel — runs on $0/month.**
