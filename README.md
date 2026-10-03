# Intranet

A pnpm/Turborepo workspace containing the Portal, Users (SSO and administration), Kuutio (meeting reservations), and Työaika (work time tracking).

## Local development

Requires Node.js 22+, pnpm 10, and MongoDB.

1. Run `pnpm install`.
2. Copy each app's `.env.example` to `.env` and configure the values. The APIs require their own `.env` files. Keep service keys consistent with the Users service registrations.
3. Start MongoDB locally, or run `docker compose -f infra/docker-compose.yml up -d mongo`.
4. Run `pnpm --filter @intranet/users-api seed:demo` to register local services and create a local admin account. Its credentials are saved to `/tmp/intranet-demo-credentials.json`.
5. Run `pnpm dev`.

| App | Web | API |
| --- | --- | --- |
| Users | http://localhost:5171 | http://localhost:4001 |
| Portal | http://localhost:5172 | http://localhost:4002 |
| Kuutio | http://localhost:5175 | http://localhost:4003 |
| Työaika | http://localhost:5176 | http://localhost:4004 |

Run `pnpm build` to build the workspace. UI styles are shared in `packages/ui`.

## Portal

The dashboard supports clocking in and out, creating and cancelling Kuutio reservations, and managing personal skills. The work-time progress ring uses an eight-hour daily target. Personal skills currently persist in browser local storage.

## Configuration

Environment files and local credentials are excluded from Git. Example values are for local development; configure real secrets and email delivery before deploying. The demo seed script is restricted to local development databases.

Browser flow recordings and screenshots are available in `artifacts`; recording helpers are in `scripts`.
