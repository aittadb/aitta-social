import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getProfile, listPublishedEntries } from "@/db/repository";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";
import { publicPresenceMetadata } from "@/lib/public-metadata";
import { resolvePresentationAccent } from "@/lib/presentation-accent";
import type { Entry, Profile } from "@/lib/types";
import { DeploymentPrompt } from "./_components/DeploymentPrompt";
import {
  PresenceIdentityTile,
  PublicFooter,
  PublicPresenceHeader,
} from "./_components/PublicPresenceFrame";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    return publicPresenceMetadata(await getProfile());
  } catch {
    return publicPresenceMetadata(null);
  }
}

export default async function Home() {
  const [account, user] = await Promise.all([
    loadAccount(),
    getChatGPTUser(),
  ]);
  if (account.status === "unavailable") {
    return <UnavailablePresence signedIn={Boolean(user)} />;
  }

  const { profile, entries } = account;
  if (!profile) {
    return <UnconfiguredPresence entries={entries} signedIn={Boolean(user)} />;
  }

  const style = {
    "--accent": resolvePresentationAccent(profile.accentColor),
  } as CSSProperties;

  return (
    <main className={`public-shell density-${profile.density}`} style={style}>
      <PublicPresenceHeader
        displayName={profile.displayName}
        identityHref="#account"
        label="Presence navigation"
        actionsLabel="Presence actions"
        action={{
          href: user ? "/owner" : chatGPTSignInPath("/owner"),
          label: "Manage",
          accessibleName: user
            ? "Manage presence as owner — open local sole-owner administration"
            : "Manage presence as owner — sign in with ChatGPT for local sole-owner administration",
        }}
      />

      <div className="public-presence-column">
        <section className="presence-identity" id="account" aria-labelledby="account-name">
          <div className="presence-identity-field" aria-hidden="true" />
          <div className="presence-profile">
            <PresenceIdentityTile displayName={profile.displayName} />
            <div className="presence-heading">
              <h1 id="account-name">{profile.displayName}</h1>
              <p className="presence-summary">{profile.shortDescription}</p>
            </div>
            <PresenceDetails profile={profile} />
            <About introduction={profile.introduction} />
          </div>
        </section>

        <EntriesSection entries={entries} configured />
      </div>
      <PublicFooter profile={profile} />
    </main>
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

function UnconfiguredPresence({ entries, signedIn }: { entries: Entry[]; signedIn: boolean }) {
  const ownerPath = signedIn ? "/owner" : chatGPTSignInPath("/owner");
  return (
    <main className="public-shell density-comfortable template-shell">
      <PublicPresenceHeader
        displayName="AittaSocial"
        identityHref="#start"
        label="Presence setup navigation"
        actionsLabel="Presence setup actions"
        action={{
          href: ownerPath,
          label: "Set up",
          accessibleName: signedIn
            ? "Set up this presence — open local sole-owner administration"
            : "Set up this presence — sign in with ChatGPT for local sole-owner administration",
        }}
      />

      <div className="public-wide-content">
        <section className="template-start" id="start" aria-labelledby="template-title">
          <div className="template-introduction">
            <p className="eyebrow">Start with one prompt</p>
            <h1 id="template-title">Create your own presence</h1>
            <p className="identity-summary">
              Give this prompt to ChatGPT. It will keep setup private, reuse the right Site,
              and guide you through the first Identity.
            </p>
          </div>
          <DeploymentPrompt />
        </section>

        <EntriesSection entries={entries} configured={false} />
      </div>
      <PublicFooter profile={null} />
    </main>
  );
}

function UnavailablePresence({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="state-page" aria-labelledby="unavailable-title">
      <p className="eyebrow">Presence unavailable</p>
      <h1 id="unavailable-title">This presence cannot be loaded right now</h1>
      <p>Try again shortly. No setup or public content has been changed.</p>
      <div className="button-row">
        <a className="button" href="/">Try again</a>
        <a className="button button-quiet" href={signedIn ? "/owner" : chatGPTSignInPath("/owner")}>
          Manage presence
        </a>
      </div>
    </main>
  );
}

function EntriesSection({ entries, configured }: { entries: Entry[]; configured: boolean }) {
  return (
    <section className="entries-section" aria-labelledby="entries-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Recent</p>
          <h2 id="entries-title">Updates</h2>
        </div>
      </div>
      {entries.length ? (
        <ol className="entry-list">
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <EntryCard entry={entry} index={index + 1} />
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-public">
          <p className="empty-mark" aria-hidden="true">A</p>
          <div>
            <h3>No published updates yet</h3>
            <p>
              {configured
                ? "The presence already stands on its own. Its first update will appear here when it is ready."
                : "Published updates will appear here after the owner completes this presence."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function EntryCard({ entry, index }: { entry: Entry; index: number }) {
  const label = entry.title ?? entry.body.split(/\n/, 1)[0].slice(0, 90);
  return (
    <article className={`entry-card entry-kind-${entry.kind}`}>
      <div className="entry-number" aria-hidden="true">{String(index).padStart(2, "0")}</div>
      <div className="entry-card-body">
        <div className="entry-meta">
          <span>{entry.kind}</span>
          <time dateTime={entry.publishedAt ?? entry.createdAt}>
            {formatDate(entry.publishedAt ?? entry.createdAt)}
          </time>
        </div>
        <h3 className={entry.title ? undefined : "entry-note-title"}>
          <a href={`/entries/${entry.id}`}>{label}</a>
        </h3>
        {entry.title && <p className="entry-excerpt">{excerpt(entry.body)}</p>}
        <div className="entry-card-links">
          <a className="text-link" href={`/entries/${entry.id}`}>Read update</a>
          {entry.destinationUrl && <a className="text-link" href={entry.destinationUrl} rel="noopener noreferrer">Open destination</a>}
        </div>
      </div>
    </article>
  );
}

function PresenceDetails({ profile }: { profile: Profile }) {
  if (!profile.location && !profile.website && profile.externalLinks.length === 0) {
    return null;
  }

  return (
    <aside className="presence-details" aria-label="Presence details">
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
    <p className="presence-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function About({ introduction }: { introduction: string }) {
  if (!introduction.trim()) return null;

  const summary = summarizeAbout(introduction);
  return (
    <section className="presence-about" aria-labelledby="about-title">
      <h2 id="about-title">About</h2>
      {summary === introduction ? (
        <p className="presence-about-copy">{introduction}</p>
      ) : (
        <>
          <p className="presence-about-copy">{summary}</p>
          <details>
            <summary>Read full About</summary>
            <p className="presence-about-copy presence-about-full">{introduction}</p>
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
  return value.length > 240 ? `${value.slice(0, 237).trimEnd()}…` : value;
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
