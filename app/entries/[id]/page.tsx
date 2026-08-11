import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getEntry, getProfile } from "@/db/repository";
import {
  publicEntryMetadata,
  unavailableEntryMetadata,
} from "@/lib/public-metadata";
import { resolvePresentationAccent } from "@/lib/presentation-accent";
import {
  PublicFooter,
  PublicPresenceHeader,
} from "@/app/_components/PublicPresenceFrame";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  try {
    const [entry, profile] = await Promise.all([
      getEntry(id, true),
      getProfile(),
    ]);
    return entry
      ? publicEntryMetadata(entry, profile)
      : unavailableEntryMetadata();
  } catch {
    return unavailableEntryMetadata();
  }
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, profile] = await Promise.all([getEntry(id, true), getProfile()]);
  if (!entry) notFound();
  return (
    <main
      className="permalink-shell"
      style={{ "--accent": resolvePresentationAccent(profile?.accentColor) } as CSSProperties}
    >
      <PublicPresenceHeader
        displayName={profile?.displayName ?? "Presence"}
        identityHref="/"
        label="Update navigation"
        actionsLabel="Update actions"
        action={{
          href: "/",
          label: "All updates",
          accessibleName: "Return to the presence and all public updates",
        }}
      />
      <div className="permalink-content">
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
          <a className="button" href="/">Return to presence</a>
          <a className="text-link" href={`/api/v1/entries/${entry.id}`}>View as JSON</a>
        </footer>
      </div>
      <PublicFooter profile={profile} />
    </main>
  );
}

function formatLongDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(date);
}
