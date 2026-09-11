# FYNEXO v1.0 — Application Foundation

Financial Operations & Procurement Intelligence

## Included

- Next.js App Router + TypeScript
- Supabase SSR browser/server clients
- Current `proxy.ts` session-refresh pattern
- Login/logout foundation
- Protected application routes
- Responsive application shell
- Financial Command Center dashboard
- Budget, Procurement, Orders, Receiving, Invoices, Vouchers, Payments, Vendors, Reports and Administration module shells
- Record Lock RPC client foundation
- WCAG-conscious focus, labels, responsive behavior and reduced-motion support
- Database migrations 0001 and 0002 bundled under `supabase/migrations`

## Configure

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`.
3. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Run migrations 0001 and 0002 in a test Supabase project.
5. Create at least one organization, profile, role, permissions and user-role assignment.
6. Configure document sequences for REQUISITION and PURCHASE_ORDER.
7. Install dependencies with `npm install`.
8. Start with `npm run dev`.

## Security

Do not place a Supabase secret/service-role key in `NEXT_PUBLIC_*` variables. The browser is intended to use the publishable key and rely on RLS.

## Next build step

Complete FYNEXO Budget and FYNEXO Procure end-to-end:

- live budget list
- create/edit budget line
- initial budget posting
- requisition wizard
- budget availability checks
- lock acquisition + heartbeat UI
- workflow/approval screen
- transaction timeline

## Migration 0003 hardening

The bundled `0003_controls_api_hardening.sql` adds:

- organization memberships for users who can access more than one organization
- child-table RLS policies
- security-invoker financial views
- commitment-to-obligation conversion without double-counting available budget
- obligation-to-expenditure conversion on payment
- safe public RPC wrappers for authenticated application calls
- explicit RPC grants/revocations
