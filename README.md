# The Onion Times — Fake News Generator

A full-stack application that scrapes real news articles from multiple sources, transforms them into satirical versions using OpenAI, and displays them in a newspaper-style UI with a per-article AI chat interface.

## Features

- Scrapes RSS feeds from **New York Times**, **NPR News**, and **The Guardian**
- Transforms articles into satirical/fake versions using **GPT-4o-mini**
- **Article similarity detection** — skips near-duplicate stories across sources using vector embeddings
- News feed with **filtering by source**
- Article detail view with **toggle between satirical and original**
- **Streaming AI chat** per article (summarize, extract entities, compare versions)
- All data persisted in PostgreSQL — survives restarts
- Scheduled auto-scraping every 30 minutes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + React Query |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + pgvector |
| LLM | OpenAI API (`gpt-4o-mini`) |
| Infra | Docker + docker-compose + nginx |

---

## Quick Start (Docker — recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- An [OpenAI API key](https://platform.openai.com/api-keys) with available credits

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/newspaper.git
cd newspaper
```

### 2. Set your OpenAI API key

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder with your real key:

```
OPENAI_API_KEY=sk-proj-your-real-key-here
```

> **Never commit `.env` to git.** It is listed in `.gitignore`.

### 3. Run

```bash
docker-compose up --build
```

The first build takes ~2 minutes. Once all services are up:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api/health |

### 4. Fetch articles

Click **"Fetch Latest News"** in the UI to trigger the first scrape. Satirical versions are generated in the background — articles update automatically when ready.

---

## Local Development (without Docker)

### Prerequisites

- Node.js 20+
- Docker (for the database — required because pgvector must be installed in PostgreSQL)

### 1. Start the database

The project uses `pgvector` for similarity detection, so plain PostgreSQL won't work.
Run just the database container:

```bash
docker run -d \
  --name newspaper-pg \
  -e POSTGRES_DB=newspaper \
  -e POSTGRES_USER=newspaper \
  -e POSTGRES_PASSWORD=newspaper \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 2. Configure environment

```bash
# backend/.env
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DATABASE_URL=postgresql://newspaper:newspaper@localhost:5432/newspaper
OPENAI_API_KEY=sk-proj-your-real-key-here
PORT=3001
```

### 3. Install dependencies

```bash
# frontend
npm install

# backend
cd backend && npm install && cd ..
```

### 4. Start both servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
npm run dev
```

Frontend runs at http://localhost:5173, proxying `/api` to the backend at port 3001.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Backend port (default: 3001) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scrape` | Trigger RSS scraping |
| `GET` | `/api/articles` | List articles (`?source=` to filter) |
| `GET` | `/api/articles/sources` | List available sources |
| `GET` | `/api/articles/:id` | Get single article |
| `GET` | `/api/articles/:id/chat` | Get chat history |
| `POST` | `/api/articles/:id/chat` | Send chat message (SSE streaming) |
| `GET` | `/api/health` | Health check |

---

## Project Structure

```
newspaper/
├── backend/
│   └── src/
│       ├── db/           # DB pool + schema init
│       ├── services/     # scraper, transformer, similarity
│       └── routes/       # scrape, articles, chat
├── src/                  # React frontend
│   ├── api/              # fetch client
│   ├── components/       # ArticleCard, ChatPanel, SourceFilter
│   └── pages/            # FeedPage, ArticlePage, NotFoundPage
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

---

## Security Notes

- The `.env` file is **gitignored** and must never be committed
- Use `.env.example` as a template — it contains no real credentials
- In Docker, the API key is passed via the `OPENAI_API_KEY` environment variable in docker-compose, sourced from your local `.env`
