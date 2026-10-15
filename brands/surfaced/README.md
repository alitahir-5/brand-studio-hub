Surfaced Social is a content-discovery and social platform from Wahyd Group Inc. (surfacedsocial.com). Positioning: "Your feed, surfaced by people, not algorithms." No hidden ranking, no shadow bans, no engagement traps: transparent curation, human-reviewed moderation, chronological or user-sorted feeds. The Android app is live on Google Play (`com.surfacedsocial`); iOS is "coming soon". Features: follow people, topics and publications; left, center and right news side by side; posts, articles and links; 24-hour Stories; bookmarks; mute, block and filter.

New to this system? Start with the "How to use this design system" section.

## Content fundamentals

- **Name.** Always "Surfaced Social" in full on first mention and in formal copy; "Surfaced" is fine after that and in headlines. Handle: `@surfacedsocial`. Site: surfacedsocial.com. General contact: info@surfacedsocial.com.
- **Voice.** Plain, declarative, principled. Short sentences that make promises: "If a post breaks the rules, its author knows. If it doesn't, it stays up."
- **Person.** "You/your" for the user, "we/us" for Surfaced. Direct address throughout.
- **Casing.** Sentence case everywhere: headlines, buttons, nav, labels. No title case, no all-caps labels. Anton is strong enough without uppercase styling.
- **No emoji.** None, anywhere, in product, social or legal copy.
- **Contrast framing.** The brand's signature pattern: "surfaced by people, not algorithms", "works for you, not against you", "depth over noise". Triads of negations: "No algorithms. No shadow bans. No engagement traps."
- **Honest states.** Never imply iOS is available. Write "App Store, coming soon" or "Available on Google Play. iOS coming soon."
- **Real copy to borrow from:**
  - "Who decides what you see? You? Or the algorithm?"
  - "Your feed. Your choice."
  - "Don't just follow one side of the story. Discover different perspectives."
  - "Built for people who read. Tech. Business. Science. Culture. News. Ideas."
  - "Social media, without the black box."
  - CTAs: "Get it on Google Play", "Try a feed that works for you."
- **Legal pages** keep the same human voice: numbered sections, an "On this page" table of contents, an effective-date meta line, and callout panels that restate promises in bold.

## Visual foundations

### Color
- The brand is two blues plus neutrals. `blue-600` (#0088db) is primary; `cyan-500` (#00ade2) is the accent. Both are sampled from the logo.
- Ground is `white` (`surface-page`). Alternate sections on `cyan-50` (`surface-card`). Use one dark `ink-900` band (`surface-inverse`) per page for the manifesto or final call to action.
- Text: `ink-900` for headings, `ink-700` for body, `ink-500` for muted lines, on white or `cyan-50`.
- Highlight one or two words of a display headline: `blue-600` on white, `cyan-500` on `ink-900`.
- `cyan-500` is never text on white (2.6:1). `blue-600` as text on white is 3.79:1: keep it for display sizes (24px and up); for small blue text use `blue-700`.
- White on `blue-600` (3.79:1) is for large or bold type only. Secondary lines on blue grounds use `cyan-100` at large sizes.
- `success`, `warning` and `danger` exist but are secondary; always pair them with a word.
- Social posts use three grounds only: `ink-900` (dark), `blue-600` (blue) and `white` (light).

### Type
- Display: Anton (Google Fonts), single weight 400, tall and condensed. Styles `display-xl` (clamp 44 to 72px), `display-lg` (clamp 34 to 52px), `display-md` (clamp 26 to 36px), leading `leading-display` 1.05, tracking `tracking-display` 0.01em.
- Everything else: Inter 400, 500, 600, 700 (Google Fonts). `body` is 16px at 1.65 leading; `lede` 19px; `small` 14px; `caption` 13px; `h3` 20px and `h4` 15px in bold.
- Sentence case for every style. No `text-transform: uppercase`.

### Layout and spacing
- Centered container `wrap-max` 1100px with `wrap-pad` 24px sides; sections padded `section-pad` 96px.
- 4-based scale `space-1` to `space-9` (4, 8, 12, 16, 24, 32, 48, 64, 96px).
- Two-column hero and feature grids pair copy with tall phone screenshots. A horizontal scroll rail shows the screen gallery.
- Social posts are 1080 x 1080 with 96px padding: wordmark top-left, headline centered in the middle zone, a footer row with the site or tagline left and `@surfacedsocial` right.

### Surfaces, borders, radii, shadows
- Cards are flat tinted panels (`surface-card`) with `radius-md` (10px) or `radius-lg` (16px), a hairline `border-subtle` or the one soft `shadow-card`.
- Callout panels use a tinted ground with a bold lead-in sentence. Never a coloured left border.
- Radii: `radius-sm` 6px, `radius-md` 10px, `radius-lg` 16px, `radius-pill` for buttons and tags.
- Phone screenshots sit in rounded frames with `shadow-phone`, a soft blue glow.
- No gradients, textures, illustrations, blur or transparency effects on product and web surfaces. Social posts may use one large soft circle of a brand blue at low opacity behind the headline.

### Buttons and states
- Primary call to action: a solid dark pill button with the Google Play glyph and "Get it on Google Play".
- iOS: a ghost button "App Store" with a small "Coming soon" tag. Never a live link.
- Hover: slight darken. Motion: 120 to 200ms ease-out on colour and opacity only.
- Focus: `focus-ring` (`cyan-500`) outline. It is 2.6:1 on white, below the 3:1 floor, so add a 2px offset and prefer it on blue or ink grounds.

### Imagery
- Cool blue, clean, high-contrast. Real app screenshots only, shown in phone frames (`assets/App screenshots`). No stock photography, no faces other than what appears in the app UI.

## Iconography
- There is no icon set. The brand uses two marks: the Google Play glyph (`assets/Icons/google-play.svg`, single ink, draws black as an image; set it inline to colour it) and the unicode tick (&#10003;) in `blue-600` for checklists. The launch posts also use a unicode cross (&#10005;) for "No hidden ranking" style lists.
- Prefer text and unicode marks. If a fuller set is ever needed, a clean geometric line set (for example Lucide) may be added, but flag it as an addition.

## Logo
- Use `assets/Logos/logo.png`: the full lockup, an interlocked S in the two brand blues over a rounded square, with the SURFACED wordmark in cyan.
- Keep it on white or inside a white rounded tile on blue grounds (as on the Facebook cover). Do not recolour, stretch, rotate or add effects.
- `logo.svg` has no fill styles and renders black. Do not use it until a styled SVG is supplied. `logo.jpg` is a flat fallback for tools that refuse PNG.
- In social posts the brand appears as a small Anton "Surfaced" wordmark top-left (`cyan-500` on dark, `blue-600` on light, white on blue) rather than the full lockup.

## Assets
- **Logos:** logo.png (use this), logo.svg (renders black), logo.jpg.
- **Icons:** google-play.svg.
- **App screenshots:** raw device captures (1-login to 5-settings) and framed phone shots (phone-*).
- **App Store:** five iPad 13-inch store screenshots (2064 x 2752).
- **Social posts:** the 11-post launch series, 10 content posts and 5 feature posts, all 1080 x 1080.
- **Covers:** the Facebook page cover at 1640 x 624.
