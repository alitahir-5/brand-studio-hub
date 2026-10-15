# Deploy Brand Studio Hub on Render (step by step)

About 20 minutes. You need: a GitHub account, a Render account, a Claude API key and a Gemini API key.

## 1. Get the two API keys

**Claude**
1. Go to console.anthropic.com and sign in (this is separate from your claude.ai Max login, though you can use the same email).
2. Check **Billing**: your free credits should show there. Note their expiry date.
3. In **Billing > Limits**, set a monthly spend limit (for example $20) so a busy week can't use everything.
4. Open **API Keys > Create Key**, name it `brand-studio-render`, and copy it. It starts with `sk-ant-`. You only see it once, so paste it somewhere safe for the next 10 minutes.

**Gemini**
1. Go to aistudio.google.com and sign in with a Google account.
2. Click **Get API key > Create API key**, pick or create a project, and copy the key (it starts with `AIza`).
3. The free tier is enough to start. Its limits are shown in AI Studio.

## 2. Put the code on GitHub

1. Unzip `brand-studio.zip`.
2. On github.com, click **New repository**, name it `brand-studio-hub`, set it to **Private**, and create it.
3. Click **uploading an existing file**, drag in everything inside the `brand-studio` folder (not the folder itself, and not `node_modules` if present), and click **Commit changes**.
   The upload screen takes up to 100 files at a time. If it refuses, upload the `brands` folder in a second commit.

Check that the repository's top level shows `server.js`, `package.json`, `render.yaml`, `public/` and `brands/`.

## 3. Create the service on Render

1. In render.com, click **New > Blueprint**.
2. Connect GitHub if asked, and give Render access to the `brand-studio-hub` repository.
3. Pick the repository. Render reads `render.yaml` and shows one web service, `brand-studio-hub`, on the free plan.
4. It asks for the three secret values. Paste:
   - `ANTHROPIC_API_KEY`: your `sk-ant-` key
   - `GEMINI_API_KEY`: your `AIza` key
   - `TEAM_PASSWORD`: a password to give the team
5. Click **Apply**. The first build takes 2 to 4 minutes.

(No Blueprint option? Use **New > Web Service**, pick the repo, Runtime Node, Build `npm install`, Start `node server.js`, Instance type Free, then add the variables from step 4 plus `DEFAULT_AI=claude` in **Environment**.)

## 4. Test it

1. Open the `onrender.com` link Render shows. The browser asks to sign in: type any username and the team password.
2. Visit `/api/health` on the same address. You should see both engines listed, for example `"claude":"claude-sonnet-5-5","gemini":"gemini-3.6-flash"`.
3. In the app, top right, the **AI writer** menu shows Auto, Claude and Gemini.
4. Go to **LocomotePro > Write**, pick Claude, write a short brief and press **Write**. The status line should say "written by Claude". Switch to Gemini and repeat.
5. In **Video Studio > Write with AI**, draft scenes, then **Export video** and check the file downloads.

## 5. Share with the team

Send the link and the team password. Tell them:
- Pick **Auto** unless they want a specific writer. Auto tries Claude first and switches to Gemini if Claude is unavailable.
- The first visit after a quiet spell takes about a minute while the free server wakes up.
- Video export needs Chrome or Edge on a computer for MP4, and the tab must stay in front while it records.

## Everyday management

- **Change the default writer:** Render > your service > Environment > `DEFAULT_AI` = `claude` or `gemini` > Save. It redeploys by itself.
- **Save credit:** set `CLAUDE_MODEL` to `claude-haiku-5-5`, or set `DEFAULT_AI` to `gemini`.
- **Change the password:** edit `TEAM_PASSWORD` in Environment.
- **Watch spend:** console.anthropic.com > Usage, and AI Studio for Gemini.
- **Update brand content:** edit files in `brands/` on GitHub; Render redeploys automatically.
- **Something wrong?** Render > your service > **Logs**. Lines like `claude failed: ...` show the exact reason (wrong key, no credit, rate limit).

## If a key leaks

Delete it in the Claude Console or AI Studio, create a new one, and paste it into Render's Environment. Keys are only on the server; they never appear in the web page.
