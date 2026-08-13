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
    <OwnerShell current="overview">
      <header className="owner-page-header">
        <div>
          <p className="eyebrow">Your Aitta</p>
          <h1>{heading}</h1>
          <p>{dashboardIntroduction(readiness.state, firstUpdate)}</p>
        </div>
        <a className="button" href={primaryAction.href}>
          {primaryAction.label}
        </a>
      </header>

      <OwnerNextStep readiness={readiness} journey={firstUpdate} />

      <section className="owner-summary" aria-label="Aitta summary">
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

function OwnerNextStep({
  readiness,
  journey,
}: {
  readiness: IdentityReadiness;
  journey: FirstUpdateJourney;
}) {
  const content = nextStepContent(readiness, journey);
  const progress = readiness.requirementsComplete;
  return (
    <section
      className={`owner-next-step owner-next-step-${readiness.state}`}
      aria-labelledby="owner-next-step-title"
    >
      <div>
        <p className="eyebrow">Next step · {content.status}</p>
        <h2 id="owner-next-step-title">{content.title}</h2>
        <p>{content.message}</p>
        {readiness.canonicalUrl ? (
          <p className="effective-canonical">
            <span>Public URL · {readiness.canonicalSource === "runtime" ? "protected Site setting" : "saved Identity"}</span>
            <code>{readiness.canonicalUrl}</code>
          </p>
        ) : null}
      </div>
      <div className="owner-next-step-progress">
        <label htmlFor="identity-progress">Identity readiness: {progress} of 2 requirements complete</label>
        <progress id="identity-progress" max="2" value={progress}>{progress} of 2</progress>
      </div>
    </section>
  );
}

function nextStepContent(readiness: IdentityReadiness, journey: FirstUpdateJourney): {
  status: string;
  title: string;
  message: string;
} {
  if (journey.state === "identity") {
    return {
      status: readiness.state === "incomplete" ? "Identity incomplete" : "Identity not started",
      title: readiness.state === "incomplete" ? "Add a canonical URL" : "Set up your public Identity",
      message: readinessMessage(readiness),
    };
  }
  if (journey.state === "empty") {
    return {
      status: "Identity ready",
      title: "Create your first update",
      message: "Start with a private draft. Nothing becomes public until you publish it.",
    };
  }
  if (journey.state === "draft") {
    return {
      status: "Draft saved privately",
      title: "Continue your first draft",
      message: "Your work is stored in this Aitta and remains private until you publish it.",
    };
  }
  return {
    status: "Published",
    title: "Your first update is public",
    message: "It is visible on your public Aitta. You can keep managing every update below.",
  };
}

function dashboardIntroduction(
  state: IdentityReadiness["state"],
  firstUpdate: FirstUpdateJourney,
): string {
  if (firstUpdate.state === "empty") return "Identity is ready. Begin with one private draft.";
  if (firstUpdate.state === "draft") return "Continue your private draft or manage the updates below.";
  if (firstUpdate.state === "published") return "Review your public Aitta or manage the updates below.";
  if (state === "incomplete") return "Finish Identity before creating your first public update.";
  return "Set up Identity before creating your first public update.";
}

function dashboardPrimaryAction(
  readiness: IdentityReadiness,
  firstUpdate: FirstUpdateJourney,
): { href: string; label: string } {
  if (firstUpdate.state === "empty") return { href: "/owner/entries/new", label: "Create first draft" };
  if (firstUpdate.state === "draft") {
    return { href: `/owner/entries/${firstUpdate.entry.id}`, label: "Resume first draft" };
  }
  if (firstUpdate.state === "published") return { href: "/", label: "Preview public Aitta" };
  return readiness.state === "incomplete"
    ? { href: "/owner/profile", label: "Finish identity" }
    : { href: "/owner/profile", label: "Set up identity" };
}

function readinessMessage(readiness: IdentityReadiness): string {
  if (readiness.state === "fresh") {
    return readiness.canonicalSource === "runtime"
      ? "A protected public URL is ready. Add and save the public Identity to finish setup."
      : "Add the public Identity and a canonical HTTPS URL.";
  }
  if (readiness.state === "incomplete") {
    return "Your saved Identity needs a valid canonical HTTPS URL for public links.";
  }
  return readiness.canonicalSource === "runtime"
    ? "Identity is ready and public links use the protected Site URL."
    : "Identity is ready and public links use its saved canonical URL.";
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
