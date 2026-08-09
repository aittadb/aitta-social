import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { EntryForm } from "../EntryForm";

export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  const access = await requireOwnerPage("/owner/entries/new");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  return (
    <OwnerShell displayName={access.user.displayName} current="entries">
      <header className="owner-page-header compact-header"><div><p className="eyebrow">Private until published</p><h1>New entry</h1><p>Create one flexible piece of text. You can publish it from the overview after reviewing the draft.</p></div></header>
      <EntryForm entry={null} />
    </OwnerShell>
  );
}
