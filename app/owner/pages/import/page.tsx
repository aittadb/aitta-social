import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { PageImportForm } from "./PageImportForm";
import styles from "@/app/owner/page.module.css";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const access = await requireOwnerPage("/owner/pages/import");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const copy = messages.ui.owner.import;

  return (
    <OwnerShell current="pages">
      <header className={`${styles.ownerPageHeader} ${styles.compactHeader}`}>
        <div>
          <p className="eyebrow">{copy.websiteContent}</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>
      <PageImportForm copy={copy} />
    </OwnerShell>
  );
}
