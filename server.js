// Brand Studio Hub: standalone server
// Serves the hub, the brand files, and two AI routes (storyboards and brand copy).
// AI keys live in environment variables on the server, so they never reach the browser.

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

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
app.use("/vendor", express.static(path.join(__dirname, "node_modules/html-to-image/dist")));

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


// ---------- Post Designer: AI-designed graphics ----------
const SIZES = {
  square: [1080, 1080, "Instagram / Facebook square post"],
  portrait: [1080, 1350, "Instagram portrait post"],
  story: [1080, 1920, "Story or Reel cover"],
  linkedin: [1200, 627, "LinkedIn or link-share image"],
  banner: [1500, 500, "LinkedIn or X banner"],
  fbcover: [1640, 624, "Facebook cover"],
};

const BRAND_STYLE = {
  locomotepro: {
    fonts: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap",
    css: `:root{--ink:#05091A;--surface:#0B1330;--surface-2:#111B3D;--surface-deep:#070D24;--line:#1C2A4D;--text:#EEF3FB;--muted:#8A99B8;--cyan:#2DD4E0;--blue:#3B6FF5;--green:#2BD17E;--amber:#F6A93B;--red:#F25B5B;--cta-text:#031024;--grad:linear-gradient(100deg,#3B6FF5 0%,#2DD4E0 100%);--grad-btn:linear-gradient(100deg,#4C86FF 0%,#34DDEA 100%);--font-display:'Poppins','Hind Siliguri',sans-serif;--font-body:'Inter','Hind Siliguri',sans-serif;--font-mono:'Space Mono',monospace;--font-bangla:'Hind Siliguri','Poppins',sans-serif}`,
    notes: "Variables available: --ink --surface --surface-2 --surface-deep --line --text --muted --cyan --blue --green --amber --red --cta-text --grad --grad-btn --font-display --font-body --font-mono --font-bangla. Dark navy is the default look. A light version may use #EEF3FB page, #FFFFFF cards, #05091A text, #0A7A88 cyan and #2F5FD6 blue.",
  },
  surfaced: {
    fonts: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap",
    css: `:root{--blue-600:#0088DB;--blue-700:#006FB3;--cyan-500:#00ADE2;--cyan-400:#33C1EA;--cyan-100:#DFF4FB;--cyan-50:#F0FAFD;--ink-900:#0E1A24;--ink-700:#31434F;--ink-500:#5C6E7A;--ink-300:#9FB0BA;--ink-200:#D3DDE3;--ink-100:#E9EFF3;--white:#FFFFFF;--font-display:'Anton',system-ui,sans-serif;--font-body:'Inter',system-ui,sans-serif}`,
    notes: "Variables available: --blue-600 --blue-700 --cyan-500 --cyan-400 --cyan-100 --cyan-50 --ink-900 --ink-700 --ink-500 --ink-300 --ink-200 --ink-100 --white --font-display (Anton, one weight, never all caps) --font-body (Inter). White or cyan-50 backgrounds, or the ink-900 dark band. No gradients.",
  },
};

function assetList(brandId) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(__dirname, "brands", BRANDS[brandId].dir, "manifest.json"), "utf8"));
    const lines = [];
    for (const g of m.groups) for (const it of g.items) {
      if (g.id === "social") continue; // finished posts, not building blocks
      lines.push(`- /brands/${BRANDS[brandId].dir}/${it.file} (${g.label}${it.w ? `, ${it.w}x${it.h}` : ""})`);
    }
    return lines.join("\n");
  } catch { return ""; }
}

function sanitizeDesign(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(script|iframe|object|embed|link|meta|base|form)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/@import[^;]+;/gi, "");
}

function wrapDesign(brandId, sizeKey, inner) {
  const [w, h] = SIZES[sizeKey];
  const b = BRAND_STYLE[brandId] || BRAND_STYLE.locomotepro;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${b.fonts}"><style>${b.css}
*{box-sizing:border-box}html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}
#canvas{width:${w}px;height:${h}px;overflow:hidden;position:relative}</style></head><body>${inner}</body></html>`;
}

function parseDesign(text) {
  const d = text.match(/<design>([\s\S]*?)<\/design>/i);
  const c = text.match(/<caption>([\s\S]*?)<\/caption>/i);
  let inner = d ? d[1] : (text.match(/```html([\s\S]*?)```/i)?.[1] || "");
  if (!inner.includes('id="canvas"') && !inner.includes("id='canvas'")) throw new Error("No canvas in design output");
  return { inner: sanitizeDesign(noDash(inner.trim())), caption: c ? noDash(c[1].trim()) : "" };
}

const STYLES = {
  auto: "Choose the layout that best fits the message.",
  headline: "Bold headline layout: one big statement with a short supporting line and the logo.",
  stat: "Big number layout: one key figure from the brief, very large, with what it means.",
  list: "Feature list layout: a heading and 3 to 4 short benefit points with simple inline SVG icons.",
  product: "Product or app layout: feature the provided app screenshot or product image prominently, with a headline.",
  offer: "Offer layout: the price or offer is the hero, with what is included and a clear call to action.",
  quote: "Quote layout: a short quote or testimonial from the brief with attribution.",
  announcement: "Announcement layout: kicker label, headline, date or detail, and a call to action.",
};

function designPrompt({ brand, size, brief, style, language, hasPhoto }) {
  const [w, h, label] = SIZES[size];
  const b = BRAND_STYLE[brand];
  return `Design one static social media graphic as HTML and CSS. It will be screenshotted to a PNG exactly as rendered.

Canvas: ${w} x ${h} pixels (${label}).
Layout direction: ${STYLES[style] || STYLES.auto}
Language for all text in the graphic and caption: ${language}.

Technical rules:
- Output a <style> block and a single root <div id="canvas"> containing everything. The canvas is already sized to ${w}x${h}px; position content inside it.
- Brand CSS variables and fonts are already loaded. ${b.notes}
- Do not use <script>, <link>, @import, iframes or external URLs. Draw icons and shapes with inline SVG or CSS.
- Images you may use (absolute paths, only these):
${assetList(brand)}${hasPhoto ? `\n- {{PHOTO}} (a photo the user uploaded; use it as <img src="{{PHOTO}}"> with object-fit: cover)` : ""}
- Text must be readable on a phone: for a 1080px wide canvas, body text at least 30px and headlines 70px or larger; scale proportionally for other sizes. Keep generous margins (at least 6% of the width).
- Keep words few: headline up to 8 words, supporting line up to 16 words, button or call to action up to 4 words.
- Nothing may overflow or be cut off at the canvas edges.
- Make it look like a finished piece from this brand's design team: follow the brand book's colours, type, corner radii, spacing, voice and house rules exactly.
- Use only facts from the brief and the brand guide. Do not invent prices, numbers or claims.

After the design, write the social media caption to post with it (hook first line, short body, one call to action, a few hashtags if the brand uses them).

Output exactly this and nothing else:
<design>
<style>...</style>
<div id="canvas">...</div>
</design>
<caption>
...
</caption>

Brief:
${String(brief).slice(0, 3000)}`;
}

app.post("/api/design", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Wait a few minutes and try again." });
  const { brand = "locomotepro", size = "square", brief = "", style = "auto", language = "English", hasPhoto = false, engine = "auto", seed = 0 } = req.body || {};
  if (!BRANDS[brand] || !SIZES[size]) return res.status(400).json({ error: "Unknown brand or size." });
  if (!String(brief).trim()) return res.status(400).json({ error: "Describe the post first." });
  try {
    const prompt = designPrompt({ brand, size, brief, style, language, hasPhoto }) + (seed ? `\n\nThis is alternative ${seed + 1}: make a clearly different composition from the obvious first idea.` : "");
    const out = await ask({ system: brandSystem(brand), prompt, maxTokens: 9000, engine });
    const d = parseDesign(out.text);
    res.json({ html: wrapDesign(brand, size, d.inner), inner: d.inner, caption: d.caption, engine: LABEL[out.engine], width: SIZES[size][0], height: SIZES[size][1] });
  } catch (e) {
    console.error("design:", e.message);
    res.status(502).json({ error: "The designer couldn't finish this one. Try again, or simplify the brief." });
  }
});

app.post("/api/design/revise", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Wait a few minutes and try again." });
  const { brand = "locomotepro", size = "square", inner = "", caption = "", instruction = "", hasPhoto = false, engine = "auto" } = req.body || {};
  if (!BRANDS[brand] || !SIZES[size]) return res.status(400).json({ error: "Unknown brand or size." });
  if (!String(instruction).trim()) return res.status(400).json({ error: "Say what to change." });
  const [w, h] = SIZES[size];
  const prompt = `Here is the current ${w}x${h} graphic and its caption. Apply the requested change and keep everything else the same unless the change requires otherwise. Follow the same technical rules: one <style> block and one <div id="canvas">, brand variables only, no scripts or external URLs, only these images:
${assetList(brand)}${hasPhoto ? "\n- {{PHOTO}}" : ""}
Nothing may overflow the canvas.

Requested change: ${String(instruction).slice(0, 1500)}

Current design:
<design>
${String(inner).slice(0, 60000)}
</design>
<caption>
${String(caption).slice(0, 4000)}
</caption>

Output exactly:
<design>
...
</design>
<caption>
...
</caption>`;
  try {
    const out = await ask({ system: brandSystem(brand), prompt, maxTokens: 9000, engine });
    const d = parseDesign(out.text);
    res.json({ html: wrapDesign(brand, size, d.inner), inner: d.inner, caption: d.caption || caption, engine: LABEL[out.engine], width: w, height: h });
  } catch (e) {
    console.error("revise:", e.message);
    res.status(502).json({ error: "The change didn't go through. Try again or describe it differently." });
  }
});

// ---------- Motion Studio: AI-written motion graphics (logistics playbook) ----------
const vm = require("vm");
const crypto = require("crypto");
const readText = f => { try { return fs.readFileSync(path.join(__dirname, f), "utf8"); } catch { return ""; } };
const PLAYBOOK = readText("video/playbook.md")
  .replace(/## 4\. How the videos were rendered[\s\S]*?(?=## 5\.)/, "")   // Python toolchain does not apply here
  .replace(/## 6\. Prompt templates[\s\S]*?(?=## 7\.)/, "")
  .replace(/## 9\. Source files[\s\S]*$/, "");
const KIT_API = readText("video/motion-kit-api.md");
const EXAMPLE = readText("public/motion/example-dashboard.js");

const MOTION_SYSTEM = `You are a senior motion designer and creative coder producing logistics motion-graphics videos for a marketing team.
You write each video as JavaScript that draws every frame on an HTML canvas using the Motion Kit (global MK). The app plays it and exports a 30 fps MP4 with the synthesized sound.

Follow the playbook below exactly: its constraints, design system, motion principles, recipes, sound design and tips. Where the playbook describes Python, Pillow or FFmpeg, use the Motion Kit equivalents instead. Respect "Known gotchas", especially: narrative and data must agree; identical objects across wipes; keep 9:16 key content in the middle 65%.

Quality bar: the result must look like a polished, production motion-graphics piece: precise layout on a grid, generous spacing, consistent card sizes, staggered entrances, nothing overlapping or clipped, every label readable at 1080p (at least 16 px; most UI text 18 to 24 px; key numbers 48 px and up), and continuous subtle motion so no moment feels static. Plan the timeline first, then code it.

Never use em dashes in on-screen text. Never draw logos, brand names, headings or titles unless the request explicitly asks for them.

<playbook>
${PLAYBOOK}
</playbook>

<motion_kit_api>
${KIT_API}
</motion_kit_api>

<example_video>
This is a complete, approved example (playbook 3.2) that shows the expected code style, structure and level of polish:
${EXAMPLE}
</example_video>

Output format, always exactly:
<plan>
A short timeline: one line per beat with times, in plain language for the marketing team.
</plan>
<code>
The complete JavaScript (top-level constants and helpers, then const video = {...}). No markdown fences, no HTML.
</code>`;

const RECIPES = {
  custom: { name: "Custom concept", ref: "" },
  streams: { name: "Data-streams flowchart", ref: "playbook section 3.1" },
  dashboard: { name: "Raw data to dashboard with insights", ref: "playbook section 3.2" },
  live: { name: "Live analytics UI", ref: "playbook section 3.3" },
  pattern: { name: "AI/ML pattern discovery over a supplied frame", ref: "playbook section 3.4" },
  wipe: { name: "Truck wipe transition", ref: "playbook section 3.5" },
};

function motionPrompt(o) {
  const portrait = o.format === "9:16";
  const [w, h] = portrait ? [1080, 1920] : [1920, 1080];
  const r = RECIPES[o.recipe] || RECIPES.custom;
  const lang = o.language || "English";
  return `Create a new video.
Recipe: ${r.name}${r.ref ? ` (${r.ref}; follow its structure, layout ratios, timeline and sound design, adapted to the settings below)` : ""}.
Format: ${w}x${h} (${portrait ? "9:16 vertical; keep key content inside the middle 65% of the height" : "16:9"}).
Duration: ${Number(o.duration) || 15} seconds.
Theme: ${o.theme === "dark-light" ? "dark to light (problem to solved story, joined by a transition)" : o.theme === "dark" ? "dark" : "light"}.
Sound: ${o.sound ? "subtle synthesized sound effects synced to the animation, per the playbook (set video.sound)" : "none (set video.sound = null)"}.
Red: ${o.allowRed ? "allowed only for warnings and congestion" : "not allowed"}.
On-screen language: ${lang}.${lang !== "English" ? " Change only the words (playbook section 5): layout un-mirrored, IDs, codes and numbers stay Latin with Western digits, keep strings short enough to fit, measure and shrink if needed." : ""}
Base frame: ${o.hasFrame ? `provided as FRAME (${o.frameW}x${o.frameH}); use it as the base layer as in playbook 3.4` : "none"}.
${o.concept ? `Concept and beats:\n${String(o.concept).slice(0, 3000)}\n` : ""}${o.data ? `Data to show (placeholders are fine where not given):\n${String(o.data).slice(0, 2000)}\n` : ""}
Return the <plan> and the complete <code>.`;
}

function parseMotion(text) {
  const plan = (text.match(/<plan>([\s\S]*?)<\/plan>/i)?.[1] || "").trim();
  let code = text.match(/<code>([\s\S]*?)<\/code>/i)?.[1];
  if (!code) code = text.match(/```(?:js|javascript)?\s*([\s\S]*?)```/i)?.[1];
  if (!code) { const i = text.indexOf("<code>"); if (i >= 0) code = text.slice(i + 6); }
  code = String(code || "").replace(/^\s*```(?:js|javascript)?/i, "").replace(/```\s*$/i, "").trim();
  return { plan: noDash(plan), code };
}
function checkMotionCode(code) {
  if (!/\bvideo\s*=/.test(code)) return "The code does not define `const video = {...}`.";
  try { new vm.Script(code); return null; } catch (e) { return `JavaScript syntax error: ${e.message}`; }
}

// Claude with streaming (long outputs), falling back to the shared ask() for Gemini.
async function callClaudeStream({ system, prompt, maxTokens }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens, stream: true,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || `Claude API error ${r.status}`); }
  const reader = r.body.getReader(), dec = new TextDecoder(); let buf = "", out = "";
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      try { const ev = JSON.parse(line.slice(5)); if (ev.type === "content_block_delta" && ev.delta?.text) out += ev.delta.text; if (ev.type === "error") throw new Error(ev.error?.message || "stream error"); } catch (e) { if (e.message && !/JSON/.test(e.message)) throw e; }
    }
  }
  return out;
}
async function askLong({ system, prompt, maxTokens, engine }) {
  const first = engine === "claude" || engine === "gemini" ? engine : DEFAULT_AI;
  const order = [first, first === "claude" ? "gemini" : "claude"].filter(e => HAS[e]);
  if (!order.length) throw new Error("No AI key is set.");
  let lastErr;
  for (const e of order) {
    try { const text = e === "claude" ? await callClaudeStream({ system, prompt, maxTokens }) : await callGemini({ system, prompt, maxTokens }); return { text, engine: e }; }
    catch (err) { lastErr = err; console.error(`${e} failed (motion):`, err.message); }
  }
  throw lastErr;
}

const jobs = new Map();
setInterval(() => { const cut = Date.now() - 2 * 3600e3; for (const [k, j] of jobs) if (j.at < cut) jobs.delete(k); }, 600e3).unref();
function startJob(fn) {
  const id = crypto.randomUUID(); const job = { status: "running", at: Date.now(), stage: "Planning the timeline" }; jobs.set(id, job);
  fn(job).then(r => Object.assign(job, { status: "done" }, r)).catch(e => { console.error("motion job:", e.message); Object.assign(job, { status: "error", error: e.userMessage || "The video couldn't be generated this time. Try again, or simplify the concept." }); });
  return id;
}
async function generateMotion(job, prompt, engine) {
  job.stage = "Writing the animation";
  let out = await askLong({ system: MOTION_SYSTEM, prompt, maxTokens: 30000, engine });
  let { plan, code } = parseMotion(out.text);
  let problem = checkMotionCode(code);
  if (problem) { // one automatic repair round
    job.stage = "Fixing a code problem";
    const fix = await askLong({ system: MOTION_SYSTEM, engine, maxTokens: 30000, prompt: `This video code has a problem: ${problem}\nReturn the corrected complete code (and the same plan).\n<plan>\n${plan}\n</plan>\n<code>\n${code}\n</code>` });
    const p2 = parseMotion(fix.text); if (p2.code) { code = p2.code; plan = p2.plan || plan; out = fix; }
    problem = checkMotionCode(code);
    if (problem) { const e = new Error(problem); e.userMessage = "The generated animation had a code error. Try again."; throw e; }
  }
  return { code: noDash(code), plan, engine: LABEL[out.engine] };
}

app.post("/api/motion", (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Wait a few minutes and try again." });
  const b = req.body || {};
  if (!b.concept && (!b.recipe || b.recipe === "custom")) return res.status(400).json({ error: "Describe the concept or pick a recipe." });
  const id = startJob(job => generateMotion(job, motionPrompt(b), b.engine));
  res.json({ id });
});
app.post("/api/motion/revise", (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Wait a few minutes and try again." });
  const { code = "", plan = "", instruction = "", error = "", engine = "auto" } = req.body || {};
  if (!code) return res.status(400).json({ error: "Nothing to change yet." });
  if (!instruction && !error) return res.status(400).json({ error: "Say what to change." });
  const prompt = `${error ? `The current video throws this error when it runs: ${String(error).slice(0, 800)}\nFix it.` : `Apply this change to the current video: ${String(instruction).slice(0, 2000)}`}
Keep everything else the same unless the change requires otherwise. Return the updated <plan> and the complete updated <code>.
<plan>
${String(plan).slice(0, 4000)}
</plan>
<code>
${String(code).slice(0, 120000)}
</code>`;
  const id = startJob(job => generateMotion(job, prompt, engine));
  res.json({ id });
});
app.get("/api/motion/:id", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ status: "error", error: "This job has expired. Start again." });
  res.json({ status: j.status, stage: j.stage, code: j.code, plan: j.plan, engine: j.engine, error: j.error, elapsed: Math.round((Date.now() - j.at) / 1000) });
});
app.use("/vendor-mux", express.static(path.join(__dirname, "node_modules/mp4-muxer/build")));

app.listen(PORT, () => console.log(`Brand Studio Hub on :${PORT} (Claude: ${HAS.claude ? CLAUDE_MODEL : "off"}, Gemini: ${HAS.gemini ? GEMINI_MODEL : "off"}, default: ${DEFAULT_AI})`));
