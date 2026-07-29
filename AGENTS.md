# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Local Server Infrastructure

The app supports four optional self-hosted controller services. When a URL is
set for a stage (Settings → Local servers), that stage routes to the
controller instead of the Base44 cloud function. When unset, the cloud path
is used exactly as before. Each stage is independent.

| Stage | Controller folder | Endpoint | Cloud fallback |
|---|---|---|---|
| OCR | `ocr-controller/` | `POST /ocr` | `ocrImages` function |
| Cleaning | `clean-controller/` | `POST /clean` | skipped (no cloud equivalent) |
| Translation | `translate-controller/` | `POST /translate` | `translateChapter` function |
| Typesetting | `typeset-controller/` | `POST /typeset` | skipped (no cloud equivalent) |

- OCR controller is fully implemented (PaddleOCR). The other three ship as
  stubs pending model integration (see each folder's README.md).
- All controllers share the same conventions: FastAPI, `GET /health`,
  optional `API_KEY` header, CORS `*`.
- Typesetting needs bubble geometry (`box`) from OCR — the web app requests
  `include_boxes=true` from the OCR controller when a typesetting server is
  configured. Cloud OCR does not return boxes.
- Frontend routing logic: `src/lib/ocrEngine.js`. URL persistence:
  `src/lib/localServer.js`. Settings UI: `src/components/batch/LocalServerSection.jsx`.
  Workspace stage badges: `src/components/batch/StageBadges.jsx`.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.