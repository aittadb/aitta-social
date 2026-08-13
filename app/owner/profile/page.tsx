import { getProfile } from "@/db/repository";
import { deriveIdentityReadiness } from "@/lib/identity-readiness";
import type { ProfileInput } from "@/lib/types";
import { normalizeCanonicalUrl } from "@/lib/validation";
import { OwnerAccessState, OwnerShell } from "../_components/OwnerShell";
import { requireOwnerPage } from "../owner-access";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfileSettings() {
  const access = await requireOwnerPage("/owner/profile");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const profile = await getProfile();
  const readiness = deriveIdentityReadiness(profile);
  const storedCanonicalValue = profile?.canonicalUrl ?? "";
  const storedCanonical = normalizedCanonicalOrNull(storedCanonicalValue);
  const canonicalDefault = storedCanonical ?? readiness.canonicalUrl ?? "";
  const canonicalDefaultSource = storedCanonical
    ? "stored"
    : readiness.canonicalSource === "runtime"
      ? "runtime-substitution"
      : storedCanonicalValue.length > 0
        ? "invalid-stored-omitted"
        : "empty";
  const formProfile: ProfileInput | null = profile ? {
    displayName: profile.displayName,
    shortDescription: profile.shortDescription,
    introduction: profile.introduction,
    location: profile.location,
    website: profile.website,
    externalLinks: profile.externalLinks.map(({ label, url }) => ({ label, url })),
    canonicalUrl: canonicalDefault,
    accentColor: profile.accentColor,
    density: profile.density,
    hidePoweredBy: profile.hidePoweredBy,
  } : null;
  return (
    <OwnerShell current="profile">
      <header className="owner-page-header compact-header">
        <div><p className="eyebrow">Public profile</p><h1>Identity</h1><p>Set up the outward profile this Aitta controls. Only a successful save changes its Identity or readiness.</p></div>
      </header>
      <ProfileForm
        profile={formProfile}
        canonicalDefault={canonicalDefault}
        canonicalDefaultSource={canonicalDefaultSource}
        readiness={readiness}
      />
    </OwnerShell>
  );
}

function normalizedCanonicalOrNull(value: string | null): string | null {
  if (!value) return null;
  try {
    return normalizeCanonicalUrl(value);
  } catch {
    return null;
  }
}
