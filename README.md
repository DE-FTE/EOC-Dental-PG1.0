# EOC-Dental-Playground1.0
# EOC Playground · HealthWorksAI

RAG-powered Evidence of Coverage & Dental document Q&A chatbot.

Ask plain-English questions about EOC and Dental plan documents — answers are cited from source documents with page-level attribution.

---

## Quick Start (Local)

```bash
npm install
npm run dev        # http://localhost:3000
```

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Vercel auto-detects Vite. Click **Deploy**.
4. The frontend deploys immediately. The backend is a stub until you wire it up (see below).

---

## Project Structure

```
eoc-playground/
├── api/
│   └── docs.js          ← Vercel serverless function (RAG backend stub)
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          ← All frontend UI (React + inline styles)
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Connecting the Backend

The frontend is complete. To serve real answers from your plan documents, implement the RAG pipeline in **`api/docs.js`**.

The file contains detailed comments for two integration paths:

### Option A — Supabase + pgvector (Vector DB RAG)

| Step | What to do |
|------|-----------|
| 1 | Create a Supabase project, enable the `pgvector` extension |
| 2 | Run the SQL schema to create the `doc_chunks` table |
| 3 | Upload EOC / Dental PDFs to Supabase Storage |
| 4 | Run the ingestion script to chunk, embed, and index |
| 5 | Implement vector similarity search in `api/docs.js` |
| 6 | Add env vars in Vercel project settings |

### Option B — Page Index Reasoning (Vector-less)

| Step | What to do |
|------|-----------|
| 1 | Store PDFs in any blob storage |
| 2 | Build a page-level JSON index |
| 3 | Implement keyword / BM25 retrieval in `api/docs.js` |
| 4 | Pass page text as LLM context |

---

## Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Option A | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Option A | Supabase service-role key |
| `ANTHROPIC_API_KEY` | Both | Anthropic API key for answer generation |
| `OPENAI_API_KEY` | Optional | OpenAI key for embeddings (Option A) |

---

## API Contract

`POST /api/docs`

**Get document stats:**
```json
{ "action": "stats" }
```
Response:
```json
{ "eoc": 15, "dental": 4, "total": 19, "ready": true }
```

**Query documents:**
```json
{ "action": "query", "question": "What is the out-of-pocket maximum?", "doc_type": "all" }
```
`doc_type`: `"all"` | `"eoc"` | `"dental"`

Response:
```json
{
  "answer": "The out-of-pocket maximum for in-network services is...",
  "sources": [
    {
      "doc_name": "Humana_EOC_2026.pdf",
      "doc_type": "eoc",
      "page": 42,
      "section": "Out-of-Pocket Costs",
      "chunk_text": "..."
    }
  ]
}
```

---

Built by HealthWorksAI · v1.0.0
