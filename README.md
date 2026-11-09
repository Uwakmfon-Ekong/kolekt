# Kolekt – frontend prototype

Next.js 14 (App Router) · TypeScript · Tailwind CSS · lucide-react. **Frontend only**: mock data, no backend,
no authentication, no database, no payments, no external API calls.

```bash
npm install
npm run dev     # http://localhost:3000  (landing page; its buttons go to /login)
```

## Routes
| Route | Notes |
|---|---|
| `/` | landing page (`components/landing/`): "Get started" and "Start a collection" go to `/login` |
| `/login` → `/dashboard`, `/signup` | validation, show/hide password, remember-me (localStorage) |
| `/signup` → `/dashboard`, `/login` | photo preview, password rules; name feeds the dashboard greeting |
| `/dashboard` | summary, recent collections, bottom nav / sidebar |
| `/collections`, `/collections/[id]` | search, tabs, card menu (View / Edit / Share / Close); detail page with inline edit |
| `/collections/create/details` → `contribution-type` → `contributor-fields` → `preview` | 4-step wizard, draft kept in shared context |
| `/collections/published` | shows generated mock ID + public link; new collection appears in lists as Active |
| `/reports`, `/profile` | bottom-nav destinations |

## Structure
- `lib/create-collection.tsx` – `AppProvider` (user, collections, wizard draft, published result); wrapped in `app/layout.tsx`.
- `components/landing/` – the landing page: `sections/` (one file per section), `mockups/`, `ui/`, all copy in `content.ts`, animations in `landing.css`.
- `lib/data.ts` – mock data. `components/` – `Button`, `Field`, `Checkbox`, `Card`/`EmptyState`, `StepHeader`, `FlowFooter`, `AuthShell`, `AppShell` (sidebar + bottom nav), `CollectionCard`, `Icon` (lucide).
- Route groups: `(auth)` login/signup, `(app)` pages with the nav shell, `(flow)` full-screen wizard pages. Each group has a `template.tsx` that fades pages in.
- State resets on a full page refresh (nothing is persisted).
