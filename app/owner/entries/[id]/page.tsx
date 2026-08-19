import { notFound } from "next/navigation";
import { getEntry } from "@/db/repository";
import { EntryActions } from "../../_components/EntryActions";
import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { EntryForm } from "../EntryForm";
import styles from "@/app/owner/page.module.css";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireOwnerPage(`/owner/entries/${id}`);
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const copy = {
    updatedLabel: messages.entry.destination,
    editTitle: messages.ui.owner.entryForm.editHeading,
    intro: messages.ui.owner.entryForm.editIntro,
    sourceKindPublic: messages.ui.owner.entryForm.sourceKindPublic,
    sourceKindPrivate: messages.ui.owner.entryForm.sourceKindPrivate,
  };
  const entry = await getEntry(id);
  if (!entry) notFound();
  const sourceLabel = entry.state === "published" ? copy.sourceKindPublic : copy.sourceKindPrivate;
  return (
    <OwnerShell current="entries">
      <header className={`${styles.ownerPageHeader} ${styles.compactHeader}`}>
        <div>
          <p className="eyebrow">{sourceLabel}</p>
          <h1>{copy.editTitle}</h1>
          <p>{messages.ui.owner.entryForm.editIntro}</p>
        </div>
        <EntryActions id={entry.id} state={entry.state} label={entry.title ?? entry.body.slice(0, 90)} copy={messages.ui.owner.actions} />
      </header>
      <EntryForm entry={entry} copy={messages.ui.owner.entryForm} />
    </OwnerShell>
  );
}
