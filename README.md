# Ronak Local Frontend + FastAPI Backend

This project runs as two local services:

- React/Vite frontend at `http://localhost:5173`
- FastAPI backend at `http://localhost:8000`

The frontend stores saved posts, history, revisions, conversations, source-post cache, and settings in IndexedDB. The backend calls the AI provider and uses Apify to retrieve public X posts. It does not store user content, settings, generated content, or Apify credentials in the frontend.

## Backend Setup

Create a backend environment file:

```powershell
cd "C:\Users\Guru\Downloads\ronak project"
Copy-Item .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. Keep this key server-side only.

For local X search through Apify, also set:

```dotenv
APIFY_API_TOKEN=apify_api_your-token
APIFY_ACTOR_ID=scraping_solutions/twitter-x-scraper-post-timeline-search-replies
```

`APIFY_API_TOKEN` stays in the backend `.env` only. The frontend never receives it.

Install dependencies:

```powershell
cd "C:\Users\Guru\Downloads\ronak project"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run FastAPI on port `8000`:

```powershell
cd "C:\Users\Guru\Downloads\ronak project"
.\.venv\Scripts\python.exe -m uvicorn api.index:app --reload --host localhost --port 8000
```

## Frontend Setup

Install dependencies:

```powershell
cd "C:\Users\Guru\Downloads\ronak project\app"
npm.cmd install
```

Run Vite on port `5173`:

```powershell
cd "C:\Users\Guru\Downloads\ronak project\app"
npm.cmd run dev -- --host localhost --port 5173
```

Open `http://localhost:5173/discover`.

## Endpoint Smoke Tests

With FastAPI running, test the endpoints from PowerShell:

```powershell
$body = @{
  sourcePost = @{
    id = "sample"
    author = "Sample Author"
    username = "@sample"
    preview = "A short source post preview."
    content = "A source post about improving AI product workflows with better evidence and review loops."
  }
  brandSystemPrompt = "Write like a practical technology operator. Be concise and useful."
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/generate" -ContentType "application/json" -Body $body
```

For `/api/refine` and `/api/regenerate`, include `currentDraft`; `/api/refine` also needs `userInstruction`.

Test the X search endpoint with a small Apify run:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/posts?search=OpenAI&filter=latest&limit=5"
```

## Local Workflow

1. Run FastAPI locally.
2. Run the React frontend locally.
3. The frontend sends X search and AI requests to `http://localhost:8000`.
4. FastAPI retrieves recent public X posts through Apify and calls the AI provider using `OPENAI_API_KEY`.
5. The frontend saves selected source posts, successful outputs, revisions, history, conversations, and settings in IndexedDB.
