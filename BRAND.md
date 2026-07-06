# Family Selling — brand & styling

The **single source of truth is `shared/tokens.css`.** Every colour, font and
radius is a CSS variable defined there. To change the look of the whole app,
edit that one file — all four pages update automatically. Nothing else hardcodes
colours.

## How it fits together

- **`shared/tokens.css`** — the master. Design tokens as CSS variables. Dark
  values are the default (`:root`); light values override under
  `[data-theme="light"]`.
- **`shared/theme.js`** — the dark/light toggle. Applies the saved theme before
  first paint (no flash) and adds a floating toggle button (bottom-right).
  Remembers the choice in `localStorage`. Default is dark.
- **`shared/styles.css`** — component styles for the dashboard / revise /
  performance pages. Imports `tokens.css`; uses only tokens.
- **`listing-agent.html`** — has its own component styles (it's a big bespoke
  UI) but they consume the same tokens, so it themes identically.

Every page loads `tokens.css` (directly or via `styles.css`) and `theme.js`.

## Palette — "Neon Highlights"

| Token | Dark | Light | Role |
|-------|------|-------|------|
| `--bg` | `#0D0D0D` | `#FFFFFF` | page background |
| `--surface` | `#151518` | `#F7F8FA` | cards |
| `--surface-2` | `#1E1F23` | `#EDEFF3` | raised / hover |
| `--text` | `#F4F5F7` | `#14161A` | primary text |
| `--text-dim` | `#A2A6AF` | `#565B66` | secondary text |
| `--muted` | `#6C7079` | `#8A9099` | labels / captions |
| `--accent` | `#00FF85` | `#00B85F` | primary action / value / money |
| `--accent-2` | `#1E90FF` | `#0A6CE0` | links / info |
| `--hot` | `#FF0099` | `#D6007F` | attention / flourish |
| `--good` / `--warn` / `--bad` | green / amber / pink-red | | status colours |

The neon green (`--accent`) is darkened in light mode so it stays readable on
white. Semantic tints (success/error panels) are derived at use-time with
`color-mix()`, so they follow the theme automatically.

## Typography

- **`--font`** — Inter (400/500/600/700). Used everywhere.
- **`--mono`** — IBM Plex Mono. Used for labels, SKUs and figures.

## Common tweaks

- **New accent colour:** change `--accent` (and its light value) in `tokens.css`.
- **Different font:** change `--font` in `tokens.css` and the Google Fonts
  `@import` at the top of the same file.
- **Make light the default:** in `theme.js`, change the fallback from `'dark'`
  to `'light'`.

## Note on older aliases

`tokens.css` still defines `--brass` and `--display` as aliases (to `--accent`
and `--font`) so any earlier inline references keep working. New styling should
use `--accent` and `--font` directly.
