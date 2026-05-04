# FinTrend AI — Financial Insight Generator

A financial intelligence platform that transforms datasets and web content into structured analyst-grade reports, with AI memory that tracks signals over time.

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env

python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt

mkdir -p data/uploads data/reports
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000` — API docs at `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Verify FINTREND_API_KEY matches backend .env

npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## Environment Variables

### Backend `.env`
```
GEMINI_API_KEY=your-key-here        # Required for AI report generation
FIRECRAWL_API_KEY=fc-...            # Required for web scraping
FINTREND_API_KEY=dev-secret-key     # Shared secret (match with frontend)
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
FINTREND_API_KEY=dev-secret-key     # Must match backend
```

> **Note:** Without `GEMINI_API_KEY`, the system generates a basic fallback report using only Pandas data. All other features work fully.

## Usage

1. **Upload Dataset** → Go to Analyze, drag & drop a CSV/XLSX with date + value columns
2. **Configure** → Select date column, value column, and type an asset name (e.g., "NIFTY50")
3. **Add Sources** → Optionally paste financial news URLs for web intelligence
4. **Generate** → Click "Generate Report" — takes 15–45 seconds
5. **View Report** → Full structured report with chart, signals, risk, and memory insights
6. **Memory** → After multiple runs, the Memory page shows timeline and repeated signals

## Dataset Format

Minimum requirements:
- One **date column** (YYYY-MM-DD, MM/DD/YYYY, or DD-MM-YYYY)
- One **numeric value column** (price, revenue, index value, etc.)
- Minimum 5 rows recommended

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11+ |
| Analysis | Pandas |
| Web Scraping | Firecrawl API |
| AI Reports | Google Gemini (gemini-2.5-flash) |
| Memory | SQLite + keyword-based retrieval |
| Deploy | Vercel (frontend) + Railway/Render (backend) |

## Deployment

### Vercel (Frontend)
1. Push to GitHub, connect to Vercel
2. Set `FINTREND_API_KEY` and `NEXT_PUBLIC_API_BASE_URL` in Vercel dashboard
3. Deploy

### Railway (Backend)
1. Connect GitHub repo, select `backend/` as root
2. Set all env vars in Railway dashboard
3. Deploy with provided Dockerfile
