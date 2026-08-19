import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { EntryForm } from "../EntryForm";
import styles from "@/app/owner/page.module.css";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  const access = await requireOwnerPage("/owner/entries/new");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const copy = messages.ui.owner.entryForm;
  const headerClass = styles["owner-page-header"] ?? styles.ownerPageHeader;
  const compactHeaderClass = styles["compact-header"] ?? styles.compactHeader;
  return (
    <OwnerShell current="entries">
      <header className={`${headerClass} ${compactHeaderClass}`}>
        <div>
          <p className="eyebrow">{messages.ui.owner.shell.privateWorkspace}</p>
          <h1>{copy.createHeading}</h1>
          <p>{copy.createIntro}</p>
        </div>
      </header>
      <EntryForm entry={null} copy={copy} />
    </OwnerShell>
  );
}
