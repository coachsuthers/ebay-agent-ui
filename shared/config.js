/* ---------------------------------------------------------------------------
 * config.js — shared client configuration
 *
 * These values are PUBLIC by design. Neither is a secret:
 *   - The Railway URL is already "use this everywhere" in the project.
 *   - A Google OAuth *Client ID* is meant to be embedded in frontend code.
 *     (The Client *Secret* is never used here and must never be committed.)
 *
 * The real access gate lives on the backend: it verifies each Google login,
 * mints a short-lived session token, and checks the email allowlist on every
 * request. Nothing sensitive is stored in the browser.
 * ------------------------------------------------------------------------- */

window.EBAY_AGENT_CONFIG = {
  // Railway backend — every privileged call goes here, never straight to eBay/Anthropic.
  BACKEND_URL: "https://ebay-agent-server-production.up.railway.app",

  // Google OAuth 2.0 Client ID (Web application type). Create this in the
  // Google Cloud Console — see README step 1. Paste it here after creating.
  GOOGLE_CLIENT_ID: "265701617855-vors49lkg0sqdc7a9nte62smgpencqpi.apps.googleusercontent.com",

  // Where the signed session token is kept. sessionStorage clears on tab close;
  // switch to localStorage if you'd rather family members stay signed in longer.
  SESSION_STORAGE_KEY: "ebay_session",
};
