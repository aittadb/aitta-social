import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import styles from "./page.module.css";
import { notFound } from 'next/navigation';
import { getEntry, getProfile } from '@/db/repository';
import { publicEntryMetadata, unavailableEntryMetadata } from '@/lib/public-metadata';
import { entryKindLabel } from '@/lib/entry-kind-label';
import { resolvePresentationAccent } from '@/lib/presentation-accent';
import { PresenceIdentityTile, PublicPageFrame } from '@/app/_components/PublicPresenceFrame';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const [entry, profile] = await Promise.all([getEntry(id, true), getProfile()]);
    return entry ? publicEntryMetadata(entry, profile) : unavailableEntryMetadata();
  } catch {
    return unavailableEntryMetadata();
  }
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, profile] = await Promise.all([getEntry(id, true), getProfile()]);
  if (!entry) notFound();
  const displayName = profile?.displayName ?? 'Independent Aitta';
  const publishedAt = entry.publishedAt ?? entry.createdAt;
  const isNote = entry.kind === 'note';

  return (
    <PublicPageFrame
      className="permalink-shell"
      style={{ '--accent': resolvePresentationAccent(profile?.accentColor) } as CSSProperties}
      profile={profile}
      displayName={displayName}
    >
      <div className={styles['permalink-content']}>
        <article className={styles['permalink-entry']}>
          <header className={styles['permalink-header']}>
            <div className={styles['permalink-source-row']}>
              <a
                className={styles['permalink-source-identity']}
                href="/"
              >
                <PresenceIdentityTile
                  displayName={displayName}
                  size="update"
                />
                <span>{displayName}</span>
              </a>
              <div className={styles['permalink-context']}>
                {!isNote && <span className="update-kind">{entryKindLabel(entry.kind)}</span>}
                <span className={styles['permalink-time']}>
                  Published <time dateTime={publishedAt}>{formatLongDate(publishedAt)}</time>
                </span>
              </div>
            </div>
            {isNote ? (
              <h1 className="visually-hidden">{`Update from ${displayName}`}</h1>
            ) : entry.title ? (
              <h1>{entry.title}</h1>
            ) : (
              <h1 className="visually-hidden">{`${entryKindLabel(entry.kind)} update from ${displayName}`}</h1>
            )}
          </header>
          <div className={`${styles['permalink-body']}${isNote ? ` ${styles['permalink-note-body']}` : ""}`}>{entry.body}</div>
          {isNote && entry.title && <p className={styles['permalink-note-title']}>{entry.title}</p>}
          {entry.destinationUrl && (
            <a
              className={styles['permalink-destination']}
              href={entry.destinationUrl}
              rel="noopener noreferrer"
            >
              <span>Destination</span>
              <strong>{entry.destinationUrl}</strong>
            </a>
          )}
        </article>
        <nav className={styles['permalink-footer']} aria-label="Update actions">
          <a
            className="button"
            href="/"
          >
            Return to Aitta
          </a>
          <a
            className="text-link"
            href={`/api/v1/entries/${entry.id}`}
          >
            View as JSON
          </a>
        </nav>
      </div>
    </PublicPageFrame>
  );
}

function formatLongDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}
