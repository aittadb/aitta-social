import type { Profile } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";
import { en } from "@/lib/i18n/messages/en";
import { AittaFooterResources } from "./AittaFooterResources";

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
  copy?: {
    footerNameFallback: string;
    poweredByLabel: string;
    poweredByBrand: string;
    poweredByUrl: string;
  };
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
  copy = {
    footerNameFallback: en.ui.shared.aittaName,
    poweredByLabel: "Powered by",
    poweredByBrand: "AittaSocial",
    poweredByUrl: "https://aitta.social",
  },
}: PublicPageFrameProps) {
  const shellClassNames = className
    .split(/\s+/u)
    .filter((token) => token.length > 0);

  const uniqueClassNames = Array.from(
    new Set(["public-shell", ...shellClassNames]),
  );

  return (
    <main
      className={uniqueClassNames.join(" ")}
      style={style}
    >
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
      <PublicFooter profile={profile} copy={copy} />
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
  const sizeClass = size === "profile"
    ? "presence-identity-tile presence-identity-tile-profile public-presence-tile public-presence-tile-profile"
    : "presence-identity-tile presence-identity-tile-update public-presence-tile public-presence-tile-update";

  return (
        <span
        className={sizeClass}
        aria-hidden="true"
      >
      {presenceInitials(displayName)}
    </span>
  );
}

function PublicFooter({
  profile,
  copy,
}: {
  profile: Pick<Profile, "displayName" | "hidePoweredBy"> | null;
  copy: {
    footerNameFallback: string;
    poweredByLabel: string;
    poweredByBrand: string;
    poweredByUrl: string;
  };
}) {
  return (
    <footer className="public-footer">
      <div className="public-frame public-footer-inner">
        <span className="public-footer-name">
          {profile?.displayName ?? copy.footerNameFallback}
        </span>
        <div className="public-footer-context">
          {!profile?.hidePoweredBy ? (
            <span className="public-attribution">
              <span dangerouslySetInnerHTML={{ __html: `${copy.poweredByLabel} <strong><a href="${copy.poweredByUrl}" rel="noopener noreferrer">${copy.poweredByBrand}</a></strong>` }} />
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
