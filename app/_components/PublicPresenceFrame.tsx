import type { Profile } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

type HeaderAction = {
  href: string;
  label: string;
  accessibleName: string;
};

type PublicPageFrameProps = {
  children: ReactNode;
  className?: string;
  displayName: string;
  profile: Pick<Profile, "displayName" | "hidePoweredBy"> | null;
  style?: CSSProperties;
};

/**
 * The fixed human-public chrome. Callers supply only already-projected display
 * values, so this component has no dependency on D1, runtime configuration,
 * authentication, or authorization state.
 */
export function PublicPageFrame({
  children,
  className = "",
  displayName,
  profile,
  style,
}: PublicPageFrameProps) {
  return (
    <main className={`public-shell ${className}`.trim()} style={style}>
      <PublicPresenceHeader
        displayName={displayName}
        identityHref="/"
        label="Aitta navigation"
        actionsLabel="Aitta actions"
        action={{
          href: "/owner",
          label: "Manage",
          accessibleName: "Manage this Aitta’s local sole-owner administration",
        }}
      />
      {children}
      <PublicFooter profile={profile} />
    </main>
  );
}

function PublicPresenceHeader({
  displayName,
  identityHref,
  label,
  actionsLabel,
  action,
}: {
  displayName: string;
  identityHref: string;
  label: string;
  actionsLabel: string;
  action: HeaderAction;
}) {
  return (
    <header className="public-nav" aria-label={label}>
      <div className="public-frame public-nav-inner">
        <a className="wordmark" href={identityHref}>{displayName}</a>
        <nav className="public-nav-actions" aria-label={actionsLabel}>
          <a
            className="public-nav-action"
            href={action.href}
            aria-label={action.accessibleName}
          >
            {action.label}
          </a>
        </nav>
      </div>
    </header>
  );
}

export function PresenceIdentityTile({
  displayName,
  size = "profile",
}: {
  displayName: string;
  size?: "profile" | "update";
}) {
  return (
    <span
      className={`presence-identity-tile presence-identity-tile-${size}`}
      aria-hidden="true"
    >
      {presenceInitials(displayName)}
    </span>
  );
}

function PublicFooter({
  profile,
}: {
  profile: Pick<Profile, "displayName" | "hidePoweredBy"> | null;
}) {
  return (
    <footer className="public-footer">
      <div className="public-frame public-footer-inner">
        <span className="public-footer-name">
          {profile?.displayName ?? "Independent Aitta"}
        </span>
        <div className="public-footer-context">
          <span className="public-attribution">
            {!profile?.hidePoweredBy && (
              <>
                Powered by <strong><a href="https://aitta.social" rel="noopener noreferrer">AittaSocial</a></strong>
                <span aria-hidden="true"> · </span>
              </>
            )}
            <a
              href="https://github.com/aittadb/aitta-social"
              rel="noopener noreferrer"
              aria-label="AittaSocial source on GitHub"
            >
              GitHub
            </a>
          </span>
          <nav className="technical-links" aria-label="Technical resources">
            <a href="/privacy">Privacy</a>
            <a href="/technical">Technical</a>
            <a href="/.well-known/aitta-social.json">Manifest</a>
            <a href="/api/v1/site">Profile</a>
            <a href="/api/v1/entries">Updates</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function presenceInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return "A";

  if (words.length === 1) {
    const characters = Array.from(words[0]);
    const usefulCharacters = characters.filter((character) => /[\p{L}\p{N}]/u.test(character));
    return (usefulCharacters.length > 0 ? usefulCharacters : characters)
      .slice(0, 2)
      .join("")
      .toLocaleUpperCase("en");
  }

  return `${firstVisibleCharacter(words[0])}${firstVisibleCharacter(words.at(-1) ?? "")}`
    .toLocaleUpperCase("en");
}

function firstVisibleCharacter(value: string): string {
  return Array.from(value).find((character) => /[\p{L}\p{N}]/u.test(character))
    ?? Array.from(value)[0]
    ?? "";
}
