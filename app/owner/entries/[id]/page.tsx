import { notFound } from "next/navigation";
import { getEntry } from "@/db/repository";
import { EntryActions } from "../../_components/EntryActions";
import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { EntryForm } from "../EntryForm";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireOwnerPage(`/owner/entries/${id}`);
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const entry = await getEntry(id);
  if (!entry) notFound();
  return (
    <OwnerShell displayName={access.user.displayName} current="entries">
      <header className="owner-page-header compact-header">
        <div><p className="eyebrow">{entry.state}</p><h1>Edit update</h1><p>Every save and publication change is checked against the configured owner on the server.</p></div>
        <EntryActions id={entry.id} state={entry.state} label={entry.title ?? entry.body.slice(0, 90)} />
      </header>
      <EntryForm entry={entry} />
    </OwnerShell>
  );
}
