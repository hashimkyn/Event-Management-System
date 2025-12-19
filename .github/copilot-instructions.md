<!-- Copilot / AI agent instructions for Event Management System (Electron frontend + C++ backend) -->
# Event Management System — AI assistant quick guide

## Big Picture
**Three-tier architecture**: 
- **Main process** (`main.js`): Electron app entry, creates BrowserWindow, routes IPC calls to backend bridge
- **Backend bridge** (`backend-bridge.js`): Node.js layer that spawns `backend.exe` (C++ process) via `child_process.spawn()`, sends commands via stdin, parses stdout
- **Renderer** (`index.html` + `renderer.js`): UI and client logic; calls `window.api.*` methods (exposed via `preload.js`) which invoke IPC handlers
- **Storage**: JSON files in `data/` directory (`events.json`, `customers.json`, `staff.json`, `vendors.json`, `registrations.json`)

## Where to Look First
- `main.js` — Electron setup with `contextIsolation: true` and `nodeIntegration: false` (secure); defines IPC handlers that delegate to `backend` methods
- `preload.js` — Exposes `window.api` object (safe context bridge) with all available methods
- `backend-bridge.js` — **Critical**: Spawns `backend.exe`, sends stdin inputs, parses output. Each method builds an input array, calls `executeCommand()`, extracts results from stdout
- `renderer.js` — 1349 lines; UI state management, form handlers, table rendering. Uses `window.api.*()` for all backend calls
- `index.html` — DOM structure with stable `id` attributes (e.g., `add-event-form`, `events-table`, menus like `organiser-menu`)

## Data Flow Pattern
1. User interacts with HTML form (id: `add-event-form`, etc.)
2. Form `onsubmit` handler in `renderer.js` collects input values
3. Calls `window.api.eventAdd({...})` (via preload.js context bridge)
4. `main.js` IPC handler invokes `backend.eventAdd(data)` 
5. Backend bridge spawns `backend.exe`, sends inputs via stdin
6. Parses stdout output (e.g., extract ID from "Your ID: 123")
7. Returns `{success: true, ...}` to renderer
8. Renderer calls `loadEventsTable()` to fetch and re-render table via `window.api.eventGetAll()`

## Backend Bridge I/O Convention
- **Input format**: Array of strings sent to `backend.exe` stdin, one per line
  - First element typically menu choice (1=organiser, 2=customer, etc.)
  - Example: `['1', '1', username, password, '0']` for organiser login
- **Output parsing**: Regex patterns on stdout (e.g., `/Your ID:\s*(\d+)/i`) to extract structured data
- **Error handling**: Returns `{success: false, message: '...'}` on failure; timeouts after 15s

## Developer Workflows
- **Start app**: `npm run start` (runs `electron .`)
- **Debug**: Uncomment `win.webContents.openDevTools();` in `main.js` for DevTools console
- **Test backend spawning**: Add `console.log()` in `backend-bridge.js` executeCommand() to see raw output
- **No automated tests**: Validate manually via UI flows

## Critical Conventions
- **Menu pattern**: `renderer.js` defines `menus` object mapping menu IDs → DOM elements. Show/hide via `.hidden` CSS class
- **Form pattern**: Form submit → call `window.api.*()` → parse result → call reload/render function (e.g., `loadEventsTable()`)
- **IPC naming**: `organiser:login`, `event:add`, `staff:delete`, etc. (kebab-case with colon separator)
- **Global state**: `currentUser`, `currentViewEventId`, `currentEventDetail` in renderer.js track session/context

## Common Changes
- **Add new organiser view**: Create menu div in `index.html` (id: `new-menu`), add to `menus` object, wire button handlers
- **Add backend command**: Extend `backend-bridge.js` method with new input array, regex for output, add IPC handler in `main.js`, expose via `preload.js`
- **Modify form flow**: Update form IDs in `index.html`, adjust collection logic in `renderer.js` handler, ensure data shape matches backend-bridge expectations

## What NOT to Change Casually
- HTML element `id` attributes (cross-referenced in `renderer.js` and `preload.js` API methods)
- IPC handler names in `main.js` without updating `preload.js` and call sites
- `contextIsolation: true` or `nodeIntegration: false` settings (maintain security posture)
- Backend input/output format (e.g., menu choice order, regex patterns) — coordinate with backend.cpp expectations
