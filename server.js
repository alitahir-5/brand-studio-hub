// Brand Studio Hub: standalone server
// Serves the hub, the brand files, and two AI routes (storyboards and brand copy).
// AI keys live in environment variables on the server, so they never reach the browser.

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "200kb" }));

const PORT = process.env.PORT || 3000;
// Both providers can be set up at once. DEFAULT_AI picks the first choice ("claude" or "gemini");
// if that one fails or has no key, the other is tried automatically.
const HAS = { claude: !!process.env.ANTHROPIC_API_KEY, gemini: !!process.env.GEMINI_API_KEY };
const DEFAULT_AI = (process.env.DEFAULT_AI || process.env.AI_PROVIDER || (HAS.claude ? "claude" : "gemini")).toLowerCase();
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || "";

// ---------- optional team password (browser login prompt) ----------
if (TEAM_PASSWORD) {
  app.use((req, res, next) => {
    if (req.path === "/api/health") return next();
    const h = req.headers.authorization || "";
    const [type, val] = h.split(" ");
    if (type === "Basic" && val) {
      const pass = Buffer.from(val, "base64").toString().split(":").slice(1).join(":");
      if (pass === TEAM_PASSWORD) return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="Brand Studio Hub"');
    res.status(401).send("Sign in with any username and the team password.");
  });
}

app.use(express.static(path.join(__dirname, "public")));
app.use("/brands", express.static(path.join(__dirname, "brands")));

// ---------- brand guides, loaded once ----------
const BRANDS = {
  locomotepro: { name: "LocomotePro", dir: "locomotepro" },
  surfaced: { name: "Surfaced Social", dir: "surfaced" },
};
for (const b of Object.values(BRANDS)) {
  const d = path.join(__dirname, "brands", b.dir);
  const read = f => { try { return fs.readFileSync(path.join(d, f), "utf8"); } catch { return ""; } };
  b.guide = read("README.md") + "\n\n" + read("how-to-use.md");
}

// ---------- simple per-IP rate limit ----------
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = Number(process.env.RATE_LIMIT || 40);
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > max;
}

// ---------- AI call ----------
const noDash = s => String(s).replace(/\s*\u2014\s*/g, ", ").replace(/\u2013/g, "-");

async function callClaude({ system, prompt, maxTokens }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      // The brand guide is the same on every request, so it is cached to cut cost.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Claude API error ${r.status}`);
  return (data.content || []).filter(c => c.type === "text").map(c => c.text).join("");
}

async function callGemini({ system, prompt, json, maxTokens }) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Gemini API error ${r.status}`);
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty reply");
  return text;
}

const CALL = { claude: callClaude, gemini: callGemini };
const LABEL = { claude: "Claude", gemini: "Gemini" };

// Tries the requested engine first, then the other one. Returns { text, engine }.
async function ask({ system, prompt, json = false, maxTokens = 2000, engine = "auto" }) {
  const first = engine === "claude" || engine === "gemini" ? engine : DEFAULT_AI;
  const order = [first, first === "claude" ? "gemini" : "claude"].filter(e => HAS[e]);
  if (!order.length) throw new Error("No AI key is set. Add ANTHROPIC_API_KEY and/or GEMINI_API_KEY.");
  let lastErr;
  for (const e of order) {
    try { return { text: await CALL[e]({ system, prompt, json, maxTokens }), engine: e }; }
    catch (err) { lastErr = err; console.error(`${e} failed:`, err.message); }
  }
  throw lastErr;
}

function parseJSON(text) {
  const t = text.replace(/```json|```/g, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  return JSON.parse(t.slice(a, b + 1));
}

const BASE_RULES = "Never use em dashes. Use commas, colons or parentheses instead. No emoji.";
function brandSystem(brandId) {
  const b = BRANDS[brandId];
  if (!b) return `You are a senior marketing copywriter. ${BASE_RULES}`;
  return `You are the in-house copywriter for ${b.name}. Follow this brand book and usage guide exactly, especially voice, terminology, casing and house rules. ${BASE_RULES}
Ignore any parts of the guide that describe how to use Claude, artifacts or the design system pages; use only the brand facts and rules.

<brand_guide>
${b.guide}
</brand_guide>`;
}

// ---------- routes ----------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    ready: HAS.claude || HAS.gemini,
    default: HAS[DEFAULT_AI] ? DEFAULT_AI : (HAS.claude ? "claude" : HAS.gemini ? "gemini" : null),
    engines: { claude: HAS.claude ? CLAUDE_MODEL : null, gemini: HAS.gemini ? GEMINI_MODEL : null },
  });
});

app.post("/api/storyboard", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Wait a few minutes and try again." });
  const { brief = "", len = 30, lang = "English", tone = "Confident and direct", brand = "", engine = "auto" } = req.body || {};
  if (!String(brief).trim()) return res.status(400).json({ error: "Add a short description first." });
  const prompt = `Write a storyboard for a short animated text video. Return ONLY JSON, no prose, in this shape:
{"scenes":[{"kind":"title|statement|list|stat|quote|end","eyebrow":"","headline":"","body":"","dur":4}]}
Field rules:
- title: eyebrow = small label up to 3 words; headline up to 8 words; body = one supporting line up to 12 words.
- statement: headline up to 12 words; body optional, up to 14 words; eyebrow optional.
- list: headline up to 5 words; body = 3 to 5 items separated by \\n, each up to 6 words.
- stat: headline is ONLY the figure, like "40%", "3x", "1,200+"; body = what it measures, up to 8 words. Only use real figures given in the brief or the brand guide; if there are none, do not use stat.
- quote: only if the brief includes a real quote; headline = the quote; body = who said it.
- end: headline up to 7 words; body = button text up to 4 words; eyebrow = web address or handle, else "".
- dur: seconds between 2.5 and 6, longer for scenes with more words.
Make 4 to 8 scenes. First scene is title, last is end. Total duration close to ${Number(len) || 30} seconds.
Write all text in ${lang}. Tone: ${tone}.
Brief:
${String(brief).slice(0, 4000)}`;
  try {
    const out = await ask({ system: brandSystem(brand), prompt, json: true, engine });
    const data = parseJSON(noDash(out.text));
    res.json({ scenes: Array.isArray(data.scenes) ? data.scenes : [], engine: LABEL[out.engine] });
  } catch (e) {
    console.error("storyboard:", e.message);
    res.status(502).json({ error: "The writer couldn't produce scenes this time. Try again or reword the description." });
  }
});

const FORMATS = {
  social: "a social media post: a strong first-line hook, short body, one call to action at the end, then a short set of hashtags",
  linkedin: "a LinkedIn post: hook line, 3 to 6 short paragraphs or a short list, one call to action, 3 to 5 hashtags",
  ad: "ad copy: 3 headline options (up to 40 characters each), 2 primary text options (up to 125 characters each) and one call-to-action button label",
  email: "a marketing email: 3 subject line options, a preview line, then the email body with one call to action",
  web: "a website section: a short kicker label, a headline, a supporting paragraph and 3 benefit points",
  appstore: "app store listing text: a 30-character subtitle, an 80-character short description and a full description with short feature paragraphs",
  script: "a 30-second voiceover script with scene-by-scene on-screen text",
};
app.post("/api/write", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Wait a few minutes and try again." });
  const { brand = "", format = "social", language = "English", brief = "", variants = 1, engine = "auto" } = req.body || {};
  if (!String(brief).trim()) return res.status(400).json({ error: "Tell the writer what the piece is about." });
  const n = Math.min(3, Math.max(1, Number(variants) || 1));
  const prompt = `Write ${FORMATS[format] || FORMATS.social}.
Language: ${language}. If two languages are named, give the full text in the first language, then the full text in the second.
${n > 1 ? `Give ${n} clearly different versions, labelled "Version 1", "Version 2" and so on.` : "Give one version."}
Use only facts from the brief and the brand guide. Do not invent prices, numbers, dates or claims.
Return plain text ready to paste, with no commentary before or after.

Brief:
${String(brief).slice(0, 4000)}`;
  try {
    const out = await ask({ system: brandSystem(brand), prompt, maxTokens: 2500, engine });
    res.json({ text: noDash(out.text).trim(), engine: LABEL[out.engine] });
  } catch (e) {
    console.error("write:", e.message);
    res.status(502).json({ error: "The writer couldn't finish this time. Try again in a moment." });
  }
});

app.listen(PORT, () => console.log(`Brand Studio Hub on :${PORT} (Claude: ${HAS.claude ? CLAUDE_MODEL : "off"}, Gemini: ${HAS.gemini ? GEMINI_MODEL : "off"}, default: ${DEFAULT_AI})`));
