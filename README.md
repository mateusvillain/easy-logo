# ⚡ Easy Logo

Search famous brand logos, download the SVG file, or copy the SVG code — all in one simple page.

## Features

- 🔍 Dynamic search across the logo catalog
- ⬇️ Download any logo as an `.svg` file
- 📋 Copy the raw SVG code to the clipboard
- 🌗 Light and dark mode

## Monorepo structure

This repository is a [pnpm workspace](https://pnpm.io/workspaces), prepared to host more apps in the future (e.g. a Figma plugin):

```
easy-logo/
├── apps/
│   └── web/          # The web platform (Vite + React + TypeScript)
└── packages/
    └── logos/        # Shared logo catalog (svg files + data + search)
        ├── svgs/     # The .svg files — source of truth for the catalog
        │   ├── <slug>.svg           # brand symbol
        │   └── <slug>-wordmark.svg  # full logotype (optional)
        └── data/brands.json         # title, slug and brand color per brand
```

## Development

Requires [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io) 10+.

```sh
pnpm install     # install all workspace dependencies
pnpm dev         # start the web app at http://localhost:5173
pnpm build       # typecheck and build the web app
pnpm generate    # rebuild the catalog (logos.json) from the .svg files
```

### Adding or removing logos

All logos live in the repository as plain `.svg` files under `packages/logos/svgs/`. To add a brand:

1. Add `svgs/<slug>.svg` (the symbol) and, optionally, `svgs/<slug>-wordmark.svg` (the full logotype)
2. Add an entry (`slug`, `title`, `hex`) to `packages/logos/data/brands.json`
3. Run `pnpm generate` and commit the updated `packages/logos/src/logos.json`

Two maintenance scripts (run inside `packages/logos`) help pull assets from external catalogs — they only fill in missing files and never overwrite yours:

- `pnpm import:icons` — imports symbols from [Simple Icons](https://simpleicons.org) (CC0) for the slugs curated in `scripts/import-simple-icons.mjs`
- `pnpm import:wordmarks` — imports full logotypes from [svgl](https://svgl.app) for brands already in `brands.json`

## License

[CC0 1.0 Universal](./LICENSE) — public domain. No attribution required, use it however you want.

Logo artwork is sourced from [Simple Icons](https://simpleicons.org) (CC0) and [svgl](https://svgl.app). All trademarks, logos and brand names belong to their respective owners; they are provided for identification purposes only.
