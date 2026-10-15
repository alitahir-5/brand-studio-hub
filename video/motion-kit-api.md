# Motion Kit API (global `MK`)

All helpers draw on a 2D canvas context. Everything must be a pure function of time `t` (seconds). Precompute deterministic data once at the top level with `MK.rng(seed)`, `MK.series`, `MK.hash`, never `Math.random()` or `Date`.

## Colour
- `MK.C`: `blue #114fa0` (primary accent), `blueBright #2e70cd` (text/lines on dark), `ink #0a0e18` (text on light), `light #f7fafe` (light bg), `dark #070b14` (dark bg), `white`, `black`, `red #e62832` (alerts only, only when allowed).
- `MK.mix(a, b, t)`: mix two colours (e.g. `MK.mix(MK.C.white, MK.C.blue, 0.12)` soft chip fill). `MK.alpha(color, a)`: rgba string.

## Timing
- `MK.clamp(x, a=0, b=1)`, `MK.lerp(a, b, t)`, `MK.easeOutCubic(p)`, `MK.easeInOutCubic(p)`, `MK.easeInCubic(p)`, `MK.smoothstep(e0, e1, x)`.
- `MK.prog(t, start, dur, ease=easeOutCubic)`: eased 0..1 progress of an event.
- `MK.enter(t, start, {dur=0.6, dist=20})` -> `{a, dy, p}`: standard fade + slide entrance. Use `a` as alpha and add `dy` to y.
- `MK.exit(t, start, dur=0.4)`: 1 then fades to 0.
- `MK.flash(t, hz=3, phase=0)` -> boolean (on for first half of each cycle). `MK.pulse(t, hz=1, phase=0)` -> smooth 0..1.

## Deterministic data
- `MK.rng(seed)` -> function returning 0..1. `MK.hash(i, seed)` -> 0..1. `MK.noise(x, seed)` -> smooth 0..1. `MK.pick(arr, i, seed)`.
- `MK.series(seed, n, base, amp, {trend, step})` -> array. `MK.live(seed, t, base, amp, rate=0.6)` -> smoothly varying live value.
- `MK.num(v, {decimals, prefix, suffix})` -> formatted string with thousands separators.

## Text
- `MK.text(ctx, str, x, y, {size=24, weight=400, mono=false, color=ink, align='left'|'center'|'right', baseline, alpha=1, maxWidth, letterSpacing})`. Mono is the "raw data" signal. Arabic text automatically renders right to left.
- `MK.measure(ctx, str, opts)` -> width. `MK.wrap(ctx, str, maxWidth, opts)` -> lines[].
- Fonts: UI = Arimo (Liberation Sans metrics), mono = Cousine (Liberation Mono metrics), with Noto Sans Arabic and Noto Sans Bengali fallbacks loaded.

## Shapes
- `MK.rr(ctx, x, y, w, h, r)`: rounded-rect path (then fill/stroke yourself).
- `MK.line(ctx, x1, y1, x2, y2, {color, width=2, dash:[a,b], dashOffset, alpha, cap})`.
- `MK.path(ctx, points[[x,y],...], {progress=1, color, width=3, dash, alpha, glow})`: draws the first `progress` of a polyline (for "drawing on" lines and connectors).
- `MK.along(points, p)` -> [x, y] at fraction p along a polyline (move packets/tokens along paths).
- `MK.circle(ctx, x, y, r, {fill, stroke, width, dash, alpha, glow})`.
- `MK.glow(ctx, color, blur, () => { ...draw... })`: soft glow (use on dark theme).

## UI building blocks (playbook 2.2)
- `MK.card(ctx, x, y, w, h, {theme='light'|'dark', r=18, alpha, fill, border, highlight})`: white rounded card, 1.5 px border at 16% blue, 3-layer soft shadow (light) or deep panel with bright-blue hairline (dark).
- `MK.chip(ctx, x, yCenter, label, {size=20, bad, alert, solid, theme, alpha, align='left'|'center'|'right'})` -> `{w, h, x}`. Soft blue pill with bold blue text; `bad` = black fill white text; `solid` = blue fill white text; `alert` = red (only if red allowed).
- `MK.badge(ctx, x, y, n, {r=18, alpha, scale, theme})`: blue circle with white number linking an insight to a chart element.
- `MK.liveDot(ctx, x, y, t, {color, hz})`: live indicator with pulsing ring.
- `MK.pulseOutline(ctx, x, y, w, h, t, {alpha, r, color})`: pulsing highlight around an element.
- `MK.background(ctx, t, {theme, w, h, bg, nodes, seed, scan=true, scanDir='horizontal'|'vertical', scanPeriod=9, alpha})`: fills the frame with the AI-ish background (dot grid every 60 px, drifting node network, slow scan band). Call it first in every frame.

## Charts
- `MK.lineChart(ctx, x, y, w, h, values, {progress, color, width, dashed, fill, min, max, glow, dots, alpha})` -> points.
- `MK.bars(ctx, x, y, w, h, values, {progress: number | (i)=>number, color, colors, highlight: index, highlightColor, gap, labels, labelSize, max, radius, alpha})` -> rects[{x,y,w,h}].
- `MK.donut(ctx, cx, cy, r, parts, {progress, thickness, colors, gap, alpha})`.
- `MK.ring(ctx, cx, cy, r, value0to1, {progress, thickness, color, label, labelSize, theme, alpha})`.

## Images and camera
- `MK.imageCover(ctx, img, x, y, w, h, {zoom, panX, panY, alpha})`. When the user supplies a base frame it is available as `FRAME` (an HTMLImageElement, or null).
- `MK.camera(ctx, {zoom, cx, cy}, () => { ...draw scene in scene coordinates... })`: virtual camera (keep zoom at or below 1.42 on raster images).

## Sound (synthesized, optional)
`video.sound = { cues: [...], pad: [freqs], padGain: 0.05 }` or `null` for silence. Cue fields: `t` (seconds), `type`, optional `freq` (Hz or note name like "C5"), `gain` (0..1, default 0.6), `pan` (-1..1, pan by x position: `x / W * 2 - 1`), `dur`, `from`, `to`, `notes`, `step`.
Types: `pop` (soft rising pop, freq), `whoosh` (filtered noise, dur, from/to Hz), `thump` (low hit), `chime` (note, long decay), `tick` (counter tick), `blip` (tiny high blip), `click` (faint click), `sweep` (sine glide from/to over dur), `arp` (notes array, step seconds). The mix gets a light echo and is normalised to 0.85 peak. Keep it quiet and non-musical.

## The contract
```js
// top level: constants, deterministic data, layout, helper functions
const video = {
  width: 1920, height: 1080,      // or 1080 x 1920 for 9:16
  duration: 15,                   // seconds
  theme: "light",                 // "light" | "dark"
  title: "Short internal name",
  render(ctx, t) {                // draw the COMPLETE frame at time t
    MK.background(ctx, t, { theme: "light" });
    // ...
  },
  sound: null,                    // or { cues: [...], pad: [...] }
};
```
Do not use DOM APIs, timers, fetch, `Math.random`, `Date`, or `requestAnimationFrame`. Do not keep state between frames (precompute any simulation for all t up front, e.g. arrays sampled at 30 fps, and index them by time).
