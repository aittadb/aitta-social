import { getProfile } from "@/db/repository";
import { getRuntimeSettings } from "@/lib/runtime";
import { OwnerAccessState, OwnerShell } from "../_components/OwnerShell";
import { requireOwnerPage } from "../owner-access";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfileSettings() {
  const access = await requireOwnerPage("/owner/profile");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const profile = await getProfile();
  const canonicalDefault = getRuntimeSettings().canonicalUrl ?? "";
  return (
    <OwnerShell displayName={access.user.displayName} current="profile">
      <header className="owner-page-header compact-header">
        <div><p className="eyebrow">Public presence</p><h1>Identity</h1><p>Keep the public presentation specific, concise, and recognizably yours.</p></div>
      </header>
      <ProfileForm profile={profile} canonicalDefault={canonicalDefault} />
    </OwnerShell>
  );
}
