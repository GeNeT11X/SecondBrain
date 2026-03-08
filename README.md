# AI Second Brain for ChatGPT 🧠✨

A production-ready SaaS application that helps you organize, summarize, and search your ChatGPT conversations automatically. Build your personal knowledge base from your AI chats.

## 🎯 Features

### Core Features
- **🔗 ChatGPT Link Parser**: Paste any ChatGPT share link and automatically extract the full conversation
- **🤖 AI-Powered Analysis**: Uses GPT-4-turbo to generate:
  - Intelligent titles
  - Comprehensive summaries
  - Key insights extraction
  - Automatic tagging
  - Code snippet detection
- **🔍 Dual Search System**:
  - **Keyword Search**: Traditional text-based search
  - **Semantic Search**: AI-powered meaning-based search using embeddings
- **🏷️ Smart Organization**: Tag-based filtering and categorization
- **💾 Persistent Storage**: MongoDB database for reliable data storage
- **🎨 Beautiful UI**: Modern glassmorphic design with smooth animations

### Technical Features
- Vector embeddings for semantic search (OpenAI text-embedding-3-small)
- Cosine similarity matching for relevant results
- Responsive design with Tailwind CSS
- Server-side rendering with Next.js 14
- RESTful API architecture

## 🚀 Getting Started

### Prerequisites
- OpenAI API key (for GPT-4 and embeddings)
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

## 🙋 Support

For issues or questions, please open an issue on GitHub or contact support.

---

**Built with ❤️ using Next.js, MongoDB, and OpenAI**

