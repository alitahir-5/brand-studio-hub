// Example: raw records refined by a scan beam into a KPI dashboard with insights (playbook 3.2).
// 1920x1080, 19 s, light theme, subtle sound. All figures are placeholders.
const W = 1920, H = 1080, D = 19;
const { C } = MK;

// ---- deterministic data, computed once ----
const R = MK.rng(42);
const RAW = Array.from({ length: 5 }, (_, col) => Array.from({ length: 40 }, (_, i) => {
  const id = "SH-" + (48000 + Math.floor(R() * 999));
  const recs = [
    `${id} KHI>DXB stage=customs dwell=${(20 + R() * 40).toFixed(1)}h`,
    `${id} dock=D${1 + Math.floor(R() * 6)} wait=${Math.floor(R() * 90)}m`,
    `${id} route=B cost/pallet=$${(14 + R() * 9).toFixed(2)}`,
    `${id} eta_delta=+${(R() * 3).toFixed(1)}d hs=8471.30`,
    `${id} pod=pending gps=24.86,67.01`,
  ];
  return { text: recs[(i + col) % recs.length], flag: R() < 0.12, ts: `14:${String(Math.floor(R() * 60)).padStart(2, "0")}:${String(Math.floor(R() * 60)).padStart(2, "0")}` };
}));
const TRANSIT = MK.series(3, 24, 4.6, 0.55, { trend: -0.004 });
const TARGET = Array(24).fill(4.0);
const DWELL = [6.2, 9.8, 4.1, 21.5, 7.3];       // hours by stage
const DWELL_L = ["Order", "Whse", "Load", "Customs", "Deliv"];
const CAUSES = [38, 24, 18, 12, 8];
const CAUSE_L = ["Customs", "Dock", "Weather", "Docs", "Other"];
const KPIS = [
  { label: "Avg transit", val: 4.6, dec: 1, suf: " d", chip: "+0.6 d vs target", bad: true, proj: "3.8 d" },
  { label: "On-time delivery", val: 91, dec: 0, suf: "%", chip: "-3 pts", bad: true, proj: "95%" },
  { label: "Cost per shipment", val: 46.2, dec: 2, pre: "$", chip: "-2.1%", proj: "$43.10" },
  { label: "Shipments today", val: 1284, dec: 0, chip: "+8%", proj: "1,284" },
];
const INSIGHTS = [
  { n: 1, t0: 8.4, obs: "Customs clearance runs 1.9 days over target", act: "Pre-file documents 24 h earlier", impact: "-24 h transit" },
  { n: 2, t0: 11.0, obs: "Dock congestion Tue to Thu, 14:00 to 18:00", act: "Stagger dispatch into morning slots", impact: "+4% on-time" },
  { n: 3, t0: 13.6, obs: "Route B costs 18% more per pallet", act: "Consolidate loads onto Route A", impact: "-$3.10 per shipment" },
];
const SPARK = KPIS.map((_, i) => MK.series(10 + i, 14, 10, 2.5));

// ---- layout ----
const kx = i => 80 + 447 * i, KY = 70, KW = 417, KH = 160;
const LINE = { x: 80, y: 260, w: 920, h: 440 }, BARS = { x: 1030, y: 260, w: 440, h: 440 }, DON = { x: 1500, y: 260, w: 340, h: 440 };
const insX = i => 80 + 593 * i, INY = 735, INW = 567, INH = 275;

function drawRaw(ctx, t, alpha) {
  if (alpha <= 0) return;
  for (let col = 0; col < 5; col++) {
    const x = 70 + col * 372, off = (t * 46 + col * 37) % 36;
    for (let i = 0; i < 32; i++) {
      const r = RAW[col][(i + Math.floor(t * 46 / 36)) % RAW[col].length], y = 40 + i * 36 - off;
      if (y < 20 || y > H - 10) continue;
      const fade = MK.clamp(1 - Math.abs(y - H / 2) / (H * 0.62));
      if (r.flag) { ctx.save(); ctx.globalAlpha = alpha * fade; ctx.fillStyle = MK.mix(C.white, C.blue, 0.1); ctx.fillRect(x - 6, y - 21, 352, 30); ctx.restore(); }
      MK.text(ctx, r.ts, x, y, { size: 15, mono: true, color: MK.alpha(C.ink, 0.45), alpha: alpha * fade });
      MK.text(ctx, r.text, x + 82, y, { size: 15, mono: true, color: r.flag ? C.black : C.blue, weight: r.flag ? 700 : 400, alpha: alpha * fade, maxWidth: 262 });
    }
  }
}

function drawDashboard(ctx, t) {
  // KPI cards
  KPIS.forEach((k, i) => {
    const e = MK.enter(t, 3.3 + i * 0.12), x = kx(i), y = KY + e.dy;
    MK.card(ctx, x, y, KW, KH, { alpha: e.a });
    MK.text(ctx, k.label, x + 24, y + 38, { size: 20, color: MK.alpha(C.ink, 0.6), alpha: e.a });
    const c = MK.prog(t, 4.0 + i * 0.12, 1.6);
    const projected = t > 16 ? MK.prog(t, 16 + i * 0.15, 0.6) : 0;
    const v = MK.num(k.val * c, { decimals: k.dec, prefix: k.pre, suffix: k.suf });
    MK.text(ctx, v, x + 24, y + 104, { size: 56, weight: 700, color: C.ink, alpha: e.a * (1 - projected) });
    if (projected > 0) {
      MK.text(ctx, k.proj, x + 24, y + 104, { size: 56, weight: 700, color: C.blue, alpha: e.a * projected });
      MK.chip(ctx, x + 24, y + 136, "with actions", { size: 15, alpha: projected, solid: true });
    } else {
      MK.chip(ctx, x + 24, y + 136, k.chip, { size: 15, bad: k.bad, alpha: e.a * c });
      MK.lineChart(ctx, x + 250, y + 70, 140, 50, SPARK[i], { progress: c, width: 2.5, color: MK.alpha(C.blue, 0.8) });
    }
  });
  // transit line chart
  let e = MK.enter(t, 3.6);
  MK.card(ctx, LINE.x, LINE.y + e.dy, LINE.w, LINE.h, { alpha: e.a });
  MK.text(ctx, "Transit time, days", LINE.x + 24, LINE.y + e.dy + 40, { size: 20, weight: 700, alpha: e.a });
  const lp = MK.prog(t, 4.4, 2.2, MK.easeInOutCubic);
  const cy = LINE.y + e.dy + 90;
  ctx.save(); ctx.globalAlpha = e.a * 0.5; ctx.fillStyle = MK.mix(C.white, C.blue, 0.08); ctx.fillRect(LINE.x + 560, cy, 220, 300); ctx.restore();
  MK.lineChart(ctx, LINE.x + 40, cy, 840, 300, TARGET, { min: 3, max: 6, dashed: true, color: MK.alpha(C.ink, 0.45), width: 2, progress: lp, alpha: e.a });
  MK.lineChart(ctx, LINE.x + 40, cy, 840, 300, TRANSIT, { min: 3, max: 6, fill: true, progress: lp, alpha: e.a, width: 3.5 });
  MK.text(ctx, "actual", LINE.x + 40, LINE.y + e.dy + LINE.h - 22, { size: 16, color: C.blue, weight: 700, alpha: e.a });
  MK.text(ctx, "target", LINE.x + 120, LINE.y + e.dy + LINE.h - 22, { size: 16, color: MK.alpha(C.ink, 0.5), weight: 700, alpha: e.a });
  // dwell bars
  e = MK.enter(t, 3.75);
  MK.card(ctx, BARS.x, BARS.y + e.dy, BARS.w, BARS.h, { alpha: e.a });
  MK.text(ctx, "Dwell by stage, h", BARS.x + 24, BARS.y + e.dy + 40, { size: 20, weight: 700, alpha: e.a });
  const barRects = MK.bars(ctx, BARS.x + 30, BARS.y + e.dy + 90, 380, 270, DWELL, { progress: i => MK.prog(t, 4.6 + i * 0.12, 0.7), highlight: 3, labels: DWELL_L, alpha: e.a });
  // donut
  e = MK.enter(t, 3.9);
  MK.card(ctx, DON.x, DON.y + e.dy, DON.w, DON.h, { alpha: e.a });
  MK.text(ctx, "Delay causes", DON.x + 24, DON.y + e.dy + 40, { size: 20, weight: 700, alpha: e.a });
  MK.donut(ctx, DON.x + 170, DON.y + e.dy + 200, 92, CAUSES, { progress: MK.prog(t, 5.0, 1.4, MK.easeInOutCubic), alpha: e.a });
  CAUSE_L.slice(0, 3).forEach((l, i) => MK.text(ctx, `${l} ${CAUSES[i]}%`, DON.x + 30 + i * 100, DON.y + e.dy + 360, { size: 15, color: MK.alpha(C.ink, 0.7), alpha: e.a * MK.prog(t, 5.6, 0.5) }));
  return { barRects };
}

function drawInsights(ctx, t, geo) {
  INSIGHTS.forEach((s, i) => {
    const e = MK.enter(t, s.t0, { dist: 26, dur: 0.7 }); if (e.a <= 0) return;
    const x = insX(i), y = INY + e.dy;
    MK.card(ctx, x, y, INW, INH, { alpha: e.a });
    MK.badge(ctx, x + 36, y + 40, s.n, { alpha: e.a });
    const lines = MK.wrap(ctx, s.obs, INW - 100, { size: 22, weight: 700 });
    lines.slice(0, 2).forEach((l, k) => MK.text(ctx, l, x + 68, y + 48 + k * 30, { size: 22, weight: 700, alpha: e.a }));
    MK.line(ctx, x + 24, y + 128, x + INW - 24, y + 128, { color: MK.alpha(C.blue, 0.15), width: 1.5, alpha: e.a });
    MK.text(ctx, "RECOMMENDED ACTION", x + 24, y + 160, { size: 14, mono: true, color: MK.alpha(C.ink, 0.5), letterSpacing: 1.5, alpha: e.a });
    MK.text(ctx, s.act, x + 24, y + 194, { size: 21, color: C.ink, alpha: e.a });
    MK.chip(ctx, x + 24, y + 236, s.impact, { size: 18, solid: true, alpha: e.a });
    // link the insight to its chart element
    const hl = MK.clamp((t - s.t0) / 0.4) * (1 - MK.prog(t, s.t0 + 2.4, 0.5));
    if (hl > 0) {
      if (s.n === 1) { MK.pulseOutline(ctx, LINE.x + 560, LINE.y + 90, 220, 300, t, { alpha: hl }); MK.badge(ctx, LINE.x + 780, LINE.y + 90, 1, { alpha: hl }); }
      if (s.n === 2) { const b = geo.barRects[1]; MK.pulseOutline(ctx, b.x, b.y, b.w, b.h, t, { alpha: hl, r: 6 }); MK.badge(ctx, b.x + b.w, b.y - 6, 2, { alpha: hl }); }
      if (s.n === 3) { MK.pulseOutline(ctx, DON.x + 70, DON.y + 100, 200, 200, t, { alpha: hl, r: 100 }); MK.badge(ctx, DON.x + 270, DON.y + 110, 3, { alpha: hl }); }
    }
  });
}

const video = {
  width: W, height: H, duration: D, theme: "light",
  title: "Raw data to insights",
  render(ctx, t) {
    MK.background(ctx, t, { theme: "light" });
    // scan beam sweeps left to right between 3.0 and 5.6 s
    const beam = MK.smoothstep(3.0, 5.6, t), bx = -60 + beam * (W + 120);
    // raw data on the right of the beam
    ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W - bx + 60, H); ctx.clip();
    drawRaw(ctx, t, 1 - MK.prog(t, 5.6, 0.4)); ctx.restore();
    // dashboard on the left of the beam
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, bx), H); ctx.clip();
    const geo = drawDashboard(ctx, t); drawInsights(ctx, t, geo); ctx.restore();
    if (beam > 0 && beam < 1) {
      const g = ctx.createLinearGradient(bx - 260, 0, bx, 0); g.addColorStop(0, MK.alpha(C.blue, 0)); g.addColorStop(1, MK.alpha(C.blue, 0.12));
      ctx.fillStyle = g; ctx.fillRect(bx - 260, 0, 260, H);
      MK.glow(ctx, C.blue, 24, () => MK.line(ctx, bx, 0, bx, H, { color: C.blue, width: 4 }));
    }
  },
  sound: {
    pad: [65.4, 98, 164.8],
    cues: [
      ...Array.from({ length: 18 }, (_, i) => ({ t: 0.2 + i * 0.16, type: "tick", gain: 0.5, pan: (i % 5) / 2 - 1 })),
      { t: 3.0, type: "whoosh", dur: 2.4, from: 300, to: 3000, gain: 0.8 },
      { t: 3.0, type: "sweep", from: 180, to: 900, dur: 2.6 },
      ...[0, 1, 2, 3].map(i => ({ t: 3.3 + i * 0.12, type: "pop", freq: 520 + i * 70, pan: -0.7 + i * 0.45 })),
      ...Array.from({ length: 22 }, (_, i) => ({ t: 4.0 + i * 0.07, type: "tick", freq: 1800 + i * 40, gain: 0.35 })),
      ...[0, 1, 2, 3, 4].map(i => ({ t: 4.6 + i * 0.12, type: "pop", freq: 700 + i * 60, gain: 0.4, pan: 0.2 })),
      { t: 5.0, type: "whoosh", dur: 1.2, from: 600, to: 1800, gain: 0.4, pan: 0.6 },
      ...INSIGHTS.flatMap((s, i) => [{ t: s.t0, type: "chime", freq: ["C5", "E5", "G5"][i], pan: -0.6 + i * 0.6 }, { t: s.t0 + 0.05, type: "pop", freq: 900, gain: 0.4 }]),
      { t: 16.0, type: "arp", notes: ["C4", "E4", "G4", "C5"], step: 0.14 },
    ],
  },
};
