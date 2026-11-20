# bottom-command-concierge Specification

## Purpose

Provides a persistent, accessible sticky bottom command and concierge dock on the portfolio homepage so visitors can execute slash commands, search site content, inspect aggregated RSS updates, and converse with David's concierge without replacing the Bento Grid browsing experience.

## Requirements

### Requirement: Persistent compact bottom dock preserving Bento visibility and contrast
The system SHALL render a single compact sticky bottom command and concierge bar centered at the bottom of the main portfolio view (replacing the standalone floating bell trigger), respecting `env(safe-area-inset-bottom)`, reserving bottom page clearance (`pb-24 sm:pb-28`), and enforcing WCAG AA/AAA text contrast pairs (`#17324d`/`#2b251a` on `#fffdf5`/`#ffb010`; `#fff9e8`/`#ffb010` on `#17324d`).

#### Scenario: Initial collapsed state and mobile keyboard layout
- **WHEN** a visitor loads the homepage on desktop or mobile viewports without focusing the dock or opening a modal
- **THEN** the dock renders as a compact pill above `env(safe-area-inset-bottom)` without overlapping bottom Bento cards, keeps compact `RSS` and `/search` quick actions accessible on mobile, and caps expanded drawer height within `max-h-[60dvh]` above the virtual keyboard.

#### Scenario: Coordination with back-to-top and modal views
- **WHEN** the full `ContactDialog` modal or `AdminConsole` is open, or the visitor scrolls past the Back-to-Top threshold
- **THEN** the Back-to-Top button sits cleanly above the dock (`bottom-20 sm:bottom-24 right-6 z-40`), and the bottom dock hides cleanly whenever the modal or admin console is active.

### Requirement: Single-owner global keyboard shortcuts and IME safety
The system SHALL centralize global `/` and `Cmd/Ctrl+K` shortcut handling under a single owner (`App.tsx`), eliminating competing `window` listeners in `Navbar.tsx`, and SHALL respect IME composition and editable controls.

#### Scenario: Focusing dock vs. Navbar search and Escape priority
- **WHEN** the visitor presses `/` or `Cmd/Ctrl+K` while focus is NOT inside an `INPUT`, `TEXTAREA`, `SELECT`, `[contenteditable="true"]`, or an active IME composition (`isComposing` / `keyCode === 229`), and `ContactDialog` is closed
- **THEN** `/` focuses the bottom dock and opens the slash-command list, `Cmd/Ctrl+K` focuses the bottom dock, and pressing `Escape` follows modal-first priority (`ContactDialog` → Navbar search → Bottom Dock drawer) and restores focus to `textareaRef` when collapsing the dock drawer.

#### Scenario: IME Enter and Shift+Enter in dock input
- **WHEN** the visitor is composing CJK characters via IME and presses `Enter`, or presses `Shift+Enter`
- **THEN** the dock MUST NOT submit the message or execute a command; `Shift+Enter` inserts a newline, and plain `Enter` submits only after IME composition ends.

### Requirement: Slash command palette, route parity, and unknown command handling
The system SHALL display an interactive ARIA-accessible (`role="combobox"` / `role="listbox"` / `aria-activedescendant`) slash-command palette when `/` is typed at the start of the input, with wrap-around `ArrowUp`/`ArrowDown` navigation and deterministic execution for all commands.

#### Scenario: Built-in slash command execution and search clearing
- **WHEN** the visitor executes `/help`, `/commitments`, `/executive`, `/flagships`, `/contact`, `/form`, `/clear`, or an unknown `/foo` command
- **THEN**
  - `/help` renders a localized (`zh` / `en`) command directory inside the drawer.
  - `/commitments`, `/executive`, and `/flagships` clear any active `searchQuery`, close the drawer, synchronize the canonical route (preserving `?lang=en`), and scroll cleanly without scroll-race conflicts (`#commitments` or `#section-nav-bar`).
  - `/contact` opens `ContactDialog` on the `chat` tab (`/contact`), and `/form` opens `ContactDialog` on the `form` tab (`/contact/form`).
  - `/clear` clears the active session transcript/results and collapses the drawer.
  - An unknown ASCII slash command (e.g. `/foo`) renders a non-blocking hint suggesting `/help`, while text like `/中文詢問` falls through cleanly or prompts without errors.

### Requirement: Local search, aggregated RSS drawer, and safe reference links
The system SHALL execute `/search <query>` and `/rss` locally using `lib/siteCatalog.ts`, `lib/webmcpSearch.mjs`, and pre-fetched `/feed-summary.json` (idle-prefetched with `cache: 'no-store'` and graceful catalog-only fallback if `/feed-summary.json` is unavailable or still loading), and SHALL render only validated `http:`/`https:` URLs with `rel="noopener noreferrer"`.

#### Scenario: Instant search and empty query handling
- **WHEN** the visitor executes `/search quant` (or `/search` with no argument)
- **THEN** `/search quant` displays ranked, deduplicated results from catalog items and loaded feed entries with category badges in < 100ms on cached data; an empty `/search` prompts the visitor to enter a keyword and focuses the input.

#### Scenario: Aggregated RSS view and autodiscovery
- **WHEN** the visitor executes `/rss` or inspects the page `<head>`
- **THEN** the dock lists recent items across Blog, Podcast, GitHub, and original Threads posts (with a catalog-only fallback notice if `/feed-summary.json` failed to load) alongside subscription links including `/rss.xml`, and `index.html` exposes `<link rel="alternate" type="application/rss+xml" href="/rss.xml">`.

### Requirement: Stateful handoff between Bottom Dock and ContactDialog
The system SHALL share a unified concierge session state (`messages`, `draft`, `mode`, `autoDispatched`, `dispatchedTo`) between `BottomConciergeDock` and `ContactDialog`, and SHALL surface a 1-click contact handoff button in `'qa'` bubbles when `suggestedAction === 'contact'`.

#### Scenario: Seamless dock-to-dialog handoff and commercial CTA pill
- **WHEN** a visitor converses in `BottomConciergeDock` (including clicking a `suggestedAction: 'contact'` handoff button on an advisory/commercial reply) and executes `/contact` or `/form`
- **THEN** `ContactDialog` opens with the existing transcript, extracted draft fields, and dispatch status intact, and browser Back/Forward or closing/reopening the dialog preserves the session until explicitly cleared via `/clear`.
