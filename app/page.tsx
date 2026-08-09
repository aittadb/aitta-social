import type { CSSProperties } from "react";
import Link from "next/link";
import { getProfile, listPublishedEntries } from "@/db/repository";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";
import type { Entry, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ profile, entries }, user] = await Promise.all([
    loadAccount(),
    getChatGPTUser(),
  ]);
  const accent = profile?.accentColor ?? "#31554d";
  const style = { "--accent": accent } as CSSProperties;

  return (
    <main className={`public-shell density-${profile?.density ?? "comfortable"}`} style={style}>
      <header className="public-nav" aria-label="Account navigation">
        <a className="wordmark" href="#account">{profile?.displayName ?? "Account"}</a>
        <div className="public-nav-actions">
          <a href="/.well-known/aitta-social.json" className="text-link">Manifest</a>
          <Link className="button button-quiet" href={user ? "/owner" : chatGPTSignInPath("/owner")}>
            Owner access
          </Link>
        </div>
      </header>

      <section className="identity-block" id="account" aria-labelledby="account-name">
        <div className="identity-main">
          <p className="eyebrow">{profile ? accountTypeLabel(profile.accountType) : "Independent account"}</p>
          <h1 id="account-name">{profile?.displayName ?? "This account is being prepared"}</h1>
          <p className="identity-summary">
            {profile?.shortDescription ?? "A clear public presence will appear here after its owner completes the profile."}
          </p>
        </div>
        <aside className="identity-details" aria-label="Account details">
          {profile?.location && <Detail label="Location" value={profile.location} />}
          {profile?.website && (
            <Detail label="Website" value={<a href={profile.website} rel="me">{readableHost(profile.website)}</a>} />
          )}
          {profile?.externalLinks.map((link) => (
            <Detail key={`${link.label}-${link.url}`} label={link.label} value={<a href={link.url} rel="me">Open link</a>} />
          ))}
          {!profile && <Detail label="Status" value="Private setup in progress" />}
        </aside>
      </section>

      {profile?.introduction && (
        <section className="introduction" aria-labelledby="introduction-title">
          <p className="section-index" aria-hidden="true">01</p>
          <div>
            <h2 id="introduction-title">Introduction</h2>
            <p className="prose-copy">{profile.introduction}</p>
          </div>
        </section>
      )}

      <section className="entries-section" aria-labelledby="entries-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Published here</p>
            <h2 id="entries-title">Entries</h2>
          </div>
          <Link className="text-link" href="/api/v1/entries">JSON API</Link>
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
              <h3>No published entries yet</h3>
              <p>
                {profile
                  ? "The account already stands on its own. Its first entry will appear here when it is ready."
                  : "The owner is completing this account before it becomes public."}
              </p>
            </div>
          </div>
        )}
      </section>

      <footer className="public-footer">
        <span>{profile?.displayName ?? "Independent account"}</span>
        {!profile?.hidePoweredBy && (
          <span>
            Powered by <strong><a href="https://aitta.social">AittaSocial</a></strong>
            {" · "}
            <a
              href="https://github.com/aittadb/aitta-social"
              aria-label="AittaSocial source on GitHub"
            >
              GitHub
            </a>
          </span>
        )}
      </footer>
    </main>
  );
}

async function loadAccount(): Promise<{ profile: Profile | null; entries: Entry[] }> {
  try {
    const profile = await getProfile();
    const { entries } = await listPublishedEntries(12);
    return { profile, entries };
  } catch {
    return { profile: null, entries: [] };
  }
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
          <Link href={`/entries/${entry.id}`}>{label}</Link>
        </h3>
        {entry.title && <p className="entry-excerpt">{excerpt(entry.body)}</p>}
        <div className="entry-card-links">
          <Link className="text-link" href={`/entries/${entry.id}`}>Read entry</Link>
          {entry.destinationUrl && <a className="text-link" href={entry.destinationUrl} rel="noopener noreferrer">Open destination</a>}
        </div>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <p className="detail"><span>{label}</span><strong>{value}</strong></p>;
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

function accountTypeLabel(value: string): string {
  return value === "other" ? "Independent account" : `${value.charAt(0).toUpperCase()}${value.slice(1)} account`;
}
