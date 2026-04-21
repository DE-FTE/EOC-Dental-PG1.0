/**
 * api/docs.js — EOC & Dental Playground · Backend Stub
 * ─────────────────────────────────────────────────────
 * Deployed as a Vercel Serverless Function at POST /api/docs
 *
 * ════════════════════════════════════════════════════════════
 * ACTIONS
 * ════════════════════════════════════════════════════════════
 *
 *  1. { action: "stats" }
 *     Returns how many EOC / Dental documents are indexed.
 *     Response: { eoc: number, dental: number, total: number, ready: boolean }
 *
 *  2. { action: "query", question: string, doc_type: "all"|"eoc"|"dental" }
 *     Embeds the question, runs vector similarity search, and returns an AI answer
 *     with page-level source citations.
 *     Response: { answer: string, sources: Source[] }
 *
 *     Source shape:
 *       { doc_name: string, doc_type: "eoc"|"dental", page: number,
 *         section: string, chunk_text: string }
 *
 * ════════════════════════════════════════════════════════════
 * HOW TO CONNECT YOUR RAG BACKEND
 * ════════════════════════════════════════════════════════════
 *
 * Option A — Supabase + pgvector (Vector DB RAG)
 * ────────────────────────────────────────────────
 * 1. Create a Supabase project and enable the pgvector extension.
 * 2. Run db/schema_docs.sql to create the doc_chunks table.
 * 3. Upload your EOC / Dental PDFs to Supabase Storage.
 * 4. Run `node scripts/ingest_docs.js` to chunk, embed (OpenAI text-embedding-3-small),
 *    and upsert into doc_chunks.
 * 5. In this file, replace the TODO sections with:
 *    - supabase.rpc("match_doc_chunks", { query_embedding, filter, match_count })
 *    - Pass matched chunks as context to the Claude / OpenAI completions API.
 * 6. Set env vars in Vercel: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
 *
 * Option B — Page Index Reasoning (Vector-less RAG)
 * ────────────────────────────────────────────────────
 * 1. Store PDFs in any blob storage (Supabase Storage, S3, Azure Blob, etc.).
 * 2. Build a page-level index (JSON manifest: doc_id, page, text).
 * 3. For each query, retrieve the top-N pages by keyword / BM25 scoring.
 * 4. Pass page text directly to the LLM as context.
 * 5. No embedding infrastructure required.
 *
 * ════════════════════════════════════════════════════════════
 * ENVIRONMENT VARIABLES (set in Vercel project settings)
 * ════════════════════════════════════════════════════════════
 *   SUPABASE_URL           Supabase project URL
 *   SUPABASE_SERVICE_KEY   Supabase service-role key (never expose client-side)
 *   ANTHROPIC_API_KEY      Anthropic API key for answer generation
 *   OPENAI_API_KEY         (Optional) OpenAI key if using OpenAI embeddings
 */

export default async function handler(req, res) {
  // ── CORS preflight ────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, question, doc_type } = req.body || {};

  // ══════════════════════════════════════════════════════════════
  // ACTION: stats
  // ══════════════════════════════════════════════════════════════
  if (action === "stats") {
    // TODO: BACKEND — Query your doc_chunks table (or manifest) for counts.
    //
    // Example (Supabase):
    //   const { data } = await supabase
    //     .from("doc_chunks")
    //     .select("doc_type")
    //     .then(r => r.data);
    //   const eoc    = data.filter(d => d.doc_type === "eoc").length;
    //   const dental = data.filter(d => d.doc_type === "dental").length;
    //   return res.json({ eoc, dental, total: eoc + dental, ready: eoc + dental > 0 });

    return res.status(200).json({
      eoc: 0,
      dental: 0,
      total: 0,
      ready: false,
      // Remove this message once backend is wired up:
      _note: "Backend not yet configured. See api/docs.js for integration instructions.",
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ACTION: query
  // ══════════════════════════════════════════════════════════════
  if (action === "query") {
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    // TODO: BACKEND — Implement RAG pipeline here.
    //
    // Step 1 — Embed the question:
    //   const embedding = await embedText(question); // OpenAI / Cohere / etc.
    //
    // Step 2 — Retrieve relevant chunks:
    //   const chunks = await supabase.rpc("match_doc_chunks", {
    //     query_embedding: embedding,
    //     filter: doc_type !== "all" ? { doc_type } : {},
    //     match_count: 6,
    //   });
    //
    // Step 3 — Build LLM context:
    //   const context = chunks.map(c =>
    //     `[${c.doc_name} · p.${c.page} · ${c.section}]\n${c.chunk_text}`
    //   ).join("\n\n---\n\n");
    //
    // Step 4 — Generate answer:
    //   const response = await anthropic.messages.create({
    //     model: "claude-sonnet-4-20250514",
    //     max_tokens: 1024,
    //     system: "You are an EOC & Dental document expert...",
    //     messages: [{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }],
    //   });
    //
    // Step 5 — Return answer + sources:
    //   return res.json({
    //     answer: response.content[0].text,
    //     sources: chunks.map(c => ({
    //       doc_name: c.doc_name,
    //       doc_type: c.doc_type,
    //       page: c.page,
    //       section: c.section,
    //       chunk_text: c.chunk_text,
    //     })),
    //   });

    // ── Stub response (remove once backend is wired up) ───────────────────
    return res.status(200).json({
      answer:
        "**Backend not yet configured.**\n\n" +
        "The EOC & Dental Playground frontend is fully set up and ready.\n\n" +
        "To get real answers from your plan documents, connect the RAG backend by following the steps in `api/docs.js`.\n\n" +
        "**Your question was:** *" + question.slice(0, 200) + "*\n\n" +
        "Once the backend is live, this will return answers cited directly from your EOC and Dental PDFs with page-level source attribution.",
      sources: [],
      mock: true,
    });
  }

  return res.status(400).json({ error: "Unknown action. Use 'stats' or 'query'." });
}
