import { getProfile, listAllEntries } from "@/db/repository";
import { deriveIdentityReadiness, type IdentityReadiness } from "@/lib/identity-readiness";
import { EntryActions } from "./_components/EntryActions";
import { OwnerAccessState, OwnerShell } from "./_components/OwnerShell";
import { requireOwnerPage } from "./owner-access";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const access = await requireOwnerPage("/owner");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const [profile, entries] = await Promise.all([getProfile(), listAllEntries()]);
  const readiness = deriveIdentityReadiness(profile);
  const published = entries.filter((entry) => entry.state === "published").length;
  const heading = readiness.state === "complete"
    ? profile?.displayName
    : readiness.state === "incomplete"
      ? "Finish your identity"
      : "Complete your identity";
  return (
    <OwnerShell displayName={access.user.displayName} current="overview">
      <header className="owner-page-header">
        <div>
          <p className="eyebrow">Your presence</p>
          <h1>{heading}</h1>
          <p>{dashboardIntroduction(readiness.state)}</p>
        </div>
        <a className="button" href={readiness.state === "complete" ? "/" : "/owner/profile"}>
          {readiness.state === "complete" ? "Preview public presence" : readiness.state === "incomplete" ? "Finish identity" : "Set up identity"}
        </a>
      </header>

      <IdentityReadinessPanel readiness={readiness} />

      <section className="owner-summary" aria-label="Presence summary">
        <Summary label="Identity" value={readiness.state === "complete" ? "Ready" : readiness.state === "incomplete" ? "Incomplete" : "Not started"} />
        <Summary label="Published" value={String(published)} />
        <Summary label="Drafts" value={String(entries.length - published)} />
      </section>

      <section className="owner-section" aria-labelledby="owner-entries-title">
        <div className="owner-section-heading">
          <div><p className="eyebrow">Local content</p><h2 id="owner-entries-title">Updates</h2></div>
          <a className="text-link" href="/owner/entries/new">Create update</a>
        </div>
        {entries.length ? (
          <div className="owner-entry-list">
            {entries.map((entry) => (
              <article className="owner-entry-row" key={entry.id}>
                <div className="owner-entry-copy">
                  <div className="entry-meta"><span>{entry.kind}</span><span className={`state state-${entry.state}`}>{entry.state}</span></div>
                  <h3><a href={`/owner/entries/${entry.id}`}>{entry.title ?? entry.body.slice(0, 90)}</a></h3>
                  <p>Updated {formatDate(entry.updatedAt)}</p>
                </div>
                <EntryActions id={entry.id} state={entry.state} />
              </article>
            ))}
          </div>
        ) : (
          <div className="owner-empty">
            <h3>Nothing to manage yet</h3>
            <p>Create a draft, shape it privately, and publish it when it is ready.</p>
            <a className="button" href="/owner/entries/new">Create the first draft</a>
          </div>
        )}
      </section>
    </OwnerShell>
  );
}

function IdentityReadinessPanel({ readiness }: { readiness: IdentityReadiness }) {
  const complete = readiness.state === "complete";
  const progress = readiness.requirementsComplete;
  return (
    <section className={`identity-readiness identity-readiness-${readiness.state}`} aria-labelledby="identity-readiness-title">
      <div>
        <p className="eyebrow">Identity setup</p>
        <h2 id="identity-readiness-title">{complete ? "Ready for public review" : readiness.state === "incomplete" ? "Canonical URL needed" : "Start with the public Identity"}</h2>
        <p>{readinessMessage(readiness)}</p>
        {readiness.canonicalUrl ? <p className="effective-canonical"><span>Effective public URL</span><code>{readiness.canonicalUrl}</code></p> : null}
      </div>
      <div className="identity-readiness-actions">
        <label htmlFor="identity-progress">Identity readiness: {progress} of 2 requirements complete</label>
        <progress id="identity-progress" max="2" value={progress}>{progress} of 2</progress>
        <a className="text-link" href="/owner/profile">{complete ? "Review Identity settings" : "Continue Identity setup"}</a>
      </div>
    </section>
  );
}

function dashboardIntroduction(state: IdentityReadiness["state"]): string {
  if (state === "complete") return "Review Identity, drafts, publication state, and the public presence from one focused workspace.";
  if (state === "incomplete") return "Saved Identity content is available, but public links need a valid canonical URL before this presence is ready.";
  return "The Site should remain private until the sole owner and public Identity are configured and tested.";
}

function readinessMessage(readiness: IdentityReadiness): string {
  if (readiness.state === "fresh") {
    return readiness.canonicalSource === "runtime"
      ? "A protected canonical URL is ready. Add and save the public Identity to complete setup."
      : "Add the public Identity and a canonical HTTPS URL. Unsaved form work is not a durable setup state.";
  }
  if (readiness.state === "incomplete") {
    return "The stored Identity is preserved, but no valid configured canonical URL is available. Update Identity to restore public canonical links.";
  }
  return readiness.canonicalSource === "runtime"
    ? "Identity is saved. Public links use the normalized protected runtime canonical URL."
    : "Identity is saved. Public links use the normalized canonical URL stored with Identity.";
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
