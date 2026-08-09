import { getProfile } from "@/db/repository";
import { getRuntimeSettings } from "@/lib/runtime";
import type { ProfileInput } from "@/lib/types";
import { OwnerAccessState, OwnerShell } from "../_components/OwnerShell";
import { requireOwnerPage } from "../owner-access";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfileSettings() {
  const access = await requireOwnerPage("/owner/profile");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const profile = await getProfile();
  const formProfile: ProfileInput | null = profile ? {
    displayName: profile.displayName,
    shortDescription: profile.shortDescription,
    introduction: profile.introduction,
    location: profile.location,
    website: profile.website,
    externalLinks: profile.externalLinks.map(({ label, url }) => ({ label, url })),
    canonicalUrl: profile.canonicalUrl,
    accentColor: profile.accentColor,
    density: profile.density,
    hidePoweredBy: profile.hidePoweredBy,
  } : null;
  const canonicalDefault = getRuntimeSettings().canonicalUrl ?? "";
  return (
    <OwnerShell displayName={access.user.displayName} current="profile">
      <header className="owner-page-header compact-header">
        <div><p className="eyebrow">Public presence</p><h1>Identity</h1><p>Keep the public presentation specific, concise, and recognizably yours.</p></div>
      </header>
      <ProfileForm profile={formProfile} canonicalDefault={canonicalDefault} />
    </OwnerShell>
  );
}
