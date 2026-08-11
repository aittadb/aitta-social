import type { Profile } from "@/lib/types";

type HeaderAction = {
  href: string;
  label: string;
  accessibleName: string;
};

export function PublicPresenceHeader({
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

export function PublicFooter({
  profile,
}: {
  profile: Pick<Profile, "displayName" | "hidePoweredBy"> | null;
}) {
  return (
    <footer className="public-footer">
      <div className="public-frame public-footer-inner">
        <span className="public-footer-name">
          {profile?.displayName ?? "Independent presence"}
        </span>
        <div className="public-footer-context">
          {!profile?.hidePoweredBy && (
            <span className="public-attribution">
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
          <nav className="technical-links" aria-label="Technical resources">
            <span>Technical</span>
            <a href="/.well-known/aitta-social.json">Manifest</a>
            <a href="/api/v1/site">Profile JSON</a>
            <a href="/api/v1/entries">Updates JSON</a>
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
