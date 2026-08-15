import type { Profile } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";
import { AittaFooterResources } from "./AittaFooterResources";
import styles from "./PublicPresenceFrame.module.css";

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
  const shellClassNames = className
    .split(/\s+/u)
    .map((token) => {
      if (token === "template-shell") return styles['template-shell'];
      if (token === "technical-shell") return styles['public-state-shell'];
      if (token === "privacy-shell") return styles['public-state-shell'];
      if (token === "public-state-shell") return styles['public-state-shell'];
      if (token === "permalink-shell") return styles['permalink-shell'];
      if (token === "public-shell") return styles['public-shell'];
      return token;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <main className={`${styles['public-shell']} ${shellClassNames}`.trim()} style={style}>
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
    <header className={styles['public-nav']} aria-label={label}>
      <div className={`${styles['public-frame']} ${styles['public-nav-inner']}`}>
        <a className={styles['public-wordmark']} href={identityHref}>{displayName}</a>
        <nav className={styles['public-nav-actions']} aria-label={actionsLabel}>
          <a
            className={styles['public-nav-action']}
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
      className={`${styles['public-presence-tile']} ${size === "profile"
        ? styles['public-presence-tile-profile']
        : styles['public-presence-tile-update']}`}
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
    <footer className={styles['public-footer']}>
      <div className={`${styles['public-frame']} ${styles['public-footer-inner']}`}>
        <span className={styles['public-footer-name']}>
          {profile?.displayName ?? "Independent Aitta"}
        </span>
        <div className={styles['public-footer-context']}>
          {!profile?.hidePoweredBy ? (
            <span className={styles['public-attribution']}>
              Powered by <strong><a href="https://aitta.social" rel="noopener noreferrer">AittaSocial</a></strong>
            </span>
          ) : null}
          <AittaFooterResources />
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
