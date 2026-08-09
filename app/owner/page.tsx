import { getProfile, listAllEntries } from "@/db/repository";
import { EntryActions } from "./_components/EntryActions";
import { OwnerAccessState, OwnerShell } from "./_components/OwnerShell";
import { requireOwnerPage } from "./owner-access";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const access = await requireOwnerPage("/owner");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const [profile, entries] = await Promise.all([getProfile(), listAllEntries()]);
  const published = entries.filter((entry) => entry.state === "published").length;
  return (
    <OwnerShell displayName={access.user.displayName} current="overview">
      <header className="owner-page-header">
        <div>
          <p className="eyebrow">Your presence</p>
          <h1>{profile ? profile.displayName : "Complete your identity"}</h1>
          <p>{profile ? "Review drafts, publication state, and the public presence from one focused workspace." : "The Site should remain private until the sole owner and this identity are configured and tested."}</p>
        </div>
        <a className="button" href={profile ? "/owner/entries/new" : "/owner/profile"}>
          {profile ? "Create update" : "Set up identity"}
        </a>
      </header>

      <section className="owner-summary" aria-label="Presence summary">
        <Summary label="Identity" value={profile ? "Ready" : "Needed"} />
        <Summary label="Published" value={String(published)} />
        <Summary label="Drafts" value={String(entries.length - published)} />
      </section>

      <section className="owner-section" aria-labelledby="owner-entries-title">
        <div className="owner-section-heading">
          <div><p className="eyebrow">Local content</p><h2 id="owner-entries-title">Updates</h2></div>
          <a className="text-link" href="/owner/entries/new">New update</a>
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

function Summary({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
