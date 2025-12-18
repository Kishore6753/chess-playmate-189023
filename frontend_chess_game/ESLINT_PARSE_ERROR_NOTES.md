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

- No `.eslintrc*`, `eslint.config.*`, or other ESLint override files are present in this container.

## Verification (this workspace)

- `CI=true npm test -- --watchAll=false` ✅ passes
- `npm run build` ✅ passes (note: build uses `DISABLE_ESLINT_PLUGIN=true`)

## Why this error often happens

The message usually indicates **a different ESLint parser/config trying to parse a file as JSON** (or a corrupted file read), e.g.:

- a corrupted/partial file snapshot written by an editor/formatter
- an external ESLint runner (VSCode extension) using a different config and/or reading an incomplete file snapshot
- a stale or corrupted ESLint cache (`node_modules/.cache/.eslintcache`)
- transient overlay output from a previous run

## Recovery steps if it reappears in another environment

1. Re-check raw bytes of the failing file(s) in that environment:
   - ensure the file begins with `import ...` and does not start with `{`
   - ensure there is no BOM (`EF BB BF`) or truncated block comment
2. Ensure the ESLint runner is CRA’s config and not treating `.js/.jsx` as JSON:
   - no `jsonc-eslint-parser` override for `**/*.js` / `**/*.jsx`
   - no flat-config `eslint.config.*` referenced
3. Clear CRA/ESLint caches:
   - delete `node_modules/.cache/.eslintcache`
   - restart `npm start`

(Deletion is intentionally not automated by this agent due to safety restrictions on recursive delete commands in this environment.)
