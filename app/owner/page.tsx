import { getFirstEntryByState, getProfile, listAllEntries } from "@/db/repository";
import { deriveIdentityReadiness, type IdentityReadiness } from "@/lib/identity-readiness";
import type { Entry } from "@/lib/types";
import { EntryActions } from "./_components/EntryActions";
import { OwnerAccessState, OwnerShell } from "./_components/OwnerShell";
import { requireOwnerPage } from "./owner-access";
import styles from "./page.module.css";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const access = await requireOwnerPage("/owner");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;

  const locale = await getLocale();
  const messages = await getMessages(locale);
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
  const dashboardCopy = messages.ui.owner.dashboard;
  const nextStepCopy = messages.owner.nextStep;
  const primaryAction = dashboardPrimaryAction(readiness, firstUpdate, dashboardCopy);
  const heading = readiness.state === "complete"
    ? profile?.displayName ?? messages.ui.shared.aittaName
    : readiness.state === "incomplete"
      ? dashboardCopy.headingIncomplete
      : dashboardCopy.headingFresh;

  return (
    <OwnerShell current="overview">
      <header className="owner-page-header">
        <div>
          <p className="eyebrow">{messages.ui.owner.dashboard.yourAitta}</p>
          <h1>{heading}</h1>
          <p>{dashboardIntroduction(readiness.state, firstUpdate, {
            incompleteMessage: nextStepCopy.identityMessageIncomplete,
            readyMessage: dashboardCopy.readinessReadyIntro,
            freshMessage: nextStepCopy.identityMessageFresh,
          }, dashboardCopy)}</p>
        </div>
        <a className="button" href={primaryAction.href}>
          {primaryAction.label}
        </a>
      </header>

      <OwnerNextStep
        readiness={readiness}
        journey={firstUpdate}
        progressLabel={nextStepCopy.progressLabel}
        copy={dashboardCopy}
        progressSuffix={nextStepCopy.progressSuffix}
      />

      <section className={styles['owner-summary']} aria-label={dashboardCopy.yourAittaSummary}>
        <Summary label={dashboardCopy.summaryLabelIdentity} value={readiness.state === "complete" ? dashboardCopy.statusReady : readiness.state === "incomplete" ? dashboardCopy.statusIncomplete : dashboardCopy.statusNotStarted} />
        <Summary label={dashboardCopy.summaryLabelPublished} value={String(published)} />
        <Summary label={dashboardCopy.summaryLabelDrafts} value={String(entries.length - published)} />
      </section>

      <section className="owner-section" aria-labelledby="owner-entries-title">
        <div className={styles['owner-section-heading']}>
          <div>
            <p className="eyebrow">{dashboardCopy.localContent}</p>
            <h2 id="owner-entries-title">{messages.common.updates}</h2>
          </div>
          {entries.length ? <a className="text-link" href="/owner/entries/new">{dashboardCopy.createUpdate}</a> : null}
        </div>
        {entries.length ? (
          <div className={styles['owner-entry-list']}>
            {entries.map((entry) => (
              <article className="owner-entry-row" key={entry.id}>
                <div className="owner-entry-copy">
                  <div className={styles['entry-meta']}><span>{entry.kind}</span><span className={`${styles['owner-state']} ${entry.state === "published" ? styles['state-published'] : ""}`}>{entry.state}</span></div>
                  <h3><a href={`/owner/entries/${entry.id}`}>{entry.title ?? entry.body.slice(0, 90)}</a></h3>
                  <p>{dashboardCopy.updated} {formatDate(entry.updatedAt)}</p>
                </div>
                <EntryActions id={entry.id} state={entry.state} label={entry.title ?? entry.body.slice(0, 90)} copy={messages.ui.owner.actions} />
              </article>
            ))}
          </div>
        ) : (
          <div className="owner-empty">
            <h3>{dashboardCopy.emptyHeadline}</h3>
            <p>{dashboardCopy.emptyMessage}</p>
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
  progressLabel,
  progressSuffix,
  copy,
}: {
  readiness: IdentityReadiness;
  journey: FirstUpdateJourney;
  progressLabel: string;
  progressSuffix: string;
  copy: {
    nextStepLabel: string;
    publicUrlLabel: string;
    publicUrlRuntimeLabel: string;
    publicUrlSavedLabel: string;
    statusReady: string;
    statusNotStarted: string;
    statusIncomplete: string;
    statusNotReady: string;
    statusPublished: string;
    statusDraftSavedPrivately: string;
    titleSetUpIdentity: string;
    titleCreateFirstUpdate: string;
    titleContinueDraft: string;
    titleYourFirstPublicUpdate: string;
    titleCreateFirst: string;
    messagePublished: string;
    messageFresh: string;
    messageDraft: string;
    messageNoData: string;
  };
}) {
  const content = nextStepContent(readiness, journey, copy);
  const progress = readiness.requirementsComplete;
  const canonicalSource = readiness.canonicalSource === "runtime" ? copy.publicUrlRuntimeLabel : copy.publicUrlSavedLabel;

  return (
    <section
      className={`owner-next-step owner-next-step-${readiness.state}`}
      aria-labelledby="owner-next-step-title"
    >
      <div>
        <p className="eyebrow">{copy.nextStepLabel}{content.status}</p>
        <h2 id="owner-next-step-title">{content.title}</h2>
        <p>{content.message}</p>
        {readiness.canonicalUrl ? (
          <p className={styles['effective-canonical']}>
            <span>{copy.publicUrlLabel}{canonicalSource}</span>
            <code>{readiness.canonicalUrl}</code>
          </p>
        ) : null}
      </div>
      <div className={styles['owner-next-step-progress']}>
        <label htmlFor="identity-progress">{progressLabel} {progress} {progressSuffix}</label>
        <progress id="identity-progress" max="2" value={progress}>{progress} {progressSuffix}</progress>
      </div>
    </section>
  );
}

function nextStepContent(
  readiness: IdentityReadiness,
  journey: FirstUpdateJourney,
  copy: {
    statusReady: string;
    statusNotStarted: string;
    statusIncomplete: string;
    statusNotReady: string;
    titleSetUpIdentity: string;
    titleCreateFirstUpdate: string;
    titleContinueDraft: string;
    statusPublished: string;
    statusDraftSavedPrivately: string;
    titleYourFirstPublicUpdate: string;
    messagePublished: string;
    messageFresh: string;
    messageDraft: string;
    messageNoData: string;
  },
): {
  status: string;
  title: string;
  message: string;
} {
  if (journey.state === "identity") {
    return readinessMessage(readiness, copy);
  }

  if (journey.state === "empty") {
    return {
      status: copy.statusReady,
      title: copy.titleCreateFirstUpdate,
      message: copy.messageFresh,
    };
  }

  if (journey.state === "draft") {
    return {
      status: copy.statusDraftSavedPrivately,
      title: copy.titleContinueDraft,
      message: copy.messageDraft,
    };
  }

  return {
    status: copy.statusPublished,
    title: copy.titleYourFirstPublicUpdate,
    message: copy.messagePublished,
  };
}

function dashboardIntroduction(
  state: IdentityReadiness["state"],
  firstUpdate: FirstUpdateJourney,
  nextStep: {
    incompleteMessage: string;
    readyMessage: string;
    freshMessage: string;
  },
  dashboard: {
    firstUpdateEmpty: string;
    firstUpdateDraft: string;
    firstUpdatePublished: string;
    readinessIncompleteIntro: string;
    readinessReadyIntro: string;
  },
): string {
  if (firstUpdate.state === "empty") return firstUpdate.state === "empty"
    ? dashboard.firstUpdateEmpty
    : dashboard.firstUpdateDraft;

  if (firstUpdate.state === "draft") {
    return dashboard.firstUpdateDraft;
  }

  if (firstUpdate.state === "published") {
    return dashboard.firstUpdatePublished;
  }

  if (state === "incomplete") return nextStep.incompleteMessage;
  if (state === "fresh") return nextStep.freshMessage;
  return nextStep.readyMessage;
}

function dashboardPrimaryAction(
  readiness: IdentityReadiness,
  firstUpdate: FirstUpdateJourney,
  copy: {
    createFirstDraft: string;
    resumeFirstDraft: string;
    previewPublicAitta: string;
    finishIdentityAction: string;
    setupIdentityAction: string;
    titleContinueDraft: string;
  },
): { href: string; label: string } {
  if (firstUpdate.state === "empty") {
    return { href: "/owner/entries/new", label: copy.createFirstDraft };
  }

  if (firstUpdate.state === "draft") {
    return { href: `/owner/entries/${firstUpdate.entry.id}`, label: copy.resumeFirstDraft ?? copy.titleContinueDraft };
  }

  if (firstUpdate.state === "published") {
    return { href: "/", label: copy.previewPublicAitta };
  }

  return readiness.state === "incomplete"
    ? { href: "/owner/profile", label: copy.finishIdentityAction }
    : { href: "/owner/profile", label: copy.setupIdentityAction };
}

function readinessMessage(
  readiness: IdentityReadiness,
  copy: {
    statusNotReady: string;
    statusNotStarted: string;
    statusIncomplete: string;
    statusReady: string;
    messageNoData: string;
  },
): {
  status: string;
  title: string;
  message: string;
} {
  if (readiness.state === "fresh") {
    return {
      status: copy.statusNotStarted,
      title: copy.statusNotStarted,
      message: copy.messageNoData,
    };
  }

  if (readiness.state === "incomplete") {
    return {
      status: copy.statusIncomplete,
      title: copy.statusIncomplete,
      message: copy.messageNoData,
    };
  }

  return {
    status: copy.statusReady,
    title: copy.statusReady,
    message: copy.statusNotReady,
  };
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
