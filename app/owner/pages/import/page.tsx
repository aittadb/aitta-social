import { OwnerAccessState, OwnerShell } from "../../_components/OwnerShell";
import { requireOwnerPage } from "../../owner-access";
import { PageImportForm } from "./PageImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const access = await requireOwnerPage("/owner/pages/import");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  return (
    <OwnerShell current="pages">
      <header className="owner-page-header compact-header">
        <div>
          <p className="eyebrow">Website content</p>
          <h1>Import a page</h1>
          <p>Normalize one page-body fragment and inspect the safe result. This preview stores and publishes nothing.</p>
        </div>
      </header>
      <PageImportForm />
    </OwnerShell>
  );
}
