# Spiff v2 — repo drop

Everything in this folder is **new**. Copy it into your `agentic-reporting` clone and commit;
nothing here overwrites `spiff-mockup.html`, `docs/Spiff-Project-Brief.md` or
`docs/Spiff-Custom-Instructions.md`.

```
spiff-mockup-v2.html          the built mockup — one self-contained file, open it in a browser
build.mjs                     rebuilds spiff-mockup-v2.html from src/ + vendor/
src/                          the modular source (edit here, not in the built file)
vendor/                       ECharts and the South Africa GeoJSON, inlined
docs/Spiff-v2-Research.md     the research: ThoughtSpot in depth, plus catalogues, rules,
                              access governance, portal chat, MCP, and code-as-meaning
docs/Spiff-v2-Design-Notes.md what v2 does, screen by screen, and why
docs/Spiff-v2-Build-Contract.md  the contract the parallel build ran against
docs/research/                the eight raw deep-dives the consolidated doc was written from
```

## Rebuilding

```bash
node build.mjs        # concatenates src/ + vendor/ into spiff-mockup-v2.html
```

There is no toolchain and no dependency to install. `build.mjs` is plain Node and does nothing
but read files in order and write one file out.

## How the source is laid out

The build concatenates, in this order:

| Part | What it is |
|---|---|
| `src/00-head.html` | title, fonts |
| `src/10-css-v1.css` | the v1 stylesheet, unchanged |
| `src/11-css-v2.css` | the v2 design-system layer on top |
| `src/20-shell.html` | app shell — rail, topbar, view containers, chat drawer |
| `vendor/*` | ECharts 6.1.0 and the ZA GeoJSON, inlined (a published Artifact blocks external scripts) |
| `src/40-app-v1.js` | the v1 engine, near-verbatim — ask, answer, charts, workspace, teams, library, automations, dashboards, admin |
| `src/data/*.js` | the made-up data: org and datasets, rules, access, connectors, audit, chat, sources |
| `src/core/45-ui2.js` | the shared UI kit and the router extension |
| `src/views/*.js` | one file per v2 screen |
| `src/90-boot-v2.js` | counts, scope chips, landing view |

Each `src/**/*.js` file is a standalone `<script>` block. Every top-level name is globally
unique, because they all end up in one scope. `src/core/45-ui2.js` wraps the v1 `go()` so new
routes render through `V2ROUTES` and everything v1 did still works.

Adding a screen: add `<section class="view wide" id="view-x"></section>` to the shell, a nav
entry, a `CRUMB2` label, and a `src/views/NN-x.js` that sets `V2ROUTES.x`.

## Verifying

`verify.mjs` drives the built file in headless Chromium: it walks every route and deep link,
watches for console and page errors, exercises the viewer simulator, screenshots light and
dark, and checks nothing overflows horizontally at 1480 and 1100. `scan-svg.mjs` catches
inline icons that render at the SVG default size. Both need Playwright.

The one console error you will see locally is the Google Fonts stylesheet failing where there
is no network. It loads fine in a browser and in the published artifact.

## v1 is untouched

`spiff-mockup.html` and its artifact link still work. v2 is a fork, not a replacement — every
v1 screen is still in it, reachable from the same rail.
