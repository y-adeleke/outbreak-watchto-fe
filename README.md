# OutbreakWatchTO Frontend

Next.js 16 (App Router) client for the OutbreakWatchTO ASP.NET Core API. It delivers a public landing page plus authenticated-style workspaces for outbreaks, facilities, and case statistics with Tailwind CSS v4 and shadcn/ui.

## Stack

- **Next.js 16 + React 19** with the App Router and TypeScript.
- **Tailwind CSS v4** + **shadcn/ui** (button, card, badge, tabs, table, sheet, input, skeleton).
- **TanStack Query v5** for data fetching/caching.
- **Axios / native fetch** wrapper in `src/lib/api.ts`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment example and point to your running API (defaults to `http://localhost:5000`):
   ```bash
   cp .env.local
   # edit NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_API_KEY
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` to load the landing page, or go directly to `/outbreaks`, `/facilities`, or `/case-stats`.

## Project Structure

```
src/
├── app/                # App Router routes (landing, outbreaks, facilities, case-stats)
├── components/
│   ├── landing/        # Landing page sections + hero/cta
│   ├── layout/         # Header, footer, section wrapper
│   ├── providers/      # React Query provider
│   └── ui/             # shadcn/ui primitives
├── features/
│   ├── api/            # Typed React Query hooks hitting the backend API
│   ├── case-stats/     # Case stats grid + analytics cards
│   ├── facilities/     # Facility directory view
│   └── outbreaks/      # Explorer + detail components
└── lib/
    ├── api.ts          # Fetch wrapper honouring NEXT_PUBLIC_API_BASE_URL
    ├── types.ts        # DTO contracts mirrored from the ASP.NET API
    └── utils.ts        # shadcn helper (cn)
```

## Connecting to the API

The React Query hooks call the backend via:

- `GET /api/outbreaks` – `useOutbreaks`, explorer table & landing previews.
- `GET /api/outbreaks/{id}` – detail drill-down page.
- `GET /api/facilities` – facility directory (with derived active counts).
- `GET /api/casestats` – impact dashboards.

Make sure the ASP.NET API is running locally with HTTPS disabled or configure CORS accordingly.

## Scripts

| Script          | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the Next.js dev server (port 3000). |
| `npm run build` | Create an optimized production build.     |
| `npm run start` | Serve the production build.               |
| `npm run lint`  | Lint the codebase with ESLint.            |

## Deployment Notes

- The UI is static-friendly and can be deployed to Vercel, Netlify, or any Node target.
- Ensure `NEXT_PUBLIC_API_BASE_URL` points to the public API gateway (Apigee, etc.).
- React Query cache defaults to 1 minute stale time; adjust in `QueryProvider` if needed.
