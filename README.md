# Bookscape

Bookscape is a local-first PWA for AI-generated books. It reads book content from JSON, saves reader progress in local storage, and presents chapters as a connected map with a cheat sheet and appendix for quick recall.

## Features

- **Focused reading workspace:** keep the reader full-width, then open contents, appendix, cheat sheet, and knowledge map in dedicated overlays
- **Drawer bookshelf:** switch titles from a hamburger-triggered library instead of permanently losing reading space
- **Wikipedia-like navigation:** jump by chapter links instead of reading strictly top-to-bottom
- **Progress tracking:** persistent per-book progress, current section, and bookmarks
- **Reader focus mode:** turn the book into a distraction-reduced fullscreen reading surface
- **Responsive PWA:** installable, offline-capable, and usable on desktop or mobile
- **Generation-ready content model:** schema and agent instructions for creating new books

## Local development

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run lint
npm run build
```

## GitHub Pages deployment

The repository includes `.github/workflows/deploy.yml` for GitHub Pages. On pushes to `main`, GitHub Actions installs dependencies, builds the app, and publishes `dist/`.

The Vite base path is derived automatically from `GITHUB_REPOSITORY` during production builds, so the app works when hosted under `https://<owner>.github.io/<repo>/`. For custom hosting paths, set `VITE_BASE_PATH`.

## Book format

- Library manifest: `public/books/library.json`
- Individual books: `public/books/*.json`
- JSON schema: `public/schemas/interactive-book.schema.json`
- Agent authoring guidance: `AGENTS.md`

Each book defines metadata, theme tokens, cheat-sheet entries, appendix groups, and chapters. Chapters contain sections plus relationship links that drive the “jump by idea” reading experience.
