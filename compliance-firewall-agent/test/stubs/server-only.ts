/**
 * Stub for the `server-only` package under Vitest.
 *
 * `import "server-only"` is a compile-time poison pill: Next.js resolves it to a
 * module that throws if it is ever pulled into a Client Component bundle. It is
 * not a real installed package — Next aliases it inside its own compiler — so
 * Vite cannot resolve the bare specifier and every test that touches a server
 * module (lib/auth/session.ts, lib/dashboard/*, every route handler) failed at
 * import with "Does the file exist?".
 *
 * Aliased in vitest.config.ts. Empty on purpose: under test there is no client
 * bundle to protect, so the guard has nothing to do and must not throw.
 */
export {}
