# Cup & Co — Café Order Management

A production-oriented internal café operations app for **iOS, Android, and Web**, built with Expo Router, TypeScript, Supabase, Zustand, TanStack Query, and Reanimated.

The UI follows a warm Apple/Linear-inspired system: restrained color, high-contrast typography, generous spacing, tactile actions, and realtime queue feedback without visual clutter.

## What is included

- **Top navigation bar** with role-aware destinations across mobile and web
- **Role-aware workspaces** for Barista, Cashier, Manager, and Owner
- **Live barista queue** with oldest-order-first promotion, start/complete/cancel actions, and animated queue transitions
- **Cashier ordering** with categories, availability, quantities, item notes, order notes, basket review, and instant queue publishing
- **Menu management** with category CRUD and ordering, item CRUD, pricing, and availability toggles
- **Order history** with Today/Yesterday/Custom filters, status filters, search, and detailed historical snapshots
- **Analytics** for revenue, average order value, average prep time, workload, order status, and popular items
- **Device settings** for haptics, realtime updates, local demo reset, role preview, provider status, and sign-out
- **Dual data provider**
  - Supabase/PostgreSQL when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are configured
  - Rich in-memory data with an event emitter when they are absent
- **Expanded food catalog** for Fries, Maggi, steamed Momos, Pizza, Desserts, and Air Fried, including separate half/full SKUs where pricing differs
- **RLS migration and seed data** in [`supabase/schema.sql`](./supabase/schema.sql)

### Menu pricing note

Only items with a clear, usable INR price were added. Chicken Boneless, Schezwan Maggi, unnamed pizza variants, the orphan momos price, and the extra unpriced Momos lines are intentionally not seeded until their names/prices are confirmed. Existing dessert prices were aligned to the supplied menu.

## Quick start

Requirements: Node.js 20+ and npm. Expo Go, a simulator, or a modern browser can run the project.

```bash
npm install
npm start
```

Then choose a target from the Expo terminal:

- Press `w` for web
- Press `i` for an iOS simulator
- Press `a` for an Android emulator/device
- Scan the QR code with Expo Go

No `.env` file is required. With empty or missing Supabase variables, the app starts in **local demo mode**.

This project targets **Expo SDK 57**. Use the matching SDK 57 Expo Go binary or a development build for native testing.

## Demo roles

The login screen includes one-tap profiles for all four roles:

| Role | Tabs | Primary workflow |
| --- | --- | --- |
| Barista | New Order, Orders, History, Settings | Add tickets and work the live preparation queue |
| Cashier | New Order, Orders, History, Settings | Create orders and monitor queue state |
| Manager | Orders, New Order, Menu, Insights, History, Settings | Operate, manage menu, review performance |
| Owner | Orders, New Order, Menu, Insights, History, Settings | Full workspace access |

Role preview always uses the local provider so it remains deterministic. The current mode is visible in **Settings → Data connection**.

## Realtime end-to-end check

The local provider uses the same query invalidation boundary as Supabase, and emits events synchronously after mutations.

1. Sign in as **Cashier**.
2. Add two Cappuccinos and one Blueberry Muffin.
3. Add `Oat milk` as the cappuccino item note.
4. Select **Place order**.
5. In a second browser/app instance, sign in as **Barista**.
6. The new order appears as the oldest pending ticket without a manual refresh.
7. Select **Start preparing**, then **ORDER DONE**.
8. The order becomes `COMPLETED` and the next pending ticket is promoted automatically.

In mock mode, changes live for the current JavaScript session. Use **Settings → Restore demo data** to reset orders and menu data.

## Connect Supabase

### 1. Create the database objects

In the Supabase project, open **SQL Editor**, paste the full contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it.

The migration is designed to be rerun safely and includes:

- Enums for roles and order statuses
- Tables, constraints, foreign keys, and indexes
- Collision-safe order numbering
- Menu price-history snapshots on `order_items`
- `SECURITY DEFINER` role lookup and RLS policies
- Realtime publication entries
- Idempotent category and menu seed data

### 2. Create staff Auth users

Create users under **Authentication → Users**. The migration’s Auth trigger creates a matching `public.users` profile automatically, but intentionally leaves its role unassigned so random signups never receive staff access.

Promote the first trusted account from the SQL Editor:

```sql
update public.users
set name = 'Owner Name', role = 'OWNER'
where id = '<auth-user-uuid>';
```

After an Owner is assigned, additional profiles can be approved with:

```sql
update public.users
set role = 'CASHIER'
where id = '<auth-user-uuid>';
```

Valid roles are `OWNER`, `MANAGER`, `CASHIER`, and `BARISTA`. An unassigned Auth user can sign in, but receives a clear approval error and no staff data.

### 3. Configure the app

```bash
cp .env.example .env
```

Set:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Restart Expo after editing `.env`:

```bash
npx expo start --clear
```

When both variables are present, email/password sign-in uses Supabase Auth and all order/menu operations use PostgreSQL. Never put the Supabase service-role key in the client app.

## Role policy summary

- All authenticated staff can view the operational menu and order data.
- Cashier, Manager, and Owner can create orders.
- Barista, Cashier, Manager, and Owner can advance order status.
- Only Manager and Owner can change menu items, prices, availability, or categories.
- Users can read their own profile; Manager and Owner can read staff profiles.
- RLS is enforced in PostgreSQL in addition to hiding tabs in the client.

Review the exact policies in `supabase/schema.sql` before adding external staff or changing responsibilities.

## Historical price integrity

`order_items.item_name` and `order_items.unit_price` are written when an order is placed. Editing or deleting a menu item never rewrites those snapshots. History, analytics, and completed-order totals therefore continue to reflect what the customer originally purchased.

## Project structure

```text
app/                         Expo Router routes
  (auth)/login.tsx           Sign-in and demo role picker
  (app)/barista/index.tsx    Live queue
  (app)/cashier/index.tsx    New order
  (app)/menu/index.tsx       Menu/category management
  (app)/history/index.tsx    Order history
  (app)/analytics/index.tsx  Today’s dashboard
  (app)/settings/index.tsx   Device/profile/provider settings
src/
  components/                UI, order, menu, analytics, and providers
  services/                  Supabase + mock provider, queries, mutations, realtime
  store/                     Auth, cart, and settings Zustand stores
  theme/                     Color, type, spacing, radius, and shadow tokens
  types/                     Strict domain and database types
  utils/                     Dates, money, roles, analytics, haptics
supabase/schema.sql          Database migration, RLS, triggers, realtime, seed data
scripts/generate_assets.py   Reproducible branded app icon/splash generation
```

## Quality commands

```bash
npm run typecheck     # strict TypeScript, no emit
npm run lint          # Expo/ESLint checks
npm run export:web    # static production web export
npm run generate:assets
```

A successful production web export writes static output to `dist/` (ignored by Git).

## Environment behavior

| State | Provider | Persistence | Realtime |
| --- | --- | --- | --- |
| Supabase vars missing | Local in-memory | Current app session | In-process event emitter |
| Supabase vars present | Supabase | PostgreSQL | `postgres_changes` |
| Demo role selected | Local in-memory | Current app session | In-process event emitter |

## Security notes

- The app uses only the public Supabase anon key.
- RLS is the authorization boundary; client-side tab visibility is only a usability feature.
- Auth sessions are persisted by `@supabase/supabase-js`.
- Local user preferences use AsyncStorage.
- Do not log access tokens or add service-role credentials to `.env` files used by Expo.
