# Family Selling — eBay Console (UI)

Static frontend for the eBay Listing Agent, deployed on GitHub Pages. Three
tools behind one Google-gated home page:

- **List an item** — the existing listing agent (copy your file in as `listing-agent.html`)
- **Revise an item** — edit/end live listings, mark as sold
- **Track performance** — aggregate sell-through, revenue, time-to-sell (no PII)

All privileged work happens on the Railway backend. The browser holds no eBay,
Anthropic or Apps Script secrets — only a short-lived session token.

```
ebay-agent-ui/
├── index.html            # dashboard (3 tasks + systems strip)
├── listing-agent.html    # ← copy your existing tool here
├── revision-agent.html   # manage live listings
├── performance.html      # aggregate metrics
├── shared/
│   ├── config.js         # Railway URL + Google client ID (both public)
│   ├── auth.js           # Google sign-in + session + gated fetch
│   └── styles.css        # shared design system
└── server/
    ├── auth-middleware.js # drop into the Railway backend
    └── endpoints.md       # the routes the UI expects
```

## Setup — one time

### 1. Create the Google OAuth client
Google Cloud Console → APIs & Services → Credentials → **Create credentials →
OAuth client ID → Web application**.
- **Authorised JavaScript origins:** your Pages URL (e.g. `https://steve.github.io`)
  and `http://localhost:8080` for local testing.
- No redirect URI is needed (we use the Identity Services button, not a redirect).
- Copy the **Client ID** into `shared/config.js` → `GOOGLE_CLIENT_ID`, and set it
  as the `GOOGLE_CLIENT_ID` env var on Railway. (The client *secret* is unused —
  never commit it.)

### 2. Configure Railway env vars
```
GOOGLE_CLIENT_ID = <same client id>
ALLOWED_EMAILS   = you@gmail.com,partner@gmail.com,kid@gmail.com
SESSION_SECRET   = <openssl rand -hex 32>
AGENT_ORIGIN     = https://steve.github.io
```
Adding/removing an email takes effect immediately — `requireAuth` re-checks the
allowlist on every request.

### 3. Wire auth into the backend
```bash
cd ebay-agent-server && npm install google-auth-library jsonwebtoken
```
In `server.js`:
```js
const { attachAuthRoutes, requireAuth } = require("./auth-middleware");
attachAuthRoutes(app);                       // POST /auth/session
app.get("/ebay/listings", requireAuth, ...); // protect privileged routes
```
Add the CORS block from `server/endpoints.md` too.

### 4. Deploy the frontend
- Put `config.js`'s `BACKEND_URL` = your Railway URL (already set).
- Create a **public** repo `ebay-agent-ui`, push these files.
- Settings → Pages → Deploy from a branch → `main` / root.
- Copy your existing tool in as `listing-agent.html`, and inside it swap any
  direct Anthropic/Apps Script calls to go through Railway + `Auth.fetch`
  (see "Hardening" below) so it works on any device without pasting keys.

## Local testing
```bash
cd ebay-agent-ui && python -m http.server 8080
# open http://localhost:8080/index.html
```
Make sure `http://localhost:8080` is in the Google client's authorised origins
and `AGENT_ORIGIN` on Railway matches whatever origin you're testing from.

## Hardening (do after the gate works)
Right now the listing tool likely calls Anthropic from the browser with a key in
localStorage, and Apps Script directly. Move both server-side:
- **Anthropic:** proxy through a `requireAuth` Railway route; key becomes an env
  var. No key in the browser, works on every device.
- **Apps Script:** call it from Railway only; the URL never appears in frontend
  JS. Consider a shared-secret header so only Railway can invoke it.

End state: **browser → Railway (Google-gated) → eBay / Anthropic / Apps Script.**
One gate, all secrets server-side.

## Suggested build order
1. Confirm the condition fix on a live listing (separate from this repo).
2. Deploy this UI to Pages; fix CORS (`AGENT_ORIGIN`); confirm the Google gate.
3. Build `GET /ebay/listings` → the Revise page goes live.
4. Add the sold flow + Sheet columns → the Track page fills in.
5. Migrate Anthropic + Apps Script calls server-side (hardening).
