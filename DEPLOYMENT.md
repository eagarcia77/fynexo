# FYNEXO Deployment — GitHub + Render

## GitHub target

Repository: `eagarcia77/fynexo`
Branch: `main`

## Render

- Service name: `fynexo`
- Runtime: Node
- Region: Virginia
- Build: `npm install && npm run build`
- Start: `npm start`
- Health check: `/api/health`
- Auto deploy: enabled

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not add Supabase service-role / secret keys to `NEXT_PUBLIC_*` variables.

## Database

Apply migrations in order:

1. `0001_fynexo_initial.sql`
2. `0002_financial_transactions.sql`
3. `0003_controls_api_hardening.sql`
