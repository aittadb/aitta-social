import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getProfile, listPublishedEntries } from "@/db/repository";
import {
  publicPresenceMetadata,
  unavailablePublicMetadata,
} from "@/lib/public-metadata";
import { entryKindLabel } from "@/lib/entry-kind-label";
import { resolvePresentationAccent } from "@/lib/presentation-accent";
import type { Entry, Profile } from "@/lib/types";
import { DeploymentPrompt } from "./_components/DeploymentPrompt";
import {
  PresenceIdentityTile,
  PublicPageFrame,
} from "./_components/PublicPresenceFrame";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [profile] = await Promise.all([
      getProfile(),
      listPublishedEntries(12),
    ]);
    return publicPresenceMetadata(profile);
  } catch {
    return unavailablePublicMetadata();
  }
}

export default async function Home() {
  const account = await loadAccount();
  if (account.status === "unavailable") {
    return <UnavailablePresence />;
  }

  const { profile, entries } = account;
  if (!profile) {
    return <UnconfiguredPresence entries={entries} />;
  }

  const style = {
    "--accent": resolvePresentationAccent(profile.accentColor),
  } as CSSProperties;

  return (
    <PublicPageFrame
      className={`density-${profile.density}`}
      style={style}
      profile={profile}
      displayName={profile.displayName}
    >
      <div className={styles['public-presence-column']}>
        <section className={styles['presence-identity']} id="account" aria-labelledby="account-name">
          <div className={styles['presence-identity-field']} aria-hidden="true" />
          <div className={styles['presence-profile']}>
            <PresenceIdentityTile displayName={profile.displayName} />
            <div className={styles['presence-heading']}>
              <h1 id="account-name">{profile.displayName}</h1>
              <p className={styles['presence-summary']}>{profile.shortDescription}</p>
            </div>
            <PresenceDetails profile={profile} />
            <About introduction={profile.introduction} />
          </div>
        </section>

        <EntriesSection
          entries={entries}
          configured
          displayName={profile.displayName}
          identityHref="#account"
        />
      </div>
    </PublicPageFrame>
  );
}

type AccountLoad =
  | { status: "ready"; profile: Profile | null; entries: Entry[] }
  | { status: "unavailable" };

async function loadAccount(): Promise<AccountLoad> {
  try {
    const profile = await getProfile();
    const { entries } = await listPublishedEntries(12);
    return { status: "ready", profile, entries };
  } catch {
    return { status: "unavailable" };
  }
}

function UnconfiguredPresence({ entries }: { entries: Entry[] }) {
  return (
    <PublicPageFrame
      className="density-comfortable template-shell"
      profile={null}
      displayName="Independent Aitta"
    >
      <div className={styles.publicWideContent}>
        <section className={styles['template-start']} id="start" aria-labelledby="template-title">
          <div className={styles['template-introduction']}>
            <p className="eyebrow">Start with one prompt</p>
            <h1 id="template-title">Set up your own Aitta</h1>
            <p className={styles['identity-summary']}>
              An Aitta is your independently controlled AittaSocial application. It remains
              authoritative for its identity, content, configuration, and locally stored data,
              whether it is publicly reachable, private, or disconnected from the AittaSocial Hub.
            </p>
            <p className={styles['identity-summary']}>
              A profile is an Aitta&apos;s optional outward identity presentation. This Aitta has no
              profile yet and no current Hub connection. Give the prompt to ChatGPT to keep setup
              private, reuse the right Site, and guide you through the first Identity.
            </p>
          </div>
          <DeploymentPrompt />
        </section>

        <EntriesSection
          entries={entries}
          configured={false}
          displayName="Independent Aitta"
          identityHref="#start"
        />
      </div>
    </PublicPageFrame>
  );
}

function UnavailablePresence() {
  return (
    <PublicPageFrame
      className="public-state-shell"
      profile={null}
      displayName="Independent Aitta"
    >
      <section className="public-state-page" aria-labelledby="unavailable-title">
        <p className="eyebrow">Aitta storage unavailable</p>
        <h1 id="unavailable-title">This Aitta cannot be loaded right now</h1>
        <p>
          Its storage could not be read. Try again shortly. No setup, profile, or public content
          has been changed.
        </p>
        <div className={styles.buttonRow}>
          <a className="button" href="/">Try again</a>
        </div>
      </section>
    </PublicPageFrame>
  );
}

function EntriesSection({
  entries,
  configured,
  displayName,
  identityHref,
}: {
  entries: Entry[];
  configured: boolean;
  displayName: string;
  identityHref: string;
}) {
  return (
    <section className={styles['updates-section']} aria-labelledby="entries-title">
      <h2 id="entries-title">Updates</h2>
      {entries.length ? (
        <ol className={styles['update-stream']}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <UpdateItem
                entry={entry}
                displayName={displayName}
                identityHref={identityHref}
              />
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles['empty-public']}>
          <h3>No published updates yet</h3>
          <p>
            {configured
              ? "This Aitta already stands on its own. Its first update will appear here when it is ready."
              : "Published updates will appear here after the owner configures this Aitta's optional profile."}
          </p>
        </div>
      )}
    </section>
  );
}

function kindClass(kind: Entry["kind"]): string {
  if (kind === "note") return styles.updateKindNote;
  if (kind === "article") return styles['update-kind-article'];
  if (kind === "announcement") return styles['update-kind-announcement'];
  return styles['update-kind-link'];
}

function UpdateItem({
  entry,
  displayName,
  identityHref,
}: {
  entry: Entry;
  displayName: string;
  identityHref: string;
}) {
  const permalink = `/entries/${entry.id}`;
  const publishedAt = entry.publishedAt ?? entry.createdAt;
  const isNote = entry.kind === "note";

  return (
    <article className={`${styles['update-item']} ${kindClass(entry.kind)}`}>
      <header className={styles['update-source-row']}>
        <a className={styles['update-source-identity']} href={identityHref}>
          <PresenceIdentityTile displayName={displayName} size="update" />
          <span>{displayName}</span>
        </a>
        <div className={styles['update-context']}>
          {!isNote && <span className={styles['update-kind']}>{entryKindLabel(entry.kind)}</span>}
          <a
            className={styles['update-time']}
            href={permalink}
            aria-label={`Open update published ${formatDate(publishedAt)}`}
          >
            <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
          </a>
        </div>
      </header>

      {isNote ? (
        <>
          <p className={`${styles['update-body']} ${styles['update-note-body']}`}>{entry.body}</p>
          {entry.title && (
            <a className={styles['update-note-title']} href={permalink}>{entry.title}</a>
          )}
        </>
      ) : (
        <>
          {entry.title && (
            <h3 className={styles['update-title']}><a href={permalink}>{entry.title}</a></h3>
          )}
          <p className={`${styles['update-body']} ${styles['update-excerpt']}`}>{excerpt(entry.body)}</p>
        </>
      )}

      {entry.destinationUrl && (
        <a
          className="update-destination"
          href={entry.destinationUrl}
          rel="noopener noreferrer"
        >
          <span>Destination</span>
          <strong>{entry.destinationUrl}</strong>
        </a>
      )}
    </article>
  );
}

function PresenceDetails({ profile }: { profile: Profile }) {
  if (!profile.location && !profile.website && profile.externalLinks.length === 0) {
    return null;
  }

  return (
    <aside className={styles['presence-details']} aria-label="Profile details">
      {profile.location && <PresenceDetail label="Location" value={profile.location} />}
      {profile.website && (
        <PresenceDetail
          label="Website"
          value={<a href={profile.website} rel="me noopener noreferrer">{readableHost(profile.website)}</a>}
        />
      )}
      {profile.externalLinks.map((link) => (
        <PresenceDetail
          key={`${link.label}-${link.url}`}
          label={link.label}
          value={<a href={link.url} rel="me noopener noreferrer">{readableHost(link.url)}</a>}
        />
      ))}
    </aside>
  );
}

function PresenceDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className={styles['presence-detail']}>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function About({ introduction }: { introduction: string }) {
  if (!introduction.trim()) return null;

  const summary = summarizeAbout(introduction);
  return (
    <section className={styles['presence-about']} aria-labelledby="about-title">
      <h2 id="about-title">About</h2>
      {summary === introduction ? (
        <p className={styles['presence-about-copy']}>{introduction}</p>
      ) : (
        <>
          <p className={styles['presence-about-copy']}>{summary}</p>
          <details>
            <summary>Read full About</summary>
            <p className={`${styles['presence-about-copy']} ${styles['presence-about-full']}`}>{introduction}</p>
          </details>
        </>
      )}
    </section>
  );
}

function summarizeAbout(value: string): string {
  const characters = Array.from(value);
  if (characters.length <= 220) return value;

  const candidate = characters.slice(0, 217).join("").trimEnd();
  const boundary = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
  return `${boundary >= 120 ? candidate.slice(0, boundary).trimEnd() : candidate}…`;
}

function excerpt(value: string): string {
  const characters = Array.from(value);
  if (characters.length <= 240) return value;

  const candidate = characters.slice(0, 237).join("").trimEnd();
  const boundary = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
  return `${boundary >= 120 ? candidate.slice(0, boundary).trimEnd() : candidate}…`;
}

function readableHost(value: string): string {
  try { return new URL(value).hostname; } catch { return value; }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(date);
}
