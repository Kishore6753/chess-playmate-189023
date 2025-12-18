# Maintenance Notes

- Date: 2025-12-18
- Task: Documentation suite for frontend_chess_game
- Summary: Added comprehensive documentation including README, ARCHITECTURE, DEVELOPER_GUIDE, STYLE_GUIDE, and ENVIRONMENT. Synchronized with current source code and package.json scripts.
- Changes Made:
  - Created/updated:
    - README.md
    - ARCHITECTURE.md
    - DEVELOPER_GUIDE.md
    - STYLE_GUIDE.md
    - ENVIRONMENT.md
  - Reviewed feature flags, clocks, AI scheduling, and component structure.
- Follow-ups:
  - Add tests for edge cases in move generation (castling through check, en passant verification).
  - Consider adding a second piece theme and wiring theme switching.
  - Evaluate adding threefold repetition / 50-move rule detection.
  - If online play is introduced, document use of REACT_APP_* URLs and WS endpoints.

## Documentation status

The documentation reflects the current codebase as of this date. When making significant changes to:
- src/game/* logic, update ARCHITECTURE.md (data flow, reducer actions) and DEVELOPER_GUIDE.md (testing notes).
- Feature flags, update ENVIRONMENT.md and README.md sections.
- Theme or CSS variables, update STYLE_GUIDE.md.

Keep README concise and link to the deeper documents for details.
