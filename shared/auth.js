/* ===========================================================================
 * auth.js — family access gate (client side)
 *
 * Flow:
 *   1. On load, look for a stored session token. If valid, reveal the page.
 *   2. If not, show the "Sign in with Google" gate.
 *   3. Google returns an ID token -> we POST it to the backend (/auth/session).
 *   4. Backend verifies it, checks the family allowlist, and returns a signed
 *      session token (its own, longer-lived). We store that.
 *   5. Every backend call goes through authedFetch(), which attaches the
 *      session token. A 401 clears the session and re-shows the gate.
 *
 * The browser never holds an eBay/Anthropic/Apps Script secret. The only
 * credential here is a short-lived session token scoped to this app.
 *
 * USAGE (per page):
 *   Auth.protect({ onReady(user) { ... build the page ... } });
 *   ...later, for any backend call:
 *   const res = await Auth.fetch("/ebay/listings");
 * ========================================================================= */

const Auth = (() => {
  const cfg = window.EBAY_AGENT_CONFIG;
  const KEY = cfg.SESSION_STORAGE_KEY;
  let currentUser = null;

  /* --- session token helpers --------------------------------------------- */
  function saveSession(token, user) {
    const record = { token, user, savedAt: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(record));
  }
  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; }
  }
  function clearSession() { sessionStorage.removeItem(KEY); currentUser = null; }
  function getToken() { const s = loadSession(); return s ? s.token : null; }

  /* --- gated fetch -------------------------------------------------------- */
  // Prepends the backend URL for relative paths and attaches the session token.
  async function authedFetch(path, options = {}) {
    const token = getToken();
    const url = path.startsWith("http") ? path : cfg.BACKEND_URL + path;
    const headers = Object.assign({}, options.headers, {
      "Authorization": "Bearer " + (token || ""),
    });
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (res.status === 401) {
      // token expired or rejected -> force re-login
      clearSession();
      showGate("Your session expired. Please sign in again.");
      throw new Error("unauthorized");
    }
    if (res.status === 403) {
      clearSession();
      showGate("This Google account isn't on the family allowlist.");
      throw new Error("forbidden");
    }
    return res;
  }

  /* --- exchange Google ID token for a backend session -------------------- */
  async function exchangeGoogleToken(googleIdToken) {
    const res = await fetch(cfg.BACKEND_URL + "/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: googleIdToken }),
    });
    if (res.status === 403) throw new Error("not_allowed");
    if (!res.ok) throw new Error("exchange_failed");
    return res.json(); // { token, user: { email, name, picture } }
  }

  /* --- Google Identity Services callback --------------------------------- */
  async function handleCredentialResponse(response) {
    const errEl = document.getElementById("auth-err");
    try {
      const { token, user } = await exchangeGoogleToken(response.credential);
      saveSession(token, user);
      currentUser = user;
      revealPage(user);
    } catch (e) {
      if (errEl) {
        errEl.textContent = e.message === "not_allowed"
          ? "This Google account isn't on the family allowlist. Ask Steve to add you."
          : "Sign-in failed. Please try again.";
      }
    }
  }

  /* --- gate UI ------------------------------------------------------------ */
  function buildGateMarkup(message) {
    return `
      <div class="gate" id="auth-gate">
        <div class="card">
          <div class="mark">Family <b>Selling</b></div>
          <p>${message || "Sign in with your Google account to manage the family's eBay listings."}</p>
          <div class="gbtn" id="gbtn"></div>
          <div class="err" id="auth-err"></div>
        </div>
      </div>`;
  }

  function showGate(message) {
    // hide the app, show the gate
    const app = document.getElementById("app");
    if (app) app.classList.add("hidden");
    let gate = document.getElementById("auth-gate");
    if (!gate) {
      document.body.insertAdjacentHTML("afterbegin", buildGateMarkup(message));
    } else if (message) {
      const err = document.getElementById("auth-err");
      if (err) err.textContent = message;
      gate.classList.remove("hidden");
    }
    renderGoogleButton();
  }

  function renderGoogleButton() {
    if (!window.google || !google.accounts) return; // GIS not loaded yet
    google.accounts.id.initialize({
      client_id: cfg.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });
    const target = document.getElementById("gbtn");
    if (target) {
      target.innerHTML = "";
      google.accounts.id.renderButton(target, {
        theme: "filled_black", size: "large", shape: "pill", text: "signin_with",
      });
    }
  }

  function revealPage(user) {
    const gate = document.getElementById("auth-gate");
    if (gate) gate.remove();
    const app = document.getElementById("app");
    if (app) app.classList.remove("hidden");
    mountUserChip(user);
    if (typeof onReadyCallback === "function") onReadyCallback(user);
  }

  function mountUserChip(user) {
    const slot = document.getElementById("userchip");
    if (!slot) return;
    const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    slot.innerHTML = `
      <div class="userchip">
        <span class="avatar">${initial}</span>
        <span>${user.name || user.email}</span>
        <button id="signout">Sign out</button>
      </div>`;
    document.getElementById("signout").addEventListener("click", signOut);
  }

  function signOut() {
    clearSession();
    if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
    location.reload();
  }

  /* --- entry point -------------------------------------------------------- */
  let onReadyCallback = null;
  function protect({ onReady } = {}) {
    onReadyCallback = onReady;
    const session = loadSession();
    // Wait for the GIS script to be present before touching google.accounts.
    const start = () => {
      if (session && session.token) {
        currentUser = session.user;
        // Optimistically reveal; the first authedFetch will bounce us back to
        // the gate if the backend has since rejected/expired the token.
        revealPage(session.user);
      } else {
        showGate();
      }
    };
    if (window.google && google.accounts) start();
    else window.addEventListener("load", start);
  }

  return { protect, fetch: authedFetch, signOut, get user() { return currentUser; } };
})();
