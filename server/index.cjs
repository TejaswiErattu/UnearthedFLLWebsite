// server/index.cjs
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');      // v2 in CJS
const cheerio = require('cheerio');
const { LRUCache } = require('lru-cache');
const path = require('path');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;

// ---------- CONFIG ----------
const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// small cache so repeat questions are instant
// const cache = new LRU({ max: 100, ttl: 1000 * 60 * 10 }); // 10 min
const cache = new LRUCache({ max: 100, ttl: 1000 * 60 * 10 }); // 10 min
// --- Helpers for tokenizing ---
const STOP = new Set([
  'what', 'who', 'when', 'where', 'why', 'how', 'is', 'are', 'the', 'a', 'an', 'of', 'to', 'for', 'about',
  'tell', 'me', 'explain', 'define', 'meaning', 'stand', 'standfor', 'does', 'do', 'you', 'we'
]);

function cleanTokens(s = '') {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !STOP.has(w));
}

function wantsDefinitionFLL(q = '') {
  const Q = q.toLowerCase();
  return (/\bfll\b|\bfirst lego league\b/.test(Q)) &&
    /(what\s+is|define|meaning|stand\s*for|explain)/.test(Q);
}


function sentenceify(text = '', max = 320) {
  const s = text.replace(/\s+/g, ' ').trim();
  const parts = s.split(/(?<=[.?!])\s+/);
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    out.push(p);
    if (out.join(' ').length >= max) break;
  }
  return out.length ? out.join(' ') : s.slice(0, max);
}


// ---------- UTIL ----------
function tokenize(s = '') {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2);
}


function scoreLocal(question, chunks = []) {
  const qTokens = [...new Set(cleanTokens(question))];
  if (!qTokens.length) return null;

  const scored = chunks.map(c => {
    const t = (c.text || '').toLowerCase();
    let score = 0, uniqueMatches = 0;
    for (const w of qTokens) {
      const count = t.split(w).length - 1;
      if (count > 0) uniqueMatches += 1;
      score += Math.min(count, 5);
    }
    if (qTokens.some(w => (c.title || '').toLowerCase().includes(w))) score += 2;
    return { ...c, score, uniqueMatches };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) return null;

  // Relax the threshold for short queries (e.g., a name or one concept).
  const shortQuery = qTokens.length <= 2;
  const minDistinct = shortQuery ? 1 : 2;
  const minScore = shortQuery ? 1 : 2;

  if (top.uniqueMatches < minDistinct) return null;
  if ((top.text || '').length < 80) return null;
  if (top.score < minScore) return null;

  return top;
}


function clip(str = '', max = 1500) {
  return str.length > max ? str.slice(0, max) : str;
}

async function llmRewrite({ question, context }) {
  if (!OPENAI_API_KEY) return null;
  try {
    const body = {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system", content:
            "You are a helpful assistant. Prefer the provided context. " +
            "Answer in 2–4 clear sentences, conversational but concise. " +
            "Do NOT include a Sources section; the caller will render sources."
        },
        {
          role: "user", content:
            `Question: ${question}

Context:
${clip(context, 3500)}

Write the answer now.`}
      ]
    };
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// Pull main readable text from a web page
async function fetchPageText(url) {
  try {
    const r = await fetch(url, { timeout: 10000 });
    if (!r.ok) return '';
    const html = await r.text();
    const $ = cheerio.load(html);
    // common readable elements
    const pick = $('article, main, #content')
      .text() || $('p').text();
    return pick.replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

// ---------- GOOGLE CSE ----------
async function webSearch(q) {
  const key = `cse:${q}`;
  if (cache.has(key)) return cache.get(key);

  if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_CX) {
    return { results: [], error: 'Missing GOOGLE_CSE_KEY/GOOGLE_CSE_CX' };
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', GOOGLE_CSE_KEY);
  url.searchParams.set('cx', GOOGLE_CSE_CX);
  url.searchParams.set('q', q);
  url.searchParams.set('num', '5');

  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text();
    const out = { results: [], error: `CSE error ${r.status}: ${txt.slice(0, 200)}` };
    cache.set(key, out);
    return out;
  }
  const data = await r.json();
  const results = (data.items || []).map(({ title, snippet, link }) => ({
    title, snippet, url: link
  }));
  const out = { results };
  cache.set(key, out);
  return out;
}

app.post('/api/answer', async (req, res) => {
  try {
    const { q, siteChunks = [], allowWeb = false } = req.body || {};
    if (!q) return res.status(400).json({ error: 'Missing q' });

    // 1) Prefer site unless it's a "what is FLL" style question.
    const localCandidate = wantsDefinitionFLL(q) ? null : scoreLocal(q, siteChunks);

    if (localCandidate) {
      const context = `${localCandidate.title}\n\n${localCandidate.text}`;
      const answer = await llmRewrite({ question: q, context }) ||
        sentenceify(localCandidate.text, 320);
      return res.json({
        used: 'site',
        answer,
        sources: [{ title: localCandidate.title, url: localCandidate.href || '#' }]
      });
    }

    // 2) If we didn’t find strong on-site content, ask the user before web.
    if (!allowWeb) {
      return res.json({
        used: 'none',
        answer: "I couldn’t find that on this site. Want me to search the web for you?",
        askWeb: true,
        sources: []
      });
    }

    // 3) Web fallback (only if allowWeb=true)
    const search = await webSearch(q);
    if (search.error) return res.status(502).json({ error: search.error });

    const top = search.results.slice(0, 2);
    if (!top.length) {
      return res.json({ used: 'none', answer: "I couldn’t find anything on the web either.", sources: [] });
    }

    const pages = [];
    for (const r of top) {
      const text = await fetchPageText(r.url);
      if (text) pages.push({ ...r, text: clip(text, 3000) });
    }

    const context = pages.map(p => `# ${p.title}\n${p.text}`).join('\n\n');
    const answer = await llmRewrite({ question: q, context }) ||
      [
        "Here are useful links:",
        ...top.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}\n${r.url}`)
      ].join('\n\n');

    return res.json({
      used: 'web',
      answer,
      sources: top // real URLs only
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});
// ---- Serve the built Vite app (dist) in production ----
const staticDir = path.resolve(__dirname, '../dist');
app.use(express.static(staticDir));

// Let React Router handle all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).end();
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
