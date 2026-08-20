/**
 * Shared across the snapshot components. Lives in its own module so
 * `InstantSnapshot` and `LeadCapture` agree on the vertical vocabulary without
 * either importing the other — the value also has to match the `vertical` enum
 * the `/api/report/snapshot-lead` zod schema accepts, and the Stripe checkout's
 * `REPORT_VERTICALS`.
 */
export type Vertical = "defense" | "healthcare" | "legal";
