# CLAUDE.md

Guidance for AI coding agents (Claude, Cursor, etc.) working on this repository.

## Project

**Chesskit** — open-source chess web app to play, view, analyze and review games with Stockfish.
Live at [chesskit.org](https://chesskit.org/).

## Stack

- [Next.js](https://nextjs.org/docs) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Material UI](https://mui.com/material-ui/)
- Deployed on AWS via [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- Desktop builds via Electron

## Common commands

Requires Node.js >= 22.11.

```bash
npm i              # install deps
npm run dev        # start dev server at http://localhost:3000
npm run lint       # run linter
npm run deploy     # deploy via AWS CDK (needs AWS CLI auth)
```

Docker equivalents live in `docker/docker-compose-dev.yml` and `docker/docker-compose-prod.yml`.

## Repository layout

- `src/` — application code (components, hooks, lib, pages, sections, types, constants)
- `cdk/` — AWS CDK infrastructure
- `electron/` — Electron desktop wrapper
- `scripts/` — utility scripts
- `docker/` — Docker compose files
- `src/styles/design.css` — design system (tokens + rationale + animations, single source of truth)
- `CONTRIBUTING.md` — contribution guidelines

### Pages / routes

- `/` — Analysis (review games, evaluations, classifications)
- `/database` — Local game database
- `/openings` — Opening repertoire studies (move tree + training)
- `/openings/[id]` — Repertoire editor (board, variations, comments, training mode)
- `/notes` — Notes hub (search, filter by tag)
- API routes under `src/pages/api/`: `games.ts`, `openings.ts`, `notes.ts`, `notes/images.ts`

### Persistence

JSON files in `data/` (or `DATA_DIR` if set) via Next.js API routes. User-generated files
(`data/notes.json`, `data/openings.json`, `data/notes-images/`) are gitignored.

## DO NOT READ — token-heavy paths

To save tokens, **do not open or read these files/folders** unless the user explicitly asks for them. They are large binaries, generated assets, or bulk data with no value for code reasoning:

- `public/` — ~386 MB (Stockfish engine WASM binaries, piece sets, sounds, icons)
- `data/games.json` — ~1.3 MB bulk PGN/games data
- `data/notes-images/` — user-uploaded reference images (binary)
- `package-lock.json` — ~600 KB lockfile (use `package.json` instead)
- `assets/` — screenshots and marketing images
- `LICENCE`, `COPYING.md` — full license texts
- Any `*.pgn` file — chess game dumps
- `node_modules/`, `.next/`, `out/`, `dist-electron/`, `.electron-standalone/`, `cdk.out/`, `.cdk.staging/` — generated/build artifacts

If you need information about something inside these paths, prefer:

- Listing the directory (`ls`) instead of reading files
- Reading a small relevant slice with `Read` + `offset`/`limit`
- Searching with `Grep`/`Glob` rather than full reads

## Conventions

- TypeScript everywhere; respect existing tsconfig and ESLint rules
- Match the surrounding style; do not reformat unrelated code
- Run `npm run lint` after substantive edits

## License

GNU AGPL v3 — see `COPYING.md`.
