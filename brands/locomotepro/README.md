Vehicle intelligence for Bangladesh. LocomotePro is the transport-management layer of Wahyd's Logistics Operating System (LOS), operated locally by **Wahyd Logistics Bangladesh** (Gulshan Avenue, Dhaka 1212 · bd@wahyd.com · +880 1891-446666 · locomotepro.com.bd). The brand system is called **Waypoint v1.0**. Its signature line: "Every vehicle, on one screen."

Dark is the default theme (`dark`); a full light theme (`light`) re-tunes every accent for contrast. Build on `ink` first.

## The brand

- **Mission:** give every vehicle owner and operator in Bangladesh honest, live visibility of their vehicles: not just a dot on a map, but how each one is actually driven.
- **Positioning:** not a plain GPS tracker. LocomotePro replays the route, scores the drive and flags what needs attention, with a local team, a Bangla-first app and hardware that works on 2G and 3G.
- **Personality:** Clear, Grounded, Local, Honest. It sounds like a capable local operator, not a Silicon Valley pitch.

### Two editions, one platform

| Edition | Who it is for | Lead colour |
| --- | --- | --- |
| **LocomotePro** (Pro) and **LocomotePro Fleet** | Fleet and transport operators: live tracking, dispatch and loads, fuel, workshop, drivers, analytics, invoicing, one-click BRTA fitness reports. Keeps operators compliant with the **1 August 2026 GPS mandate**. | `blue` |
| **LocomotePro Home** / **LocomotePro Lite** | Private owners and families: 0 to 100 drive score, route replay, geofence alerts, speed and harsh-event detection, family safety mode. ৳9,999/yr for one car, ৳7,999/car for 2 to 10. Bought for safety, not compliance. | `cyan` |
| The platform as a whole | Both editions on one live-tracking engine | the 100° blue to cyan gradient (`--grad`) |

Software: **LocomotePro Fleet** (control room), **LocomotePro Driver** (in-cab app, 0 to 100 score, POD), **LocomotePro TMS** (order book, on Fleet TMS plans).

**LP Series hardware**, named by what each unit senses, one class per vehicle, all BTRC-approved: LP-10 **Core** (4G tracker, the compliance floor), LP-20 **Core S** (Core plus parked-sleep sensor, no battery drain), LP-40 **Fuel**, LP-60 **Vision** (dual dashcam), LP-70 **Vision AI** (driver fatigue and distraction), LP-80 **Cold**, LP-85 **Cold Site**, LP-A accessories.

URLs: locomotepro.com (global); **locomotepro.com/bd** for Bangladesh-specific material. Social media leads with **LP Core / LP Core S** and the private-owner story: family safety and the LocomotePro Home app.

## Content fundamentals

**Voice.** Direct, second person ("your fleet", "your family car"), confident, benefit-led. The vendor speaks as "we". When in doubt, cut words and add a number.

Six voice rules:
1. **Plain and direct.** Short sentences, active voice, present tense. "Track every vehicle live," not "Vehicles can be tracked in real time by users."
2. **Specific over vague.** Real figures and places: a 0 to 100 drive score, slots in 24 hours, Dhaka and Chattogram.
3. **Show, do not boast.** Skip "revolutionary", "world-class" and "seamless".
4. **Local and bilingual.** Bangla-first. Write English that translates cleanly, and keep both versions saying the same thing.
5. **Honest about operations.** Say "we aim to" and "typically". Never "guaranteed". ROI copy is "a projection, not a guarantee". Prices "exclude VAT".
6. **No em dashes, ever.** Use commas, colons or parentheses. This keeps EN and BN rendering clean.

| Sounds like us | Not us |
| --- | --- |
| "Every vehicle in Bangladesh, on one screen." | "The world's most advanced, seamless tracking ecosystem." |
| "Know exactly how your car is driven." | "Revolutionise your mobility journey today!" |
| "We aim to confirm slots within 24 hours." | "Guaranteed installation in 24 hours, no exceptions." |
| "Ready for the 1 August 2026 GPS mandate." | Copy stitched together with em dashes. Emoji. English-only posts. |

**Casing.** Sentence case everywhere, including headings and buttons. The only uppercase is the Space Mono micro-label (`kicker`, `label`): `LIVE FLEET MAP · BANGLADESH`, `POWERED BY WAHYD LOS`, `STEP 01`. The middle dot `·` is the standard separator.

**Headlines** end with an accent phrase: wrap it in `Em` (cyan) or the gradient. "Every vehicle in Bangladesh, on *one screen*."

**Bilingual by design.** Every customer-facing string ships in English and Bangla, saying the same thing. Bangla sets in Hind Siliguri (`bn-heading`, `bn-body`); prices use ৳ and Bengali numerals (০১২৩৪৫৬৭৮৯) where they read naturally. A native speaker reviews Bangla before launch.

**Local grounding.** Real places (Dhaka, Chattogram, Gulshan, Kemal Ataturk Ave), BDT prices (৳, comma-grouped), BRTA and BTRC regulation, "Made for Bangladesh".

**Urgency through facts.** Repeat the mandate date in full, "1 August 2026"; count down in days; "Slots are limited, first-come first-served".

**Honesty markers.** Demo UI carries a "*Sample data" tag. Pricing states VAT and refund terms plainly.

**Emoji: never.** The only symbols are `·` separators, `৳`, `↗` for external links and ✓ inside badges ("✓ Device included").

**Terminology.**
- **LocomotePro**: one word, capital P. Never "Locomote Pro" or "Locomotepro" in copy.
- **LocomotePro Lite / Home**: the personal edition. Never "Lite" alone at first mention.
- **Wahyd**: the parent. "Wahyd Logistics" and "Logistics Operating System (LOS)".
- **GPS mandate**: always with the full date, "1 August 2026".
- **BRTA**: always uppercase.

**Social posts.** Hook in the first line; EN and BN caption together; one CTA at the end; a tight hashtag set last (#LocomotePro #GPSBangladesh ...). Colour carries the theme: `cyan` for platform and Lite, `amber` for mandate and cost, `green` for value and offers.

## Visual foundations

**Colour ("Waypoint" palette).** A deep navy base (`ink` #05091A, `surface` #0B1330, `surface-2` #111B3D) lets Electric Blue (`blue` #3B6FF5) and Cyan (`cyan` #2DD4E0) carry the brand.
- `blue` leads Pro / Fleet. `cyan` leads Lite / Home, links, kickers and focus rings. The 100° gradient blends them for "one platform".
- Status colours come from live tracking: `green` moving and value, `amber` idle, caution, added cost and the mandate, `red` stopped and alerts, `slate` / `stopped` for parked vehicles. Always pair a status colour with a word or a dot label.
- `bd-green` and `bd-red` are national cues only (the CSS-drawn flag). Use sparingly.
- Text: `text` on any surface; secondary copy in `muted` at .88 to .94rem. In dark, `blue` as small text passes only on `ink`; on cards use it for fills, borders or text 24px+.
- Light theme: `amber`, `slate` and `stopped` fall under 4.5:1 as small text; use them for fills, dots, bold labels or large text. These are the source values, kept exact.

**Gradients** (not colour tokens; declared in `components/bundle.css`, same in both themes):
- `--grad`: `linear-gradient(100deg, #3B6FF5 0%, #2DD4E0 100%)`. The brand gradient: hero accents, platform marks, "Most popular" badge.
- `--grad-btn`: `linear-gradient(100deg, #4C86FF 0%, #34DDEA 100%)`. Primary CTA fill. Text on it is always `cta-text` #031024.
- `--grad-cyan`: `linear-gradient(100deg, #25C6D8 0%, #5BE8F0 100%)`. Home / Lite CTA fill, with `cta-cyan-text` #031f22.
- `--bg-glow`: two fixed radial glows on the page, cyan `rgba(45,212,224,.10)` top right and blue `rgba(59,111,245,.12)` top left.
- Panels: `linear-gradient(180deg, surface, surface-deep)`; quiet washes `linear-gradient(180deg, panel-a, panel-b)`; hero and CTA bands add a radial blue glow `rgba(59,111,245,.16)` at the top. Covers may use a 32px `line-soft` grid texture.
- Gradient text is for one accent phrase per headline only.

**Type.** Three roles, one job each.
- Display: **Poppins** 600 to 800 (`h1`, `h2`, `h3`, `stat`), letter-spacing -.02em, line-height 1.12. `h1` is fluid `clamp(2.4rem, 5vw, 3.8rem)`; `h2` `clamp(1.9rem, 3.4vw, 2.6rem)`.
- Body: **Inter** 400 to 600 (`lede`, `body`, `small`, `fine`), line-height 1.6. Body copy is small and muted.
- Labels and data: **Space Mono**, uppercase, letter-spaced .1 to .16em (`kicker`, `label`, `data`). Kickers, telemetry, tags and prices. Never long paragraphs in mono or display faces.
- Bangla: **Hind Siliguri** (`bn-heading`, `bn-body`).
- The Fleet mobile app uses **DM Sans** for UI text and **Roboto Mono** for timestamps (`app-ui`, `app-mono`).
All faces load from Google Fonts.

**Corners.** Never sharp. `radius-pill` 100px (pills), `radius-btn` 10px, `radius-input` 12px, `radius-card` 14px, `radius-panel` 18px (consoles, Card), `radius-band` 22px (hero bands).

**Borders.** 1px `line` or `line-soft` everywhere. Emphasised cards use accent-tinted borders at .22 to .35 alpha, for example `rgba(45,212,224,.28)`. The amber mandate strip is the one left-border-accent exception.

**Shadows.** One deep soft `shadow` on major panels; `shadow-btn` and `shadow-btn-hover` cyan glows under gradient CTAs. Light theme uses a layered soft grey `shadow`.

**Transparency and blur.** Sticky nav and map legends use `backdrop-filter: blur` over `scrim` / `scrim-soft`.

**Cards.** Bordered, gradient-washed, 24 to 28px padding; icon chips are 40px, radius 10, cyan-tinted fill with a 1px cyan border. Featured items get a 3px gradient top edge.

**Buttons.** Primary is the blue to cyan gradient with near-black text; `cyan` variant for Home / Lite; ghost is transparent with a 1px `line` border.

**States.** Cards lift `translateY(-4px)` and brighten their border on hover; buttons lift -2px with a bigger glow; ghost buttons swap border and text to `cyan`; links go `muted` to `text` or `cyan`. Focus rings are `cyan` (Input uses a 1px `cyan` border plus a 3px `rgba(45,212,224,.14)` halo; bundle.css adds a 2px `cyan` outline for keyboard focus).

**Motion, with a reason.** Movement signals that something is live, never decoration. Reveal: fade and 22px rise, .7s ease (`--ease-reveal`), with a fallback that shows everything if the observer never fires. Pulse: live blips on vehicles and status dots. Sweep: a slow radar rotation on hero visuals. GPS reticle cursor. Gauges start full and animate to the true value, never flashing zero. Hover transitions .18s (`--ease-hover`), panels .25s. Everything respects `prefers-reduced-motion`.

**Data visualisation.** Maps and telemetry use mono labels, status colours (green moving, amber idle, slate stopped), dashed geofence circles and glowing active routes. The Bangladesh outline (`assets/Graphics/bd-map-path.txt`) fills with `map-land` and strokes with `map-edge`.

## Logo

The LocomotePro monogram pairs a blue L and cyan P with a location pin and speed lines (`assets/Logos/logo.png`).
- In Bangladesh, **always pair the icon with the wordmark**; the bare mark alone is not yet recognised.
- The wordmark is "Locomote" in `text` plus "Pro" in `cyan`, set in Poppins 700. Never restyle the casing.
- Clear space around the mark equals the icon height. Minimum icon height: 24px on screen, 10mm in print.
- Lockups: on dark, place on `surface` or `ink`; on light, place on #EEF3FB with the wordmark in #05091A and "Pro" in #0A7A88.
- Do not recolour the mark or wordmark. Do not stretch, rotate or add effects. Do not place it on busy or low-contrast backgrounds. Do not separate icon from name in new contexts.
- `mark.svg` is the favicon (pin in a rounded `ink` square), for browser tabs and app icons only.

## Iconography

- Inline stroke SVGs only: 24×24 viewBox, `fill: none`, stroke `currentColor`, stroke-width 1.6 to 2.4 (about 1.8 by default), round caps and joins. A Feather / Lucide-like line style; no icon font, no PNG icons.
- For new icons use **Lucide** as the nearest match, stroke-width about 1.8.
- Status dots and pills are pure CSS. The Bangladesh flag is CSS (green rect, red disc). The WhatsApp glyph is a filled path.
- The Fleet mobile app has its own eight bold/outline icons (the `Icon` component and its single-icon components).
- No emoji, anywhere.

## Components

Website components (reverse-engineered from the production homepage): `Button`, `Pill`, `EditionTag`, `Input`, `SegmentedControl`, `Card`, `SectionHead`, `Em`, `FeatureCard`, `StatTile`, `StatRow`, `PlanCard`, `EventFeed`, `Accordion`, `DriveScore`. They follow the dark / light theme.

Fleet mobile app components (from the "Locomote Basic" design file, light only, `app-*` tokens): `ButtonLight`, `InputFieldLight`, `VerificationLightInput`, `Toggle`, `HeaderBarLight`, `StatusBar`, `HomeIndicator`, `Icon`, `BoldHappyemoji`, `BoldMail`, `LinearChevronLeft`, `OutlineEyeSlash`, `OutlineInfoCircle`. Do not mix the two families on one surface.

All components load from `components/bundle.js` as `window.LocomotePro.<Name>` (React 18).

## Templates in the source project

These finished layouts exist in the original LocomotePro design project. They are not part of this system's files; ask Claude to recreate one with this system when you need it.

| Template | What it is |
| --- | --- |
| Social posts | 1080×1080 GPS-mandate and product posts, with an EN/BN captions workbook |
| Social posts: content | Feature posts (history and reports, alerts, pricing, installation, support) |
| Social posts: fleet | Fleet-operator posts (analytics, maintenance, geofencing, ROI, onboarding) |
| Mandate campaign | 15-post countdown campaign for the 1 August 2026 GPS mandate, with captions workbook |
| LinkedIn posts | LinkedIn feed posts with captions |
| Commercial proposal | Multi-page customer proposal: LP Series specs, rate card, programmes, terms |
| Board deck | Board-briefing slide deck |
| Pilot pitch deck | Phase 0 corridor pilot proposal deck |
| Roadside brief | Leadership brief, deck and print versions |
| Visibility document | Long-form visibility proposal document |

Social sizes from the Social Media Kit: 1080×1080 feed, 1080×1920 story, 1500×500 banner.
