import { getFirstEntryByState, getProfile, listAllEntries } from "@/db/repository";
import { deriveIdentityReadiness, type IdentityReadiness } from "@/lib/identity-readiness";
import type { Entry } from "@/lib/types";
import { EntryActions } from "./_components/EntryActions";
import { OwnerAccessState, OwnerShell } from "./_components/OwnerShell";
import { requireOwnerPage } from "./owner-access";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const access = await requireOwnerPage("/owner");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const [profile, entries] = await Promise.all([getProfile(), listAllEntries()]);
  const readiness = deriveIdentityReadiness(profile);
  const [firstDraft, firstPublished] = readiness.state === "complete"
    ? await Promise.all([
        getFirstEntryByState("draft"),
        getFirstEntryByState("published"),
      ])
    : [null, null];
  const firstUpdate = deriveFirstUpdateJourney(readiness, firstDraft, firstPublished);
  const published = entries.filter((entry) => entry.state === "published").length;
  const primaryAction = dashboardPrimaryAction(readiness, firstUpdate);
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
          <p>{dashboardIntroduction(readiness.state, firstUpdate)}</p>
        </div>
        <a className="button" href={primaryAction.href}>
          {primaryAction.label}
        </a>
      </header>

      <IdentityReadinessPanel readiness={readiness} />
      <FirstUpdateJourneyPanel journey={firstUpdate} />

      <section className="owner-summary" aria-label="Presence summary">
        <Summary label="Identity" value={readiness.state === "complete" ? "Ready" : readiness.state === "incomplete" ? "Incomplete" : "Not started"} />
        <Summary label="Published" value={String(published)} />
        <Summary label="Drafts" value={String(entries.length - published)} />
      </section>

      <section className="owner-section" aria-labelledby="owner-entries-title">
        <div className="owner-section-heading">
          <div><p className="eyebrow">Local content</p><h2 id="owner-entries-title">Updates</h2></div>
          {entries.length ? <a className="text-link" href="/owner/entries/new">Create update</a> : null}
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
                <EntryActions id={entry.id} state={entry.state} label={entry.title ?? entry.body.slice(0, 90)} />
              </article>
            ))}
          </div>
        ) : (
          <div className="owner-empty">
            <h3>Nothing to manage yet</h3>
            <p>Create a draft, shape it privately, and publish it when it is ready.</p>
          </div>
        )}
      </section>
    </OwnerShell>
  );
}

type FirstUpdateJourney =
  | { state: "identity" }
  | { state: "empty" }
  | { state: "draft"; entry: Entry }
  | { state: "published"; entry: Entry };

function deriveFirstUpdateJourney(
  readiness: IdentityReadiness,
  firstDraft: Entry | null,
  firstPublished: Entry | null,
): FirstUpdateJourney {
  if (readiness.state !== "complete") return { state: "identity" };
  if (firstPublished) return { state: "published", entry: firstPublished };
  return firstDraft ? { state: "draft", entry: firstDraft } : { state: "empty" };
}

function FirstUpdateJourneyPanel({ journey }: { journey: FirstUpdateJourney }) {
  if (journey.state === "identity") return null;

  const content = firstUpdateContent(journey);
  return (
    <section
      className="identity-readiness identity-readiness-complete first-update-journey"
      aria-labelledby="first-update-journey-title"
    >
      <div>
        <p className="eyebrow">First update</p>
        <h2 id="first-update-journey-title">{content.title}</h2>
        <p>{content.message}</p>
      </div>
      {journey.state === "published" ? (
        <div className="identity-readiness-actions">
          <a className="text-link" href={`/entries/${journey.entry.id}`}>Open first update permalink</a>
        </div>
      ) : journey.state === "empty" ? (
        <div className="identity-readiness-actions">
          <a className="text-link" href="/">Preview public presence</a>
        </div>
      ) : null}
    </section>
  );
}

function firstUpdateContent(journey: Exclude<FirstUpdateJourney, { state: "identity" }>): {
  title: string;
  message: string;
} {
  if (journey.state === "empty") {
    return {
      title: "Create a private first draft",
      message: "Your Identity is ready. Start one update and review it privately before choosing to publish.",
    };
  }
  if (journey.state === "draft") {
    return {
      title: "Resume your saved draft",
      message: "This draft is stored in this presence and remains private until you publish it.",
    };
  }
  return {
    title: "Your first update is public",
    message: "The published update is visible on your public presence and at its stable permalink.",
  };
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
        {readiness.canonicalUrl ? (
          <p className="effective-canonical">
            <span>Effective public URL · {readiness.canonicalSource === "runtime" ? "protected Site setting" : "saved Identity fallback"}</span>
            <code>{readiness.canonicalUrl}</code>
          </p>
        ) : null}
      </div>
      <div className="identity-readiness-actions">
        <label htmlFor="identity-progress">Identity readiness: {progress} of 2 requirements complete</label>
        <progress id="identity-progress" max="2" value={progress}>{progress} of 2</progress>
        <a className="text-link" href="/owner/profile">{complete ? "Review Identity settings" : "Continue Identity setup"}</a>
      </div>
    </section>
  );
}

function dashboardIntroduction(
  state: IdentityReadiness["state"],
  firstUpdate: FirstUpdateJourney,
): string {
  if (firstUpdate.state === "empty") return "Identity is ready. Create one private draft, review it, and publish only when it is ready.";
  if (firstUpdate.state === "draft") return "Your first draft is saved in this presence and ready to resume without starting over.";
  if (firstUpdate.state === "published") return "Your first public update is complete. Preview it while the existing update controls remain available below.";
  if (state === "incomplete") return "Saved Identity content is available, but public links need a valid canonical URL before this presence is ready.";
  return "The Site should remain private until the sole owner and public Identity are configured and tested.";
}

function dashboardPrimaryAction(
  readiness: IdentityReadiness,
  firstUpdate: FirstUpdateJourney,
): { href: string; label: string } {
  if (firstUpdate.state === "empty") return { href: "/owner/entries/new", label: "Create first draft" };
  if (firstUpdate.state === "draft") {
    return { href: `/owner/entries/${firstUpdate.entry.id}`, label: "Resume first draft" };
  }
  if (firstUpdate.state === "published") return { href: "/", label: "Preview public presence" };
  return readiness.state === "incomplete"
    ? { href: "/owner/profile", label: "Finish identity" }
    : { href: "/owner/profile", label: "Set up identity" };
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
