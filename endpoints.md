# Backend endpoints the UI expects

The frontend talks only to Railway. Below is every route the new pages call,
with the exact JSON shape each expects. Add these to `server.js` and wrap each
in `requireAuth`. Existing routes (`/preview/listing`, the posting flow, etc.)
should also get `requireAuth` once auth is proven.

## Auth (from auth-middleware.js)

### `POST /auth/session`  — *open (no requireAuth)*
Body `{ id_token }` → `{ token, user: { email, name, picture } }`.
Verifies the Google token, checks the allowlist, mints a 7-day session token.

## CORS — required before anything works from GitHub Pages

Once the frontend is served from `https://<you>.github.io`, browsers block calls
to Railway until the backend echoes the origin. Add near the top of `server.js`:

```js
const AGENT_ORIGIN = process.env.AGENT_ORIGIN; // e.g. https://steve.github.io
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", AGENT_ORIGIN);
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
```
No cookies are used (auth is a Bearer header), so `Allow-Credentials` isn't needed.

## Dashboard

### `GET /health`  — status for the five dots
Any JSON is tolerated; the dashboard reads these keys if present, else greys out:
```json
{ "anthropic": true, "sheets": true, "drive": true, "ebay": true }
```
Railway responding at all lights the Railway dot.

## Revise (revision-agent.html)

### `GET /ebay/listings`
```json
[ { "sku":"...", "offerId":"...", "listingId":"...", "title":"...",
    "price": 24.99, "currency":"GBP", "condition":"USED_GOOD",
    "category":"15709", "description":"...", "quantity":1 } ]
```
Source: eBay `getOffers` / `getInventoryItems`. `condition` should be the enum
(so the dropdown pre-selects correctly).

### `PUT /ebay/listings/:sku`
Body `{ sku, offerId, title, price, condition, description }` → `{ ok:true }`.
Re-run `resolveValidCondition(category, condition)` before the PUT so condition
can't regress to New. Update inventory item + offer, then (if needed) republish.

### `DELETE /ebay/listings/:sku`
Withdraws the offer / ends the listing → `{ ok:true }`.

### `POST /ebay/listings/:sku/sold`
Ends the listing if still live, then appends a **sold** row to the Sheet:
`title, category, listedPrice, soldPrice, dateSold, daysToSell`.
**No buyer name/username/address/transaction id** — aggregate/item data only.
→ `{ ok:true }`.

## Track (performance.html)

### `GET /performance`
Computed server-side from the Sheet. Aggregates only + item rows with no PII:
```json
{
  "listed": 42,
  "sold": 18,
  "revenue": 512.40,
  "avgDaysToSell": 9.3,
  "soldItems": [
    { "title":"Nike Air Max 90", "category":"Trainers",
      "listedPrice": 45.00, "soldPrice": 38.00,
      "daysToSell": 6, "dateSold":"2026-06-28" }
  ]
}
```
`sellThrough` and `avgSalePrice` are derived on the client from these fields.

## Sheet columns to support this

Add if not present: `status` (active/sold/ended), `listedPrice`, `soldPrice`,
`dateListed`, `dateSold`. `daysToSell` is `dateSold − dateListed`. Keep any
buyer columns **out** of the sheet entirely so PII can never leak into
`/performance`.
