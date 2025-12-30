# Article Search & Enhancement System

A full-stack application that scrapes articles from BeyondChats, enhances them using Google Search and AI (Google Gemini), and displays them in a modern React frontend.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## 📚 Project Overview

This project consists of three main phases:

| Phase       | Description                      | Tech Stack                               |
| ----------- | -------------------------------- | ---------------------------------------- |
| **Phase 1** | Backend API with CRUD operations | Express, Prisma, PostgreSQL, TypeScript  |
| **Phase 2** | Article enhancement script       | Node.js, Google Search, Google Gemini AI |
| **Phase 3** | Frontend UI                      | React, Vite, TypeScript                  |

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** (local or hosted like [Neon](https://neon.tech), [Supabase](https://supabase.com))
- **Google Gemini API Key** (free at [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1️⃣ Clone & Setup Database

```bash
# Clone the repository
cd article_search

# Start PostgreSQL (if using Docker)
docker compose up -d

# Or use your own PostgreSQL connection string
```

### 2️⃣ Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client & sync database
npx prisma generate
npx prisma db push

# Scrape articles from BeyondChats
npm run scrape

# Start the server
npm run dev
```

The API will be available at `http://localhost:3000`

### 3️⃣ Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4️⃣ Run Enhancement Script (Optional)

```bash
cd enhancement-script

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your GEMINI_API_KEY

# Run the enhancement
npm run enhance
```

## 📁 Project Structure

```
article_search/
├── backend/                    # Phase 1: Express API
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Error handling
│   │   ├── schemas/            # Zod validation
│   │   ├── scripts/            # Scraper script
│   │   └── index.ts            # Server entry point
│   └── package.json
│
├── enhancement-script/         # Phase 2: AI Enhancement
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.service.ts      # Backend API client
│   │   │   ├── google.service.ts   # Google Search scraper
│   │   │   └── llm.service.ts      # Gemini AI integration
│   │   └── index.ts            # Main orchestrator
│   └── package.json
│
├── frontend/                   # Phase 3: React UI
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   └── App.tsx             # Main app
│   └── package.json
│
└── docker-compose.yml          # PostgreSQL container
```

## 🔌 API Endpoints

| Method   | Endpoint                     | Description                         |
| -------- | ---------------------------- | ----------------------------------- |
| `GET`    | `/api/articles`              | List all articles (with pagination) |
| `GET`    | `/api/articles/:id`          | Get single article                  |
| `GET`    | `/api/articles/:id/enhanced` | Get article with enhanced versions  |
| `POST`   | `/api/articles`              | Create new article                  |
| `PUT`    | `/api/articles/:id`          | Update article                      |
| `DELETE` | `/api/articles/:id`          | Delete article                      |
| `GET`    | `/health`                    | Health check                        |

### Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `isEnhanced` - Filter by type (`true` or `false`)
- `search` - Search in title and content

### Example Requests

```bash
# Get all original articles
curl http://localhost:3000/api/articles?isEnhanced=false

# Get enhanced articles
curl http://localhost:3000/api/articles?isEnhanced=true

# Search articles
curl http://localhost:3000/api/articles?search=chatbot
```

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/article_search"
PORT=3000
NODE_ENV=development
CORS_ORIGINS="http://localhost:5173"
```

### Enhancement Script (.env)

```env
API_URL="http://localhost:3000/api"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Frontend (.env)

```env
VITE_API_URL="http://localhost:3000/api"
```

## 📚 Learning Highlights

Each file contains detailed comments explaining:

- **Backend**: Express routing, Prisma ORM, error handling patterns
- **Scraper**: Web scraping with Cheerio, CSS selectors
- **Google Search**: HTTP requests, rate limiting
- **LLM Integration**: Prompt engineering, API integration
- **Frontend**: React hooks, TypeScript, CSS variables

## 🚢 Deployment

### Backend (Railway, Render, etc.)

1. Set environment variables
2. Run `npm run build`
3. Run `npx prisma migrate deploy`
4. Start with `npm start`

### Frontend (Vercel, Netlify)

1. Set `VITE_API_URL` to your deployed backend URL
2. Build with `npm run build`
3. Deploy the `dist` folder

## 📝 License

MIT License - Feel free to use this for learning and projects!

---

Built with ❤️ as a learning project for full-stack development with AI integration.
