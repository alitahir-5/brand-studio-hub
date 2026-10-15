# Brand Studio Hub

One web app for the team with four tools:

- **Video Studio**: logistics motion-graphics videos made to the team's playbook (`video/playbook.md`). Pick a recipe (raw data to dashboard, data-streams flowchart, live analytics UI, AI pattern discovery over your own frame, truck wipe transition) or describe a custom concept, set format, length, theme, sound and language (English, Arabic, Bangla), and the AI writes the animation using the Motion Kit, which implements the playbook's design system and synthesized sound. Preview, ask for changes in plain words, and export a frame-accurate 30 fps MP4 with sound (H.264 and AAC in Chrome and Edge). A generation takes 2 to 5 minutes and costs roughly 10 to 30 US cents on Claude Sonnet. A simple branded text-video maker is still available from a link in the studio.
- **Post Designer**: describe a post and the AI designs it in your brand, the way Claude Design does: real layouts built from the brand colours, fonts, logos and screenshots, at exact social sizes (square, portrait, story, LinkedIn, banner, Facebook cover). Get up to 3 versions, ask for changes in plain words, add your own photo, and download a PNG with a matching caption. Designs cost more than text (roughly 5 to 10 US cents each on Claude Sonnet).
- **LocomotePro**: colours, type, rules, an AI brand writer (English and Bangla), logos and graphics to download, the full brand book and design guide.
- **Surfaced Social**: the same for Surfaced, including app screenshots, App Store images, social posts and the Facebook cover.

Nobody on the team needs a Claude account. The AI runs on the server with your key, and the key never reaches the browser.

## Deploy

Full step-by-step instructions are in `DEPLOY.md`. In short: put this folder in a GitHub repository, create a Render Blueprint from it, and paste your keys.

## AI writers

You can set up Claude, Gemini or both. With both, the **AI writer** menu in the app lets each person choose Claude, Gemini or Auto. Auto tries the default first (`DEFAULT_AI`) and switches to the other if it fails, so drafting keeps working if one service is down or out of credit. The app shows which writer produced each draft.

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com. Pay as you go, separate from a Claude Max plan. |
| `GEMINI_API_KEY` | Gemini API key from aistudio.google.com. Has a free tier. |
| `DEFAULT_AI` | `claude` or `gemini`: which one Auto tries first. |
| `CLAUDE_MODEL` | Defaults to `claude-sonnet-5-5`. `claude-haiku-5-5` is much cheaper. |
| `GEMINI_MODEL` | Defaults to `gemini-3.6-flash`. |
| `TEAM_PASSWORD` | The browser asks for it before opening the hub (any username). Recommended. |
| `RATE_LIMIT` | AI requests per person per 10 minutes. Defaults to 40. |

Claude requests cache the brand guide, so repeated requests for the same brand cost less.

## Updating the video playbook

The Video Studio follows `video/playbook.md`. Edit it (new recipes, palette, timing rules, tips) and commit; the next generation uses it. The drawing helpers live in `public/motion/motion-kit.js` and are documented for the AI in `video/motion-kit-api.md`. `public/motion/example-dashboard.js` is the approved reference video the AI learns from; replacing it with a better approved video raises the quality bar.

## Updating brand content

Everything brand-specific lives in `brands/<brand>/`:

- `README.md`: the brand book. The AI writer reads it on every request, so voice rules and facts written here shape all drafts.
- `how-to-use.md`: the design guide.
- `tokens.json`: exact colour, type, spacing and radius values.
- `assets/` and `manifest.json`: downloadable files. To add one, put the file in the right `assets/<group>/` folder and add an entry to `manifest.json`.

Edit, commit to GitHub, and Render redeploys automatically.

## Run it on your computer

```
npm install
cp .env.example .env    # then fill in one or both keys
node --env-file=.env server.js
```

Open http://localhost:3000.

## Notes

- Video Studio exports encode frame by frame, usually faster than real time. Keep the tab open until the download starts.
- The simple text-video maker records in real time, so a 30-second video takes about 30 seconds.
- Scenes are saved in each person's browser. Images and music are not kept between visits.
- The interactive component library (buttons, cards, gauges) lives in the Claude design system artifacts; this app carries the brand book, tokens and assets.
