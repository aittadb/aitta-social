import { env } from "cloudflare:workers";

export type RuntimeSettings = {
  ownerEmail: string | null;
  canonicalUrl: string | null;
  hubChallenge: string | null;
};

type SiteEnv = {
  AITTA_SOCIAL_OWNER_EMAIL?: string;
  AITTA_SOCIAL_CANONICAL_URL?: string;
  AITTA_SOCIAL_HUB_CHALLENGE?: string;
  AITTA_SOCIAL_DEV_AUTH_EMAIL?: string;
};

export function getRuntimeSettings(): RuntimeSettings {
  const values = env as unknown as SiteEnv;
  return {
    ownerEmail: optional(values.AITTA_SOCIAL_OWNER_EMAIL),
    canonicalUrl: optional(values.AITTA_SOCIAL_CANONICAL_URL),
    hubChallenge: optional(values.AITTA_SOCIAL_HUB_CHALLENGE),
  };
}

export function getDevelopmentAuthEmail(): string | null {
  if (!import.meta.env.DEV) return null;
  return optional((env as unknown as SiteEnv).AITTA_SOCIAL_DEV_AUTH_EMAIL);
}

function optional(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
