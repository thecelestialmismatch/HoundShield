/**
 * SAML/SSO Support — Okta, Azure AD, JumpCloud
 *
 * Kaelus uses Supabase Auth as the identity backbone.
 * Supabase Enterprise exposes SAML 2.0 via supabase.auth.signInWithSSO().
 *
 * This module provides:
 *   1. Org → IdP resolution (which SAML provider does this org use?)
 *   2. SSO initiation — build the redirect URL
 *   3. Metadata endpoint helper — returns SP metadata XML for IdP configuration
 *   4. Domain-based auto-discovery — route users to the right IdP by email domain
 *
 * Supabase table: sso_configs
 *   id           UUID PRIMARY KEY
 *   org_id       TEXT NOT NULL UNIQUE
 *   provider     TEXT NOT NULL  -- 'okta' | 'azure_ad' | 'jumpcloud' | 'generic'
 *   domain       TEXT NOT NULL  -- e.g. "acme.com" (used for auto-discovery)
 *   metadata_url TEXT           -- IdP metadata URL (for auto-sync)
 *   enabled      BOOLEAN DEFAULT true
 *   created_at   TIMESTAMPTZ DEFAULT NOW()
 */

export type SamlProvider = "okta" | "azure_ad" | "jumpcloud" | "generic";

export interface SsoConfig {
  id: string;
  org_id: string;
  provider: SamlProvider;
  domain: string;
  metadata_url?: string;
  enabled: boolean;
}

export interface SsoInitResult {
  /** Redirect the browser to this URL to begin SSO flow */
  redirectUrl: string;
  /** Supabase SSO provider ID used (for logging) */
  providerId: string;
}

// ---------------------------------------------------------------------------
// Domain → SSO config resolution (with 5-min in-memory cache)
// ---------------------------------------------------------------------------

interface DomainCache {
  config: SsoConfig | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const domainCache = new Map<string, DomainCache>();

/**
 * Resolve an email domain to its SSO config.
 * Returns null if the domain has no SSO configured.
 */
export async function resolveSsoByDomain(
  emailDomain: string
): Promise<SsoConfig | null> {
  const domain = emailDomain.toLowerCase().trim();

  const cached = domainCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.config;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sso_configs")
      .select("*")
      .eq("domain", domain)
      .eq("enabled", true)
      .maybeSingle();

    if (error) {
      console.error("[saml] resolveSsoByDomain error:", error.message);
    }

    const config = (data as SsoConfig | null) ?? null;
    domainCache.set(domain, { config, expiresAt: Date.now() + CACHE_TTL_MS });
    return config;
  } catch {
    return null;
  }
}

/**
 * Invalidate the domain cache after config changes.
 */
export function invalidateSsoCache(domain: string): void {
  domainCache.delete(domain.toLowerCase().trim());
}

// ---------------------------------------------------------------------------
// SSO initiation
// ---------------------------------------------------------------------------

/**
 * Begin the SAML SSO flow for a given email address.
 *
 * How it works:
 *   1. Extract domain from email
 *   2. Look up SSO config for that domain
 *   3. Call supabase.auth.signInWithSSO() to get the redirect URL
 *   4. Return the redirect URL to the caller (API route sends 302)
 *
 * @param email       — user's work email
 * @param redirectTo  — URL to return to after SSO completes (e.g. /dashboard)
 */
export async function initiateSso(
  email: string,
  redirectTo: string
): Promise<SsoInitResult | null> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  const config = await resolveSsoByDomain(domain);
  if (!config) return null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: { redirectTo },
    });

    if (error || !data?.url) {
      console.error("[saml] signInWithSSO error:", error?.message);
      return null;
    }

    return {
      redirectUrl: data.url,
      providerId: config.id,
    };
  } catch (err) {
    console.error("[saml] initiateSso unhandled:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider display helpers
// ---------------------------------------------------------------------------

const PROVIDER_LABELS: Record<SamlProvider, string> = {
  okta:       "Okta",
  azure_ad:   "Azure Active Directory",
  jumpcloud:  "JumpCloud",
  generic:    "SAML 2.0",
};

const PROVIDER_SETUP_URLS: Record<SamlProvider, string> = {
  okta:      "https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_saml.htm",
  azure_ad:  "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/add-application-portal-setup-sso",
  jumpcloud: "https://jumpcloud.com/support/configure-sso-with-saml",
  generic:   "https://kaelus.online/docs/sso",
};

export function getProviderLabel(provider: SamlProvider): string {
  return PROVIDER_LABELS[provider] ?? "SAML 2.0";
}

export function getProviderSetupUrl(provider: SamlProvider): string {
  return PROVIDER_SETUP_URLS[provider] ?? "https://kaelus.online/docs/sso";
}

// ---------------------------------------------------------------------------
// SP Metadata XML builder (used by IdP admin to configure Kaelus as SP)
// ---------------------------------------------------------------------------

/**
 * Generate a minimal SAML 2.0 Service Provider metadata XML.
 * The IdP admin uploads this XML when configuring the Kaelus application.
 *
 * @param baseUrl  — e.g. "https://kaelus.online"
 * @param entityId — SP Entity ID (defaults to baseUrl)
 */
export function buildSpMetadataXml(baseUrl: string, entityId?: string): string {
  const id = entityId ?? baseUrl;
  const acsUrl = `${baseUrl}/api/auth/saml/callback`;
  const sloUrl = `${baseUrl}/api/auth/saml/logout`;

  // NOTE: In production, include X.509 signing/encryption certificate here.
  // Supabase manages the certificate automatically for Supabase-hosted SAML.
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"`,
    `  entityID="${escapeXml(id)}">`,
    `  <md:SPSSODescriptor`,
    `    AuthnRequestsSigned="false"`,
    `    WantAssertionsSigned="true"`,
    `    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">`,
    `    <md:NameIDFormat>`,
    `      urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`,
    `    </md:NameIDFormat>`,
    `    <md:AssertionConsumerService`,
    `      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"`,
    `      Location="${escapeXml(acsUrl)}"`,
    `      index="1" isDefault="true"/>`,
    `    <md:SingleLogoutService`,
    `      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"`,
    `      Location="${escapeXml(sloUrl)}"/>`,
    `  </md:SPSSODescriptor>`,
    `</md:EntityDescriptor>`,
  ].join("\n");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
