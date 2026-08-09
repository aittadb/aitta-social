import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEntry, getProfile } from "@/db/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const entry = await getEntry(id, true);
    return entry
      ? { title: entry.title ?? `${entry.kind.charAt(0).toUpperCase()}${entry.kind.slice(1)}` }
      : { title: "Entry not found" };
  } catch {
    return { title: "Entry" };
  }
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, profile] = await Promise.all([getEntry(id, true), getProfile()]);
  if (!entry) notFound();
  return (
    <main className="permalink-shell" style={{ "--accent": profile?.accentColor ?? "#31554d" } as React.CSSProperties}>
      <nav className="permalink-nav" aria-label="Entry navigation">
        <a className="wordmark" href="/">{profile?.displayName ?? "Account"}</a>
        <a className="text-link" href="/">All entries</a>
      </nav>
      <article className="permalink-entry">
        <header>
          <p className="eyebrow">{entry.kind}</p>
          <h1>{entry.title ?? `${entry.kind.charAt(0).toUpperCase()}${entry.kind.slice(1)}`}</h1>
          <p className="permalink-date">
            Published <time dateTime={entry.publishedAt ?? entry.createdAt}>{formatLongDate(entry.publishedAt ?? entry.createdAt)}</time>
          </p>
        </header>
        <div className="entry-body">{entry.body}</div>
        {entry.destinationUrl && (
          <a className="destination-card" href={entry.destinationUrl} rel="noopener noreferrer">
            <span>Destination</span>
            <strong>{entry.destinationUrl}</strong>
          </a>
        )}
      </article>
      <footer className="permalink-footer">
        <a className="button" href="/">Return to account</a>
        <a className="text-link" href={`/api/v1/entries/${entry.id}`}>View as JSON</a>
      </footer>
    </main>
  );
}

function formatLongDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(date);
}
