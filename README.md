# FinTrend AI - Financial Insight Generator

A professional financial intelligence platform designed to transform raw datasets and web content into structured, analyst-grade reports. The system incorporates an AI memory module to track and recall market signals over time.

Live Deployment: https://finantrend.vercel.app

## System Architecture

The application is structured into two primary components:
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Recharts
- Backend: FastAPI, Python 3.11+, Pandas
- Integrations: Google Gemini (gemini-2.5-flash) for AI generation, Firecrawl API for web content extraction
- Database: SQLite for temporal signal memory

## Quick Start Guide

### 1. Backend Configuration

Navigate to the backend directory and set up the Python environment:

```bash
cd backend
cp .env.example .env
```

Configure your environment variables in `.env`:
```text
GEMINI_API_KEY=your-key-here
FIRECRAWL_API_KEY=your-firecrawl-key
FINTREND_API_KEY=dev-secret-key
ALLOWED_ORIGINS=http://localhost:3000
```

Install dependencies and run the server:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

mkdir -p data/uploads data/reports
uvicorn app.main:app --reload --port 8000
```
The backend API will be available at http://localhost:8000.

### 2. Frontend Configuration

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
cp .env.example .env.local
```

Ensure your `.env.local` matches the backend authorization:
```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
FINTREND_API_KEY=dev-secret-key
```

Start the development server:
```bash
npm install
npm run dev
```
The frontend application will be available at http://localhost:3000.

## Workflow

1. Data Upload: Navigate to the Analyze section to provide a CSV or XLSX dataset containing historical financial dates and values.
2. Parameter Configuration: Designate the temporal column, value column, and specify the asset identifier (e.g., NIFTY50).
3. Web Intelligence: Provide auxiliary URLs to incorporate relevant real-time financial news or external analysis.
4. Report Generation: Execute the analysis to compile structured insights.
5. Persistent Memory: Review the Memory interface to track historically recurring signals and market trends captured across consecutive runs.

## Data Constraints

Input datasets require the following minimum schema:
- Temporal Column: Formatted conventionally (YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY).
- Value Column: Standard numeric data (prices, volume, indices).
- Depth: A minimum of five sequential rows is recommended for optimal trend detection. Note: The system will gracefully fall back to a strictly deterministic data parsing mode if the GEMINI_API_KEY is not provisioned.

## Deployment Strategy

### Frontend Platform
The Next.js client is optimized for Vercel. Ensure `FINTREND_API_KEY` and `NEXT_PUBLIC_API_BASE_URL` are strictly configured in the Vercel dashboard prior to deployment. Live view: https://finantrend.vercel.app

### Backend Platform
The backend is Docker-ready and can be deployed via platforms such as Railway or Render. Set the root directory to `backend/` and populate all necessary environment variables matching the local configuration.
