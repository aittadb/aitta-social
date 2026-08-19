import { getProfile } from "@/db/repository";
import { deriveIdentityReadiness } from "@/lib/identity-readiness";
import type { ProfileInput } from "@/lib/types";
import { normalizeCanonicalUrl } from "@/lib/validation";
import { OwnerAccessState, OwnerShell } from "../_components/OwnerShell";
import { requireOwnerPage } from "../owner-access";
import { ProfileForm } from "./ProfileForm";
import styles from "@/app/owner/page.module.css";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProfileSettings() {
  const access = await requireOwnerPage("/owner/profile");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const copy = messages.ui.owner.profile;

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
      <header className={`${styles.ownerPageHeader} ${styles.compactHeader}`}>
        <div>
          <p className="eyebrow">{copy.headerProfile}</p>
          <h1>{copy.identity}</h1>
          <p>{copy.identitySetupDescription}</p>
        </div>
      </header>
      <ProfileForm
        profile={formProfile}
          canonicalDefault={canonicalDefault}
        canonicalDefaultSource={canonicalDefaultSource}
        readiness={readiness}
        copy={copy}
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
