# Backend DB Config Guardrails

These rules are intentional. Do not "simplify" them away.

1. Runtime Postgres settings must come from environment variables only:
   - `ConnectionStrings__PostgresConnection` OR `Postgres__*`
   - `ConnectionStrings__IdentityConnection` OR `IdentityPostgres__*`
2. In non-development environments, do not read DB connection strings from `appsettings.json`.
3. Keep identity fallback to app Postgres connection unless `IdentityPostgres__*` is explicitly set.
4. If `.env` is not present, use process environment variables. Do not silently switch to `appsettings.json`.
5. If you change connection-resolution code in `Program.cs`, verify startup logs still print:
   - `App Postgres connection source: ...`
   - `Identity Postgres connection source: ...`

Why: this prevents accidental deployment to stale LAN hosts from committed config files.
