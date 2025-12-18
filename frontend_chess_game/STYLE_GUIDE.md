# Style Guide

## Theme

This app uses a light theme with modern styling and soft elevation. Primary accents are blue (#3b82f6) and teal (#06b6d4), consistent with the provided style theme data.

CSS custom properties are defined in src/App.css:

- --bg: #f9fafb
- --surface: #ffffff
- --text: #111827
- --muted: #64748b
- --primary: #3b82f6
- --accent: #06b6d4
- --danger: #ef4444
- --border: rgba(17, 24, 39, 0.12)
- --shadow: 0 10px 30px rgba(17, 24, 39, 0.08)

Board colors:
- --sq-light: #f1f5f9
- --sq-dark: #94a3b8
- --sq-select: rgba(59, 130, 246, 0.45)
- --sq-last: rgba(6, 182, 212, 0.25)

These variables are used throughout to maintain a cohesive look.

## Layout

- The main page centers content with a max width and generous spacing (see .page, .topBar).
- The chessboard is a fixed 640×640 grid (80px squares) for predictable rendering.
- A sidebar stack holds clocks, status, and move list.
- A responsive media query collapses the layout to a single column under 920px.

## Components and states

- Buttons:
  - .btn uses a blue gradient and strong contrast for primary actions.
  - .btn--secondary offers a neutral alternative on white surfaces.
- Selects:
  - .select and .selectLabel provide consistent spacing and font sizing.
- Panels:
  - .panel elements use --surface background, soft border, and shared --shadow.

## Board interactions

- Selected squares: inset box-shadow using --sq-select.
- Legal move hints: .sq--highlight outline; .dot marker appears for destinations.
- Last move: .sq--lastmove gradient for subtle context.
- Coordinates: small overlay when coordinates feature is enabled.

## Accessibility

- Interactive elements are buttons or selects with proper aria-labels.
- Board and clock groups are labeled and rely on structure for screen reader navigation.
- Piece images include alternative text (e.g., “White queen”), and tiles include coordinate context.

## Typography

- Base font is ui-sans-serif with system fallbacks.
- Panels and titles use heavier weights to establish hierarchy.
- Monospace is used for times and move logs for alignment.

## Theme mapping to values

- Primary (#3b82f6) maps to --primary and is used for gradients, focus glows, and accents.
- Success/Accent (#06b6d4) maps to --accent and is used for secondary highlights (e.g., last move background, legal dots).
- Error maps to --danger (#ef4444) and appears on clock flags.

## Assets

- Pieces are 12 SVGs in src/assets/pieces/default. They are bundled via require.context in Board.jsx to ensure reliability in production builds.

## Extending styles

- To add themes, introduce parallel asset folders and additional CSS variables, then extend Board.jsx’s pieceSrc logic to resolve theme-specific asset contexts.
- Keep spacing, radii, and shadows consistent to maintain visual coherence.
