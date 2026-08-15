import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { EntryForm } from "../EntryForm";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  const access = await requireOwnerPage("/owner/entries/new");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  return (
    <OwnerShell current="entries">
      <header className={`${styles.ownerPageHeader} ${styles.compactHeader}`}><div><p className="eyebrow">Private workspace</p><h1>New update</h1><p>Start with the text. Saving creates a private draft in this Aitta so you can review it before publication.</p></div></header>
      <EntryForm entry={null} />
    </OwnerShell>
  );
}
