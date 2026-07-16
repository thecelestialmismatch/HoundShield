/**
 * Shared browser-event names for the local (on-device) assessment store.
 * Lives in its own module so light client components can subscribe without
 * pulling the zod-validated storage layer into their bundle.
 */

/** Fired on `window` whenever locally-stored assessment responses change. */
export const ASSESSMENT_UPDATED_EVENT = 'hs-assessment-updated';
