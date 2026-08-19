import type { CSSProperties } from "react";

import { entryKindLabel } from "@/lib/entry-kind-label";
import { resolvePresentationAccent } from "@/lib/presentation-accent";
import type { Entry, Profile } from "@/lib/types";
import type { Messages } from "@/lib/i18n/messages/en";
import { DeploymentPrompt } from "./_components/DeploymentPrompt";
import {
  PresenceIdentityTile,
  PublicPageFrame,
} from "./_components/PublicPresenceFrame";

export function ConfiguredPresence({
  profile,
  entries,
  locale,
  messages,
}: {
  profile: Profile;
  entries: Entry[];
  locale: string;
  messages: PublicPageCopy;
}) {
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
      <div className="public-presence-column">
        <section
          className="presence-identity"
          id="account"
          aria-labelledby="account-name"
        >
          <div className="presence-identity-field" aria-hidden="true" />
          <div className="presence-profile">
            <PresenceIdentityTile displayName={profile.displayName} />
            <div className="presence-heading">
              <h1 id="account-name">{profile.displayName}</h1>
              <p className="presence-summary">{profile.shortDescription}</p>
            </div>
            <PresenceDetails profile={profile} messages={messages} />
            <About introduction={profile.introduction} messages={messages} />
          </div>
        </section>

        <EntriesSection
          entries={entries}
          configured
          displayName={profile.displayName}
          identityHref="#account"
          locale={locale}
          messages={messages}
        />
      </div>
    </PublicPageFrame>
  );
}

export function UnconfiguredPresence({
  entries,
  locale,
  messages,
}: {
  entries: Entry[];
  locale: string;
  messages: PublicPageCopy;
}) {
  return (
    <PublicPageFrame
      className="density-comfortable template-shell"
      profile={null}
      displayName={messages.common.appName}
    >
      <div className="public-wide-content">
        <section className="template-start" id="start" aria-labelledby="template-title">
          <div className="template-introduction">
            <p className="eyebrow">{messages.home.startWithOnePrompt}</p>
            <h1 id="template-title">{messages.home.setUpYourOwnAitta}</h1>
            <p className="identity-summary">
              {messages.home.unconfiguredIntro.firstParagraph}
            </p>
            <p className="identity-summary">
              {messages.home.unconfiguredIntro.secondParagraph}
            </p>
          </div>
          <DeploymentPrompt
            label={messages.deploymentPrompt.label}
            help={messages.deploymentPrompt.help}
          />
        </section>

        <EntriesSection
          entries={entries}
          configured={false}
          displayName={messages.common.appName}
          identityHref="#start"
          locale={locale}
          messages={messages}
        />
      </div>
    </PublicPageFrame>
  );
}

export function UnavailablePresence({ messages }: { messages: PublicPageCopy }) {
  return (
    <PublicPageFrame
      className="public-state-shell"
      profile={null}
      displayName={messages.common.appName}
    >
      <section className="public-state-page" aria-labelledby="unavailable-title">
        <p className="eyebrow">{messages.home.aittaStorageUnavailable}</p>
        <h1 id="unavailable-title">{messages.home.unavailableTitle}</h1>
        <p>
          {messages.home.aittaStorageUnavailable}
        </p>
        <div className="button-row">
          <a className="button" href="/">{messages.home.tryAgain}</a>
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
  locale,
  messages,
}: {
  entries: Entry[];
  configured: boolean;
  displayName: string;
  identityHref: string;
  locale: string;
  messages: PublicPageCopy;
}) {
  return (
    <section className="updates-section" aria-labelledby="entries-title">
      <h2 id="entries-title">{messages.common.updates}</h2>
      {entries.length ? (
        <ol className="update-stream">
          {entries.map((entry) => (
            <li key={entry.id}>
              <UpdateItem
                entry={entry}
                displayName={displayName}
                identityHref={identityHref}
                locale={locale}
                messages={messages}
              />
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-public">
          <h3>{messages.common.noPublishedUpdatesYet}</h3>
          <p>
            {configured
              ? messages.home.noUpdatesMessage.ready
              : messages.home.noUpdatesMessage.unconfigured}
          </p>
        </div>
      )}
    </section>
  );
}

function kindClass(kind: Entry["kind"]): string {
  if (kind === "note") return "update-kind-note";
  if (kind === "article") return "update-kind-article";
  if (kind === "announcement") return "update-kind-announcement";
  return "update-kind-link";
}

function UpdateItem({
  entry,
  displayName,
  identityHref,
  locale,
  messages,
}: {
  entry: Entry;
  displayName: string;
  identityHref: string;
  locale: string;
  messages: PublicPageCopy;
}) {
  const permalink = `/entries/${entry.id}`;
  const publishedAt = entry.publishedAt ?? entry.createdAt;
  const isNote = entry.kind === "note";

  return (
    <article className={`update-item ${kindClass(entry.kind)}`}>
      <header className="update-source-row">
        <a className="update-source-identity" href={identityHref}>
          <PresenceIdentityTile displayName={displayName} size="update" />
          <span>{displayName}</span>
        </a>
        <div className="update-context">
          {!isNote && (
            <span className="update-kind">{entryKindLabel(entry.kind)}</span>
          )}
          <a
            className="update-time"
            href={permalink}
            aria-label={`${messages.entry.updatesAriaPrefix} ${formatDate(publishedAt, locale)}`}
          >
            <time dateTime={publishedAt}>{formatDate(publishedAt, locale)}</time>
          </a>
        </div>
      </header>

      {isNote ? (
        <>
          <p className="update-body update-note-body">
            {entry.body}
          </p>
          {entry.title && (
            <a className="update-note-title" href={permalink}>{entry.title}</a>
          )}
        </>
      ) : (
        <>
          {entry.title && (
            <h3 className="update-title"><a href={permalink}>{entry.title}</a></h3>
          )}
          <p className="update-body update-excerpt">
            {excerpt(entry.body)}
          </p>
        </>
      )}

      {entry.destinationUrl && (
        <a
          className="update-destination"
          href={entry.destinationUrl}
          rel="noopener noreferrer"
        >
          <span>{messages.entry.destination}</span>
          <strong>{entry.destinationUrl}</strong>
        </a>
      )}
    </article>
  );
}

function PresenceDetails({ profile, messages }: { profile: Profile; messages: PublicPageCopy }) {
  if (!profile.location && !profile.website && profile.externalLinks.length === 0) {
    return null;
  }

  return (
    <aside className="presence-details" aria-label={messages.home.profileDetails}>
      {profile.location && <PresenceDetail label={messages.home.locationLabel} value={profile.location} />}
      {profile.website && (
        <PresenceDetail
          label={messages.home.websiteLabel}
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

function About({ introduction, messages }: { introduction: string; messages: PublicPageCopy }) {
  if (!introduction.trim()) return null;

  const summary = summarizeAbout(introduction);
  return (
    <section className="presence-about" aria-labelledby="about-title">
      <h2 id="about-title">{messages.home.aboutTitle}</h2>
      {summary === introduction ? (
        <p className="presence-about-copy">{introduction}</p>
      ) : (
        <>
          <p className="presence-about-copy">{summary}</p>
          <details>
            <summary>{messages.home.readFullAbout}</summary>
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
  const characters = Array.from(value);
  if (characters.length <= 240) return value;

  const candidate = characters.slice(0, 237).join("").trimEnd();
  const boundary = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
  return `${boundary >= 120 ? candidate.slice(0, boundary).trimEnd() : candidate}…`;
}

function readableHost(value: string): string {
  try { return new URL(value).hostname; } catch { return value; }
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

type PublicPageCopy = {
  common: Messages["common"];
  home: Messages["home"];
  deploymentPrompt: Messages["deploymentPrompt"];
  footer: Messages["footer"];
  shared: Messages["ui"]["shared"];
  entry: Messages["entry"];
};
