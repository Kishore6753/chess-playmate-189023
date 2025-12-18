# ESLint JSON parsing error investigation notes

This repo previously reported:

> Parsing error: Error while parsing JSON - Unexpected end of JSON input  
> in `src/App.js`, `src/components/Board.jsx`, `src/components/ChessGame.jsx`, `src/components/TopBar.jsx`

## Findings (current workspace state)

- All four files start with valid JS/JSX (`import ...`) and contain no:
  - UTF-8 BOM bytes (`EF BB BF`)
  - NUL bytes
  - obvious truncation (they end with newline and have complete syntax)
  - stray JSON blocks at the top-of-file
  - unterminated block comments
- `package.json` has a valid CRA ESLint config:

```json
"eslintConfig": { "extends": "react-app" }
```

- Verification commands (run in `frontend_chess_game`):
  - `CI=true npm test -- --watchAll=false` ✅ passes
  - `npm run build` ✅ passes (note: build uses `DISABLE_ESLINT_PLUGIN=true`)
  - `npm start` ✅ dev server compiles without ESLint overlay errors

## Likely explanation if the error reappears elsewhere

The error message often indicates **a different ESLint parser/config trying to parse a file as JSON** (or a corrupted file read), e.g.:

- a corrupted/partial file on disk in another environment
- an editor/formatter writing a partial file
- an external ESLint runner (VSCode extension) using a different config or reading an incomplete file snapshot
- a transient CI artifact / stale overlay output

If reproduced again, re-check the raw bytes of the failing file(s) in that environment, and confirm the ESLint runner is using CRA’s config and not treating `.js/.jsx` as JSON.
