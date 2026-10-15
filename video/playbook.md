# Logistics Motion-Graphics Playbook

A reference for recreating (or remixing) the logistics videos built in this project: what each video is, the exact design system and timeline behind it, how it was rendered, how the sound was made, how the Arabic/Bangla versions were produced, and copy-paste prompts for asking for new ones.

---

## 1. What was built

| # | File | Format | Length | Theme | Sound | One-line description |
|---|------|--------|--------|-------|-------|----------------------|
| 1 | `logistics_data_streams.mp4` | 1080×1920 (9:16) | 15 s | Dark | No | Flowchart of logistics stages emitting streams of raw data into a log feed |
| 2 | `logistics_data_streams_16x9.mp4` | 1920×1080 | 15 s | Dark | Yes | Same idea re-laid out for landscape, with synthesized sound effects |
| 3 | `logistics_dashboard_insights_16x9.mp4` | 1920×1080 | 19 s | Light | Yes | Raw records are "refined" by a scan beam into a KPI dashboard with actionable insights |
| 4 | `logistics_live_analytics_16x9.mp4` | 1920×1080 | 20 s | Light | No | Real-time UI analyzing shipments, costs, routes, vendors and performance |
| 5 | `logistics_ai_pattern_discovery_1920x1080.mp4` | 1920×1080 | 24 s | Light | No | Your dashboard frame + AI/ML overlays that find patterns and opportunities |
| 6 | `logistics_truck_wipe_transition_16x9.mp4` | 1920×1080 | 12 s | Dark → Light | No | Container truck driving through a digital wipe: congested raw data → clear flow |
| 7 | `*_arabic.mp4`, `*_bangla.mp4` | same as source | same | same | same as source | Language-only conversions of videos 2, 3, 4 (Arabic + Bangla) and 5 (Arabic) |

**Constraints that applied to every video** (unless the request overrode them):
- No logos, no brand names, no headings or titles. Small functional labels (card captions, units, chips) are fine.
- Palette: **white, black, blue `#114fa0`**. Red was allowed only in video 6 (warnings).
- "AI-ish, minimal" background: a faint dot grid plus a slowly drifting network of nodes and lines.
- Delivered as MP4 (H.264, yuv420p, 30 fps).
- All figures, names and insights are **placeholders**. Swap in real numbers before public use.

---

## 2. Shared design system

### 2.1 Colors
| Token | RGB / hex | Use |
|-------|-----------|-----|
| Blue | `(17,79,160)` `#114fa0` | Primary accent everywhere |
| Blue (bright, dark theme only) | `(46,112,205)` | Text/lines on near-black backgrounds (the base blue is too dim there) |
| Ink | `(10,14,24)` | Text on light theme |
| Light bg | `(247,250,254)` or white | Light theme |
| Dark bg | `(7,11,20)` or black | Dark theme |
| Alert red | `(230,40,50)` | Video 6 only: warnings, congestion |

Tints are produced by mixing toward white or black (e.g. `mix(white, blue, 0.12)` for a soft chip fill). Never introduce unrelated hues.

### 2.2 Recurring UI building blocks
- **Cards:** white rounded rectangles (radius ~18), 1.5 px border at ~16% blue, a 3-layer stacked soft shadow.
- **Chips:** pill shapes, soft blue fill (~12%) with blue bold text; "bad" chips use black fill/white text.
- **Badges:** blue circle with a white number (used to link an insight to a chart element).
- **Glow:** draw bright shapes on a separate layer, blur at ¼ resolution, add back (dark theme). On light theme use soft stacked shadows instead.
- **Background (AI touch):** dot grid every 60 px; ~40–70 drifting nodes joined by faint lines (<280 px apart); slow horizontal/vertical scan band with ~7–16% blue tint.
- **Typography:** Liberation Sans (UI), DejaVu Sans Mono / Liberation Mono (raw data and node labels). Mono is the "raw data" signal.

### 2.3 Motion principles
- Everything is a **pure function of time** `render(t)`. No state carried between frames (the only exception is vendor re-ranking, which is pre-simulated).
- Entrances: fade + slide 16–26 px, `ease-out-cubic`, 0.5–0.8 s, staggered 0.2–0.45 s.
- Sweeps/camera: `smoothstep`.
- Live data: fixed-rate samples (e.g. 8/s) interpolated, so charts scroll smoothly.
- Flashing (video 6): hard on/off at ~3 Hz (on for the first half of each cycle) with phase offsets per element.

---

## 3. Video recipes

### 3.1 Data-streams flowchart (videos 1 and 2)

**Brief:** flowchart animation of a logistics operation creating streams of raw operational data; white/black/#114fa0; no logos/headings; AI-ish minimal background.

**Structure**
- Six stages: ORDER → WAREHOUSE → LOADING → TRANSIT → CUSTOMS (diamond/decision) → DELIVERY.
- Each stage has a **branch** carrying small data packets to an **intake line**, below which a two-column raw-record log scrolls (timestamp in white, record in blue).
- A white **token pulse** travels the main flow; each node it reaches flashes ("hot" outline) and sends an expanding ring plus a burst of 4–6 packets.
- Each branch shows a live-updating readout (order ID, SKU, pallet weight, GPS, HS code, POD) refreshed every 0.35 s.

**Layout: 16:9 (1920×1080)**
- Node row at y = 220, centers x = 210 + 300·i. Rect nodes 220×100, diamond 270×150.
- Branches drop vertically from each node to the intake line at y = 720.
- Log columns at x = 90 and x = 1000, y from 760 to 1060, 36 px row pitch, scroll 80 px/s, fading toward the bottom.
- Packets: 300 ±35 px/s, trail of 6 squares (9 px apart), white or light blue head, glow dot.

**Layout: 9:16 (1080×1920)**
- Main flow is a vertical column at x = 290 (node centers y = 230, 420, 610, 800, 1010, 1230).
- Branches go right to a data bus at x = 830, which runs down to an intake line at y = 1380; log below.

**Timeline (both)**
| Time | Event |
|------|-------|
| 0.3 + 0.45·i s | Node i fades in |
| 0.6 + 0.45·i s | Connector i draws |
| 0.9 + 0.45·i s | Branch i draws (0.5 s) |
| 1.6 + 0.45·i s | Packets start; spawn interval eases from ~1 s to ~0.3–0.4 s |
| 2.2–2.4 s | Intake line and log fade in |
| 2.6, 5.2, 7.8, 10.4, 13.0 s | Token pulses (0.55 s dwell per node, 170 px/s between nodes) |
| 15 s | End |

**Sound (video 2)**: synthesized with NumPy at 44.1 kHz stereo, panned by x-position, light echo "reverb", peak-normalized to 0.85.
- Node appear: soft pop rising in pitch (≈520→900 Hz, +70 Hz per node).
- Connectors/branches: quiet filtered-noise whooshes.
- Token travel: whoosh; arrival: low thump (≈48–120 Hz) + chime on a different note per node (C4, E4, G4, A4, C5, E5).
- Packet arrival: tiny pentatonic blips (880–1976 Hz); packet spawn: faint clicks (35% of packets).
- Ambient pad: 55 / 82.4 / 110 Hz sines, 2 s fade-in, fade-out at the end.

---

### 3.2 Raw data → dashboard with insights (video 3)

**Brief:** turn the raw data into a dashboard with actionable insight; 16:9; light background.

**Story (19 s)**
| Time | Event |
|------|-------|
| 0–3 s | Five columns of raw records scroll (mono text; a few lines flagged black on a pale highlight) over the AI background |
| 3.0–5.6 s | A vertical **blue scan beam** sweeps left → right (smoothstep). Left of the beam is the dashboard, right is raw data; a soft blue tint trails the beam |
| ~4–8 s | KPI numbers count up, line chart draws on, bars grow (staggered 0.12 s), donut sweeps |
| 8.4 / 11.0 / 13.6 s | Insight cards 1–3 slide in. Each highlights its target (badge + pulsing outline) |
| 16.0 s | KPI cards swap sparklines for **projected values** ("with actions") |
| 19 s | End |

**Layout (1920×1080)**
- KPI row: four cards, y 70–230, x = 80 + 447·i, width 417 (label, 60 px value, chip, sparkline).
- Middle row, y 260–700: transit-time line chart (x 80–1000, actual vs dashed target, highlight band), dwell-time bars by stage (x 1030–1470, customs bar emphasized), delay-causes donut (x 1500–1838).
- Bottom row, y 735–1010: three insight cards (badge, statement, divider, "recommended action", impact chip).

**Insight pattern** (reusable): *observation* → *recommended action* → *quantified impact chip*. Each insight is tied visually to one chart element with a matching numbered badge. Placeholders used: customs clearance +1.9 days over target (pre-file 24 h earlier, −24 h); dock congestion Tue–Thu 14:00–18:00 (stagger dispatch, +4% on-time); Route B costs 18% more per pallet (consolidate, −$3.10 per shipment).

**Sound:** data ticks while raw; beam whoosh + rising sweep (180→900 Hz); pop per card; 22 rising ticks per KPI count-up; quiet glide while the line draws; a pop per bar; donut whoosh; chime + badge pop per insight (C5, E5, G5); four-note rising arpeggio (C4–E4–G4–C5) when projections appear; bright pad 65.4 / 98 / 164.8 Hz.

---

### 3.3 Live analytics UI (video 4)

**Brief:** UI animation analyzing shipments, costs, routes, vendors, performance in real time; light background with a slight AI touch; no logos/headings; no sound; 16:9.

**Six panels** (all fade/slide in, staggered 0.2 → 1.45 s):
| Panel | Position (x0,y0,x1,y1) | Behavior |
|-------|------------------------|----------|
| Shipments | 60,80,620,560 | New rows enter every 0.85 s and push others down; status chips (In transit / Customs / Delayed / Delivered) change with age; progress bars; 4 live counters |
| Routes | 650,80,1370,560 | 14-node network, 12 vehicles random-walking along edges (load thickens edges), hub pulses, scan line, **route optimization cycles** at t = 4.0, 9.5, 14.8 s |
| Costs | 1400,80,1860,560 | Big ticking value, 12-second scrolling area chart (8 samples/s, smoothed), animated stacked cost-breakdown bar |
| Vendors | 60,590,620,1020 | Five vendors ranked by a fluctuating score; rows glide to new rank (pre-simulated low-pass); trend arrows |
| Performance | 650,590,1370,1020 | Three ring gauges (on-time, utilization, accuracy) + scrolling deliveries-per-hour histogram (new bar every 0.6 s, anomaly bars black) |
| Live insights | 1400,590,1860,1020 | AI messages appear every ~2.5–3 s with tags (ETA / ROUTE / VENDOR / CUSTOMS / COST); a "thinking" 3-dot indicator |

A status strip sits above the cards (live dot, ticking clock, "records analyzed" counter).

**Route optimization cycle** (the signature AI moment, 6.4 s): three dashed gray candidate paths appear one after another (a pulse scans each) → the winner draws solid and thick with a glow and a result chip ("−14% cost") → everything fades. A congested edge (black dashed + "+40 min" chip) is shown on a rejected path before each cycle.

**Global AI touch:** two soft vertical scan sweeps across the whole UI (5.0–8.6 s and 12.0–15.6 s).

**Data rules (so it looks real):** deterministic seeded noise only; same time → same frame. Placeholder baselines: cost ≈ $46 trending down; on-time ≈ 94%; utilization ≈ 78%; accuracy ≈ 97%.

---

### 3.4 AI / ML pattern discovery over a supplied frame (video 5)

**Brief:** use the uploaded dashboard screenshot as the base; animate it and integrate AI/ML to uncover patterns and opportunities; 1920×1080.

**Technique**
- The still is the **base layer** (upscaled 2× with Lanczos). All overlays are drawn at 2× in the same coordinate space as the dashboard, so they stay locked to the right elements, then a **virtual camera** crops/zooms (never beyond 1.42×, to limit softness).
- The scene is padded with 240 px of white so the camera can frame cards near the edges.
- Overlay positions come from the dashboard engine's own geometry (node positions, chart curve, bar tops), not eyeballing.
- Spotlight = a translucent white wash on everything except the focused card (outline in blue), with callout cards floating over the washed area.
- A **pipeline bar** (screen-space, bottom center) shows: Ingest → Learn → Detect → Predict → Optimize.

**Timeline (24 s)**
| Time | Beat | What the AI "finds" |
|------|------|---------------------|
| 0–2.8 s | Ingest | Blue scan beam reveals the dashboard over the network background |
| 3.0–4.5 s | Learn | A neural-style graph links the six panels, pulses traveling on the edges |
| 4.0–9.2 s | Detect (routes) | Three **clusters** (dashed ellipses + chips: high volume, delay-prone, cost-efficient); a **recurring delay pattern** on one lane with confidence; the chosen route gets flowing pulses and an "Opportunity" chip |
| 9.0–12.6 s | Detect (costs) | Fitted **trend line + confidence band**, an **anomaly** ring (cost spike vs trend), a "savings window", and a **24 h forecast** card with history, dashed forecast and band |
| 12.7–16.3 s | Predict (vendors) | A **delay-risk %** pill on every vendor; the riskiest row is outlined and explained, then an opportunity card (shift 18% of volume, −$3.10 per shipment) |
| 16.1–19.5 s | Predict (performance) | A smoothed **seasonality curve** over the histogram with peak markers and "peak every N h"; a 6-hour demand forecast card (history bars vs dashed forecast bars with whiskers) |
| 19.6–24 s | Optimize | Dashboard dims; three opportunity cards (−14% route cost, −$3.10 per shipment, +4% on-time) each with a filling confidence meter; a combined-impact pill |

**Camera keyframes (zoom, center):** full view → 1.30× on routes → 1.42× on costs → 1.38× on vendors → 1.32× on performance → full view. Interpolated with smoothstep; clamped inside the padded scene.

**Repair note:** the supplied frame caught the vendor list mid-reorder (two rows overlapping). The list was repainted cleanly (same style, final order) before overlays were added. If you supply a frame, say whether you want such artifacts preserved or fixed.

---

### 3.5 Truck wipe transition (video 6)

**Brief:** transition-wipe animation with raw data shown before and after; a container truck moving on the road throughout; no branding/headings; 16:9; raw data may show traffic congestion and flashing red warnings.

**Concept:** same scene rendered twice with two states, joined by a digital wipe, with the **truck continuous** across the cut.
- **Before (0–5.2 s, dark):** crawling, stop-and-go traffic; five near-lane + four far-lane vehicles queued ahead, brake lights blinking; red detection boxes with speed tags; flashing red warning triangles; red readouts (avg speed ≈ 5 km/h, occupancy ≈ 93%, delay +36 min); heat strip with blue free-flow segments turning red in the jam zone; low red histogram bars; raw log lines with WARN rows flashing red; flashing red screen border.
- **Wipe (5.2–7.0 s):** a slanted edge (slope 0.20) sweeping left → right, built from 48 px row blocks with ±75 px jitter that re-rolls at 14 Hz (digital stair-step). Behind the edge: tri-color stripe (blue 46 px, white 14 px, black 10 px), a thin white leading line, a faint glow ahead, and ~46 flying square "data pixels".
- **After (7.0–12 s, light):** truck at highway speed; no queue, a few cars passing in the far lane; blue steady beacons on sensor poles; blue histogram; readouts avg speed ≈ 82 km/h, occupancy ≈ 21%, delay 0 min; log lines all STATUS CLEAR.

**Truck (side view, facing right):** blue ribbed container 550×190 with a white stripe and corner castings; white cab with windshield; black chassis; five wheels (r = 34) that spin in proportion to distance traveled; subtle body bob. No text or logos on the vehicle.

**Motion:** the road, lane dashes and sensor poles scroll from one shared offset (the integral of speed), so they align across the wipe. Speed profile: stop-and-go crawl (25–130 px/s) until 5.0 s, then smoothstep to ~540 px/s by 7.6 s. Both scene versions use the same offset and truck position.

---

## 4. How the videos were rendered

**Toolchain:** Python 3 + Pillow (drawing, with Raqm for text shaping) + NumPy + FFmpeg (libx264). No video editor and no browser.

**Pipeline**
1. Write `render(frame_index)` returning an RGB array. Draw at **2× resolution** and `reduce(2)` for clean anti-aliasing (vector shapes, text, thin lines).
2. Pre-render static sprites (nodes, lines, HUD) at 2× and Lanczos-downscale; composite with alpha per frame.
3. Pipe raw frames straight to FFmpeg:
   `ffmpeg -f rawvideo -pix_fmt rgb24 -s 1920x1080 -r 30 -i - -c:v libx264 -pix_fmt yuv420p -crf 16 -preset medium -movflags +faststart out.mp4` (add `-an` for silent).
4. Render **3–7 test stills first** (an early, middle and late frame) and inspect them before the full render.
5. For sound: synthesize a stereo WAV with NumPy, then mux without re-encoding the video: `ffmpeg -i video.mp4 -i sfx.wav -c:v copy -c:a aac -b:a 192k -shortest out.mp4`.

**Performance:** roughly 0.2–0.5 s per frame on one CPU core; a 15–24 s video takes about 2–5 minutes. Render in the foreground. Background processes were terminated between tool calls during this project.

**Reproducibility:** fixed random seeds and per-frame hash noise mean the same script gives the same video. This is what made language swaps exact (see §5).

---

## 5. Making language versions (Arabic / Bangla)

**Rule:** change *only* the words. Same layout, motion, timing, data and audio (the original audio track is copied over untouched).

**Method**
1. Re-run the **same render script** with a text layer that translates strings at draw time, so the random data and layout stay identical. (Check first that the script reproduces a frame of the supplied video; mean pixel difference should be about 1 or less, from compression.)
2. **Keep the layout un-mirrored**: text stays where it was; inside Arabic phrases the reading order is right-to-left.
3. **Fonts:** Noto Sans Arabic and Noto Sans Bengali (downloaded from the Noto GitHub repository). Pillow must have Raqm/HarfBuzz for correct Arabic joining and Bengali conjuncts.
4. **Mixed scripts:** Noto Bengali has no Latin digits or basic punctuation, and Noto Arabic lacks `( ) % + /`. Each string is split into words, then into runs by script; localized runs use the Noto font and numbers/IDs use the original Latin font, all on one baseline.
5. **Arabic ordering:** reverse the run order of each phrase (true RTL), mirror parentheses, keep numbers left-to-right internally. Keep the start position of each block where the English started.
6. **What stays Latin:** IDs and codes (SH-48219, KHI, DXB), numbers (Western digits), currency symbols. Say so up front if you want Eastern Arabic (٠١٢٣) or Bengali (০১২৩) digits instead.
7. **Fit checks:** measure the widest translated strings and shrink the localized font slightly where needed (e.g. dense log columns), shorten sentences that would wrap to a third line, and use short unit forms where the full word collides with another element (e.g. hours in a tight bar chart).
8. If the video contains a **screenshot or still** (video 5), regenerate that still in the target language from the engine that produced it; text inside an image can't be swapped otherwise.

**Terminology used** (adjust freely): Arabic: الطلب (order), المستودع (warehouse), التحميل (loading), النقل (transit), الجمارك (customs), التسليم (delivery). Bangla: অর্ডার, গুদাম, লোডিং, পরিবহন, কাস্টমস, ডেলিভারি.

---

## 6. Prompt templates

Fill in the brackets. Always state the **aspect ratio / resolution, duration, theme, palette, sound yes/no, and the "no" list** (logos, headings, branding).

### 6.1 New concept video
```
Create a [duration]s [16:9 / 9:16] MP4 animation for a logistics video.
Concept: [what happens, in 2–4 beats with rough timings].
Look: [light / dark] background, colors white, black and #114fa0 [+ red for warnings],
a slight AI-style minimal background (dot grid + drifting network).
Do not use logos, branding or headings; small functional labels are fine.
Sound: [none / subtle synthesized sound effects synced to the animation].
Data: [what raw data, charts or insights should appear]. Use placeholder numbers.
```

### 6.2 Animate an existing frame (as in video 5)
```
Use this image as the base. Animate it into a [duration]s 1920×1080 MP4 that shows
[AI/ML finding patterns / forecasting / anomaly detection] on top of it.
Keep it silent, no logos or headings. Zoom into each panel in turn, with callouts
that explain what was found and an opportunity card at the end.
Keep the original text/layout; [fix / keep] any glitches in the frame.
```

### 6.3 Transition / wipe
```
Make a [duration]s 16:9 transition-wipe video: [scene A description] → wipe →
[scene B description]. A [vehicle/object] keeps moving across the wipe.
Wipe style: [digital stair-step / diagonal bars / etc.]. Use [colors]; flashing
[red] indicators are allowed in scene A. No branding or headings.
```

### 6.4 Language version
```
Convert the attached video into [Arabic / Bangla / both]. Change only the language:
same layout, animation, timing, data and sound. Keep IDs and numbers as they are.
[Keep Western digits / use Eastern Arabic digits / use Bengali digits.]
```

### 6.5 Sound
```
Add subtle synthesized sound effects synced to the animation: [pops on appear,
whoosh on sweeps, ticks on counters, chime on insights, a rising resolve at the end].
Keep it quiet and non-musical, with a light ambient pad. Or: no sound at all.
```

---

## 7. Tips for good results

- **Name the beats and their times.** "0–3 s raw data, 3–6 s wipe, then dashboard" produces tighter results than "make it cool".
- **Say "no" explicitly** (logos, headings, sound, mirrored layout); it is respected and carried through language versions.
- **Upload references:** a frame, a previous video, or a screenshot lets the new video match your look exactly. Uploading an MP4 for translation works best because the render script can be matched to it.
- **Ask for stills first** if you want to approve the look before a long render.
- **Placeholders are placeholders.** Replace figures, vendor names and savings claims before publishing.
- **Light vs dark:** dark suits "raw/chaotic data" and warnings; light suits dashboards and insight. A dark → light wipe tells a "problem → solved" story.
- **Soft close-ups:** zooming into a still above ~1.4× looks soft. For hard zooms, ask for a regenerated high-resolution base instead of a screenshot.
- **Vertical (9:16) vs landscape:** keep key content inside the middle ~65% of a 9:16 frame (top and bottom are covered by platform UI).

---

## 8. Known gotchas (and fixes already applied)

| Issue | Fix |
|-------|-----|
| Pillow `rounded_rectangle` errors when height equals twice the radius with some corners disabled | Use a slightly smaller radius |
| Two rows swapping places overlap for a few frames (vendor ranking) | Accept as a natural crossing, or stagger horizontally; repaint if a frame is used as a still |
| Bengali font shows empty boxes for digits and punctuation | Render Latin runs in a Latin font (segment by script) |
| Arabic parentheses and colons next to numbers displayed on the wrong side | Mirror brackets in RTL runs; prefer Arabic commas over colons next to numbers |
| Localized text wider than the original (dense columns, tight bar labels) | Measure all strings; scale the localized font slightly; shorten phrases; use compact units |
| Chart said "-3.2%" while the line trended up | Make narrative and data agree (regenerate the data series or the claim) |
| Wipe cut through the truck looked wrong if the truck differed per scene | Draw the identical truck at the identical position in both scenes |
| Long renders killed when started in the background | Run in the foreground; split into two halves if needed |

---

## 9. Source files (in the working environment)

If you want these scripts packaged for your own use, ask and they can be exported as a zip. They are listed here by role.

| Script | Role |
|--------|------|
| `render.py` / `render169.py` | Data-streams flowchart (9:16 / 16:9) |
| `sfx.py` | Sound for the 16:9 data-streams video |
| `dash.py`, `sfx2.py` | Raw → dashboard video and its sound |
| `live.py` | Live analytics UI video |
| `aiviz.py` | AI/ML pattern-discovery overlay video |
| `wipe.py` | Truck wipe-transition video |
| `make_loc.py`, `make_dash_loc.py`, `render_loc.py`, `dash_loc.py`, `live_loc.py`, `aiviz_loc.py` | Language (Arabic/Bangla) layers generated from the originals |
| `fonts/` | Noto Sans Arabic and Bengali (regular and bold) used for localization |

---

*Generated from the production notes of this project. All data, names and savings figures in the videos are illustrative.*
