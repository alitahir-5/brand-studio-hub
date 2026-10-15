/* Motion Kit: the logistics motion-graphics design system as drawing helpers.
   Every video is a pure function of time: video.render(ctx, t). These helpers are deterministic. */
(function (root) {
  "use strict";

  // ---------- colour ----------
  const C = {
    blue: "#114fa0",          // primary accent (17,79,160)
    blueBright: "#2e70cd",    // text and lines on dark backgrounds (46,112,205)
    ink: "#0a0e18",           // text on light theme (10,14,24)
    light: "#f7fafe",         // light theme background
    dark: "#070b14",          // dark theme background
    white: "#ffffff",
    black: "#000000",
    red: "#e62832",           // alerts only, when allowed
  };
  function rgb(c) {
    if (Array.isArray(c)) return c;
    const m = /^rgba?\(([^)]+)\)/.exec(c);
    if (m) return m[1].split(",").slice(0, 3).map(Number);
    let h = c.replace("#", "");
    if (h.length === 3) h = h.split("").map(x => x + x).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // mix(a, b, t): 0 gives a, 1 gives b. mix(C.white, C.blue, 0.12) is the soft chip fill.
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
  }
  function alpha(c, a) { const A = rgb(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }

  // ---------- timing ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = p => 1 - Math.pow(1 - clamp(p), 3);
  const easeInOutCubic = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const easeInCubic = p => Math.pow(clamp(p), 3);
  function smoothstep(e0, e1, x) { const p = clamp((x - e0) / (e1 - e0)); return p * p * (3 - 2 * p); }
  // prog(t, start, dur): eased 0..1 progress of an event
  function prog(t, start, dur, ease = easeOutCubic) { return ease(clamp((t - start) / dur)); }
  // enter(t, start): standard entrance (fade + slide), returns {a, dy, p}
  function enter(t, start, opts = {}) {
    const dur = opts.dur ?? 0.6, dist = opts.dist ?? 20;
    const p = prog(t, start, dur);
    return { a: p, dy: (1 - p) * dist, p };
  }
  // exit(t, start): 1 before start, fades to 0 over dur
  function exit(t, start, dur = 0.4) { return 1 - prog(t, start, dur, easeInOutCubic); }
  // flash(t): hard on/off, on for the first half of each cycle
  function flash(t, hz = 3, phase = 0) { return ((t * hz + phase) % 1 + 1) % 1 < 0.5; }
  // pulse(t): smooth 0..1 oscillation
  function pulse(t, hz = 1, phase = 0) { return 0.5 - 0.5 * Math.cos((t * hz + phase) * Math.PI * 2); }

  // ---------- deterministic randomness ----------
  function rng(seed = 1) { // mulberry32
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(i, seed = 0) { let x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); }
  // smooth value noise in 0..1, continuous in x
  function noise(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, seed), hash(i + 1, seed), u); }
  // pick(arr, i, seed): deterministic choice
  function pick(arr, i, seed = 0) { return arr[Math.floor(hash(i, seed) * arr.length) % arr.length]; }

  // ---------- fonts and text ----------
  const FONT = {
    ui: '"Arimo", "Liberation Sans", "Noto Sans Arabic", "Noto Sans Bengali", Arial, sans-serif',
    mono: '"Cousine", "Liberation Mono", "Noto Sans Arabic", "Noto Sans Bengali", monospace',
  };
  const RTL_RE = /[֐-ࣿﭐ-﷿ﹰ-﻿]/;
  // text(ctx, str, x, y, {size, weight, mono, color, align, baseline, alpha, maxWidth, letterSpacing})
  function text(ctx, s, x, y, o = {}) {
    s = String(s);
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = `${o.weight ?? 400} ${o.size ?? 24}px ${o.mono ? FONT.mono : FONT.ui}`;
    ctx.fillStyle = o.color ?? C.ink;
    ctx.textAlign = o.align ?? "left";
    ctx.textBaseline = o.baseline ?? "alphabetic";
    ctx.direction = RTL_RE.test(s) ? "rtl" : "ltr";
    if (o.letterSpacing) ctx.letterSpacing = o.letterSpacing + "px";
    if (o.maxWidth) ctx.fillText(s, x, y, o.maxWidth); else ctx.fillText(s, x, y);
    ctx.restore();
  }
  function measure(ctx, s, o = {}) {
    ctx.save(); ctx.font = `${o.weight ?? 400} ${o.size ?? 24}px ${o.mono ? FONT.mono : FONT.ui}`;
    if (o.letterSpacing) ctx.letterSpacing = o.letterSpacing + "px";
    const w = ctx.measureText(String(s)).width; ctx.restore(); return w;
  }
  // wrap(ctx, str, maxWidth, o) -> lines[]
  function wrap(ctx, s, maxW, o = {}) {
    const out = []; let line = "";
    for (const w of String(s).split(/\s+/)) { const t = line ? line + " " + w : w; if (measure(ctx, t, o) > maxW && line) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line); return out;
  }
  // number formatting: num(1234.5, {decimals:1, prefix:"$", suffix:"%"})
  function num(v, o = {}) {
    const d = o.decimals ?? 0;
    return (o.prefix ?? "") + Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + (o.suffix ?? "");
  }

  // ---------- shapes ----------
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2 - 0.5, h / 2 - 0.5));
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  }
  function line(ctx, x1, y1, x2, y2, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = o.color ?? C.blue; ctx.lineWidth = o.width ?? 2;
    ctx.lineCap = o.cap ?? "round"; if (o.dash) ctx.setLineDash(o.dash); if (o.dashOffset) ctx.lineDashOffset = o.dashOffset;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  // partial polyline: draws the first `p` (0..1) of the path length
  function path(ctx, pts, o = {}) {
    const p = clamp(o.progress ?? 1); if (pts.length < 2 || p <= 0) return;
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let left = total * p;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = o.color ?? C.blue; ctx.lineWidth = o.width ?? 3;
    ctx.lineJoin = "round"; ctx.lineCap = "round"; if (o.dash) ctx.setLineDash(o.dash);
    if (o.glow) { ctx.shadowColor = o.glowColor ?? ctx.strokeStyle; ctx.shadowBlur = o.glow; }
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const d = seg[i - 1], k = Math.min(1, left / d);
      ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); left -= d;
    }
    ctx.stroke(); ctx.restore();
  }
  // point at fraction p along a polyline -> [x, y]
  function along(pts, p) {
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let left = total * clamp(p);
    for (let i = 1; i < pts.length; i++) { const d = seg[i - 1]; if (left <= d || i === pts.length - 1) { const k = d ? clamp(left / d) : 0; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } left -= d; }
    return pts[pts.length - 1];
  }
  function circle(ctx, x, y, r, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (o.glow) { ctx.shadowColor = o.glowColor ?? o.fill ?? o.stroke ?? C.blueBright; ctx.shadowBlur = o.glow; }
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width ?? 2; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); }
    ctx.restore();
  }
  // glow(ctx, color, blur, fn): draw fn() with a soft glow (dark theme)
  function glow(ctx, color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }

  // ---------- UI building blocks ----------
  // card: white rounded rectangle, 1.5px border at ~16% blue, 3-layer soft shadow (light).
  // On dark theme: deep panel with a bright-blue hairline.
  function card(ctx, x, y, w, h, o = {}) {
    const r = o.r ?? 18, a = o.alpha ?? 1, dark = (o.theme ?? "light") === "dark";
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    if (!dark && o.shadow !== false) {
      const layers = [[0, 1, 2, 0.06], [0, 6, 14, 0.06], [0, 18, 36, 0.07]];
      for (const [ox, oy, b, al] of layers) { ctx.save(); ctx.shadowColor = alpha(C.ink, al); ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy; ctx.shadowBlur = b; rr(ctx, x, y, w, h, r); ctx.fillStyle = o.fill ?? C.white; ctx.fill(); ctx.restore(); }
    }
    rr(ctx, x, y, w, h, r); ctx.fillStyle = o.fill ?? (dark ? mix(C.dark, C.blueBright, 0.07) : C.white); ctx.fill();
    ctx.lineWidth = o.borderWidth ?? 1.5; ctx.strokeStyle = o.border ?? (dark ? alpha(C.blueBright, 0.35) : alpha(C.blue, 0.16)); ctx.stroke();
    if (o.highlight) { ctx.lineWidth = 3; ctx.strokeStyle = alpha(dark ? C.blueBright : C.blue, o.highlight); rr(ctx, x - 4, y - 4, w + 8, h + 8, r + 4); ctx.stroke(); }
    ctx.restore();
  }
  // chip: pill, soft blue fill with bold blue text. bad: black fill, white text. alert: red fill.
  // Returns {w, h}. align: "left" | "center" | "right" relative to x.
  function chip(ctx, x, y, label, o = {}) {
    const size = o.size ?? 20, padX = size * 0.65, h = size * 1.7;
    const w = measure(ctx, label, { size, weight: 700 }) + padX * 2;
    const a = o.alpha ?? 1; if (a <= 0) return { w, h };
    const dark = (o.theme ?? "light") === "dark";
    let x0 = x; if (o.align === "center") x0 = x - w / 2; else if (o.align === "right") x0 = x - w;
    let fill = dark ? alpha(C.blueBright, 0.18) : mix(C.white, C.blue, 0.12), color = dark ? mix(C.blueBright, C.white, 0.35) : C.blue;
    if (o.bad) { fill = dark ? C.white : C.black; color = dark ? C.black : C.white; }
    if (o.alert) { fill = C.red; color = C.white; }
    if (o.solid) { fill = dark ? C.blueBright : C.blue; color = C.white; }
    ctx.save(); ctx.globalAlpha *= a; rr(ctx, x0, y - h / 2, w, h, h / 2); ctx.fillStyle = o.fill ?? fill; ctx.fill(); ctx.restore();
    text(ctx, label, x0 + w / 2, y + size * 0.36, { size, weight: 700, color: o.color ?? color, align: "center", alpha: a });
    return { w, h, x: x0 };
  }
  // badge: blue circle with a white number, links an insight to a chart element
  function badge(ctx, x, y, n, o = {}) {
    const r = o.r ?? 18, a = o.alpha ?? 1; if (a <= 0) return;
    const s = o.scale ?? 1;
    circle(ctx, x, y, r * s, { fill: o.fill ?? ((o.theme ?? "light") === "dark" ? C.blueBright : C.blue), alpha: a });
    text(ctx, String(n), x, y + r * 0.36 * s, { size: r * 1.05 * s, weight: 700, color: C.white, align: "center", alpha: a });
  }
  // statusDot: small live dot with a pulsing ring
  function liveDot(ctx, x, y, t, o = {}) {
    const c = o.color ?? C.blue; const p = (t * (o.hz ?? 1)) % 1;
    circle(ctx, x, y, 6 + p * 14, { stroke: c, width: 2, alpha: (1 - p) * 0.6 });
    circle(ctx, x, y, 6, { fill: c });
  }
  // pulsing outline around a rectangle (highlight a chart element)
  function pulseOutline(ctx, x, y, w, h, t, o = {}) {
    const p = pulse(t, o.hz ?? 1.2); const pad = 6 + p * 6;
    ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1) * (0.5 + 0.5 * p); ctx.lineWidth = 3; ctx.strokeStyle = o.color ?? C.blue;
    rr(ctx, x - pad, y - pad, w + pad * 2, h + pad * 2, (o.r ?? 12) + pad); ctx.stroke(); ctx.restore();
  }

  // ---------- AI-ish background: dot grid + drifting network + slow scan band ----------
  const _bgCache = new Map();
  function _nodes(w, h, n, seed) {
    const key = `${w}x${h}x${n}x${seed}`; if (_bgCache.has(key)) return _bgCache.get(key);
    const R = rng(seed), arr = [];
    for (let i = 0; i < n; i++) arr.push({ x: R() * w, y: R() * h, vx: (R() - 0.5) * 18, vy: (R() - 0.5) * 18, ph: R() * 6.28 });
    _bgCache.set(key, arr); return arr;
  }
  function background(ctx, t, o = {}) {
    const w = o.w ?? ctx.canvas.width, h = o.h ?? ctx.canvas.height, dark = (o.theme ?? "light") === "dark";
    const bg = o.bg ?? (dark ? C.dark : C.light);
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // dot grid every 60px
    const gap = o.grid ?? 60; ctx.fillStyle = dark ? alpha(C.blueBright, 0.16) : alpha(C.blue, 0.13);
    for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) { ctx.beginPath(); ctx.arc(x, y, dark ? 1.4 : 1.6, 0, 6.283); ctx.fill(); }
    // drifting network
    const n = o.nodes ?? (w * h > 1.5e6 ? 60 : 45), nodes = _nodes(w, h, n, o.seed ?? 7);
    const pos = nodes.map(p => {
      let x = p.x + p.vx * t + Math.sin(t * 0.3 + p.ph) * 12, y = p.y + p.vy * t + Math.cos(t * 0.25 + p.ph) * 12;
      x = ((x % (w + 200)) + w + 200) % (w + 200) - 100; y = ((y % (h + 200)) + h + 200) % (h + 200) - 100; return [x, y];
    });
    const lineC = dark ? C.blueBright : C.blue, maxD = o.linkDist ?? 280;
    ctx.lineWidth = 1;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      const d = Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
      if (d < maxD) { ctx.strokeStyle = alpha(lineC, (1 - d / maxD) * (dark ? 0.22 : 0.14)); ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.lineTo(pos[j][0], pos[j][1]); ctx.stroke(); }
    }
    for (const [x, y] of pos) { ctx.fillStyle = alpha(lineC, dark ? 0.5 : 0.3); ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.283); ctx.fill(); }
    // slow scan band
    if (o.scan !== false) {
      const period = o.scanPeriod ?? 9, vertical = o.scanDir === "vertical";
      const p = ((t / period) % 1);
      const span = vertical ? h : w, pos0 = -200 + p * (span + 400), bw = 220;
      const g = vertical ? ctx.createLinearGradient(0, pos0 - bw, 0, pos0 + bw) : ctx.createLinearGradient(pos0 - bw, 0, pos0 + bw, 0);
      const peak = dark ? 0.16 : 0.07;
      g.addColorStop(0, alpha(lineC, 0)); g.addColorStop(0.5, alpha(lineC, peak)); g.addColorStop(1, alpha(lineC, 0));
      ctx.fillStyle = g; if (vertical) ctx.fillRect(0, pos0 - bw, w, bw * 2); else ctx.fillRect(pos0 - bw, 0, bw * 2, h);
    }
    ctx.restore();
  }

  // ---------- charts ----------
  function _range(values, o) {
    const min = o.min ?? Math.min(...values), max = o.max ?? Math.max(...values);
    return [min, max === min ? min + 1 : max];
  }
  // lineChart(ctx, x, y, w, h, values, {progress, color, width, dashed, fill, min, max, glow, dots})
  function lineChart(ctx, x, y, w, h, values, o = {}) {
    if (!values || values.length < 2) return [];
    const [mn, mx] = _range(values, o);
    const pts = values.map((v, i) => [x + (i / (values.length - 1)) * w, y + h - ((v - mn) / (mx - mn)) * h]);
    const p = o.progress ?? 1, color = o.color ?? C.blue;
    if (o.fill && p > 0) {
      ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
      ctx.beginPath(); ctx.rect(x, y - 10, w * p, h + 20); ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, alpha(color, 0.22)); g.addColorStop(1, alpha(color, 0));
      ctx.beginPath(); ctx.moveTo(pts[0][0], y + h); for (const q of pts) ctx.lineTo(q[0], q[1]); ctx.lineTo(pts[pts.length - 1][0], y + h); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    }
    path(ctx, pts, { progress: p, color, width: o.width ?? 3, dash: o.dashed ? [10, 8] : null, alpha: o.alpha, glow: o.glow });
    if (o.dots) pts.forEach((q, i) => { if (i / (pts.length - 1) <= p) circle(ctx, q[0], q[1], 4, { fill: color, alpha: o.alpha }); });
    return pts;
  }
  // bars(ctx, x, y, w, h, values, {progress, color, highlight, gap, labels, labelColor, min, max, colors, radius})
  // progress can be a number or a function i -> 0..1 (for staggering)
  function bars(ctx, x, y, w, h, values, o = {}) {
    const n = values.length, gap = o.gap ?? 0.28, bw = w / n * (1 - gap), mx = o.max ?? Math.max(...values), out = [];
    for (let i = 0; i < n; i++) {
      const p = typeof o.progress === "function" ? o.progress(i) : (o.progress ?? 1);
      const bh = (values[i] / mx) * h * clamp(p), bx = x + (i + gap / 2) * (w / n), by = y + h - bh;
      let col = o.colors ? o.colors[i] : (o.color ?? alpha(C.blue, 0.35));
      if (o.highlight === i) col = o.highlightColor ?? C.blue;
      ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; rr(ctx, bx, by, bw, Math.max(bh, 0.01), o.radius ?? 6); ctx.fillStyle = col; ctx.fill(); ctx.restore();
      if (o.labels) text(ctx, o.labels[i], bx + bw / 2, y + h + (o.labelSize ?? 18) + 8, { size: o.labelSize ?? 18, color: o.labelColor ?? alpha(C.ink, 0.6), align: "center", alpha: o.alpha });
      out.push({ x: bx, y: by, w: bw, h: bh });
    }
    return out;
  }
  // donut(ctx, cx, cy, r, parts, {progress, thickness, colors, gap})
  function donut(ctx, cx, cy, r, parts, o = {}) {
    const total = parts.reduce((a, b) => a + b, 0), p = clamp(o.progress ?? 1), th = o.thickness ?? r * 0.32;
    const cols = o.colors ?? [C.blue, mix(C.white, C.blue, 0.6), mix(C.white, C.blue, 0.35), C.ink, mix(C.white, C.ink, 0.5)];
    let a0 = -Math.PI / 2; const end = a0 + Math.PI * 2 * p;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.lineWidth = th; ctx.lineCap = "butt";
    ctx.strokeStyle = alpha(C.blue, 0.08); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
    parts.forEach((v, i) => {
      const a1 = a0 + (v / total) * Math.PI * 2; const e = Math.min(a1, end);
      if (e > a0) { ctx.strokeStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(cx, cy, r, a0 + (o.gap ?? 0.02), e - (o.gap ?? 0.02)); ctx.stroke(); }
      a0 = a1;
    });
    ctx.restore();
  }
  // ring gauge: value 0..1
  function ring(ctx, cx, cy, r, value, o = {}) {
    const th = o.thickness ?? r * 0.18, p = clamp(o.progress ?? 1), dark = (o.theme ?? "light") === "dark";
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.lineWidth = th; ctx.lineCap = "round";
    ctx.strokeStyle = dark ? alpha(C.blueBright, 0.18) : alpha(C.blue, 0.1); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = o.color ?? (dark ? C.blueBright : C.blue); ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(value) * p); ctx.stroke();
    ctx.restore();
    if (o.label !== undefined) text(ctx, o.label, cx, cy + r * 0.16, { size: o.labelSize ?? r * 0.42, weight: 700, align: "center", color: dark ? C.white : C.ink, alpha: o.alpha });
  }
  // series(seed, n, base, amp, {trend, step}) -> deterministic data series
  function series(seed, n, base, amp, o = {}) {
    const out = []; for (let i = 0; i < n; i++) out.push(base + (o.trend ?? 0) * i + (noise(i * (o.step ?? 0.35), seed) - 0.5) * 2 * amp); return out;
  }
  // live(seed, t, base, amp, rate): smoothly varying live value
  function live(seed, t, base, amp, rate = 0.6) { return base + (noise(t * rate, seed) - 0.5) * 2 * amp; }

  // ---------- images ----------
  function imageCover(ctx, img, x, y, w, h, o = {}) {
    if (!img || !img.width) return;
    const z = o.zoom ?? 1, s = Math.max(w / img.width, h / img.height) * z;
    const iw = img.width * s, ih = img.height * s;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x + (w - iw) / 2 + (o.panX ?? 0), y + (h - ih) / 2 + (o.panY ?? 0), iw, ih); ctx.restore();
  }
  // camera(ctx, {zoom, cx, cy, w, h}, fn): draw fn() through a virtual camera centred on (cx, cy)
  function camera(ctx, cam, fn) {
    const w = cam.w ?? ctx.canvas.width, h = cam.h ?? ctx.canvas.height, z = cam.zoom ?? 1;
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-(cam.cx ?? w / 2), -(cam.cy ?? h / 2)); fn(); ctx.restore();
  }

  // ---------- sound: synthesized cues ----------
  // cues: [{t, type, freq, dur, gain, pan, to}] types: pop, whoosh, thump, chime, tick, blip, click, sweep, arp
  // renderAudio(sound, duration) -> Promise<AudioBuffer> (stereo, 48 kHz, peak 0.85)
  const NOTES = { C3: 130.81, E3: 164.81, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };
  function noteFreq(f) { return typeof f === "string" ? (NOTES[f] ?? 440) : f; }
  async function renderAudio(sound, duration, sr = 48000) {
    const len = Math.ceil((duration + 0.2) * sr);
    const OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    const ac = new OAC(2, len, sr);
    const master = ac.createGain(); master.gain.value = 0.9;
    // light echo reverb
    const dry = ac.createGain(), wet = ac.createGain(), delay = ac.createDelay(1), fb = ac.createGain();
    dry.gain.value = 1; wet.gain.value = 0.18; delay.delayTime.value = 0.13; fb.gain.value = 0.32;
    dry.connect(master); delay.connect(wet); wet.connect(master); delay.connect(fb); fb.connect(delay); master.connect(ac.destination);
    const bus = ac.createGain(); bus.connect(dry); bus.connect(delay);
    const noiseBuf = ac.createBuffer(1, sr * 2, sr); { const d = noiseBuf.getChannelData(0); const R = rng(99); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; }
    const out = (pan) => { const p = ac.createStereoPanner(); p.pan.value = clamp(pan ?? 0, -1, 1); p.connect(bus); return p; };
    const env = (g, t0, a, peak, d) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); };
    const osc = (type, f, t0, stop, dest) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.connect(dest); o.start(t0); o.stop(stop); return o; };
    const cues = (sound && sound.cues) || [];
    for (const c of cues) {
      const t0 = Math.max(0, c.t), g = ac.createGain(), vol = (c.gain ?? 0.6);
      g.connect(out(c.pan));
      const f = noteFreq(c.freq ?? 600);
      switch (c.type) {
        case "pop": { const o = osc("sine", f * 0.75, t0, t0 + 0.25, g); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.04); env(g, t0, 0.005, 0.5 * vol, 0.14); break; }
        case "thump": { const o = osc("sine", c.freq ? f : 120, t0, t0 + 0.4, g); o.frequency.exponentialRampToValueAtTime(48, t0 + 0.18); env(g, t0, 0.005, 0.9 * vol, 0.3); break; }
        case "chime": { osc("sine", f, t0, t0 + 1.6, g); const g2 = ac.createGain(); g2.gain.value = 0.3; g2.connect(g); osc("sine", f * 2.01, t0, t0 + 1.6, g2); env(g, t0, 0.01, 0.35 * vol, 1.3); break; }
        case "tick": { osc("square", c.freq ? f : 2200, t0, t0 + 0.03, g); env(g, t0, 0.001, 0.08 * vol, 0.02); break; }
        case "blip": { osc("sine", c.freq ? f : 1320, t0, t0 + 0.1, g); env(g, t0, 0.003, 0.18 * vol, 0.06); break; }
        case "click": { const s = ac.createBufferSource(); s.buffer = noiseBuf; const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000; s.connect(hp); hp.connect(g); s.start(t0, Math.random() * 1); s.stop(t0 + 0.02); env(g, t0, 0.001, 0.12 * vol, 0.012); break; }
        case "whoosh": { const d = c.dur ?? 0.6; const s = ac.createBufferSource(); s.buffer = noiseBuf; const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
          bp.frequency.setValueAtTime(c.from ?? 300, t0); bp.frequency.exponentialRampToValueAtTime(c.to ?? 2400, t0 + d); s.connect(bp); bp.connect(g); s.start(t0); s.stop(t0 + d + 0.05);
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35 * vol, t0 + d * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); break; }
        case "sweep": { const d = c.dur ?? 0.8; const o = osc("sine", noteFreq(c.from ?? 180), t0, t0 + d + 0.05, g); o.frequency.exponentialRampToValueAtTime(noteFreq(c.to ?? 900), t0 + d);
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16 * vol, t0 + d * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); break; }
        case "arp": { (c.notes ?? ["C4", "E4", "G4", "C5"]).forEach((n, i) => { const gi = ac.createGain(); gi.connect(g); const ti = t0 + i * (c.step ?? 0.12); osc("sine", noteFreq(n), ti, ti + 1.2, gi); env(gi, ti, 0.01, 0.3, 1); }); g.gain.value = vol; break; }
        default: break;
      }
    }
    if (sound && sound.pad && sound.pad.length) {
      const pg = ac.createGain(); pg.connect(bus); const pv = sound.padGain ?? 0.05;
      pg.gain.setValueAtTime(0.0001, 0); pg.gain.exponentialRampToValueAtTime(pv, 2); pg.gain.setValueAtTime(pv, Math.max(2.01, duration - 1.6)); pg.gain.exponentialRampToValueAtTime(0.0001, duration);
      sound.pad.forEach(f => osc("sine", noteFreq(f), 0, duration + 0.1, pg));
    }
    const buf = await ac.startRendering();
    let peak = 0; for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
    if (peak > 0) { const k = 0.85 / peak; for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; } }
    return buf;
  }

  root.MK = {
    C, mix, alpha, rgb, clamp, lerp, easeOutCubic, easeInOutCubic, easeInCubic, smoothstep, prog, enter, exit, flash, pulse,
    rng, hash, noise, pick, FONT, text, measure, wrap, num, rr, line, path, along, circle, glow, card, chip, badge, liveDot,
    pulseOutline, background, lineChart, bars, donut, ring, series, live, imageCover, camera, renderAudio, NOTES,
  };
})(typeof window !== "undefined" ? window : globalThis);
