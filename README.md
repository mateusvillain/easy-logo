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
    └── logos/        # Shared logo catalog (data + search), reusable by any app
```

## Development

Requires [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io) 10+.

```sh
pnpm install     # install all workspace dependencies
pnpm dev         # start the web app at http://localhost:5173
pnpm build       # typecheck and build the web app
pnpm generate    # regenerate the logo catalog from simple-icons
```

### Adding or removing logos

The catalog is a curated subset of [Simple Icons](https://simpleicons.org) (CC0). To change it:

1. Edit the `CURATED_SLUGS` list in `packages/logos/scripts/generate.mjs`
2. Run `pnpm generate`
3. Commit the updated `packages/logos/src/logos.json`

## License

[CC0 1.0 Universal](./LICENSE) — public domain. No attribution required, use it however you want.

Logo artwork comes from [Simple Icons](https://simpleicons.org) (also CC0). All trademarks belong to their respective owners.
