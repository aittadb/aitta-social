import { chatGPTSignOutPath } from "@/app/chatgpt-auth";

export function OwnerShell({
  displayName,
  current,
  children,
}: {
  displayName: string;
  current: "overview" | "profile" | "entries" | "hub";
  children: React.ReactNode;
}) {
  return (
    <main className="owner-shell">
      <header className="owner-topbar">
        <div>
          <a className="owner-wordmark" href="/owner">AittaSocial</a>
          <span className="owner-badge">Owner workspace</span>
        </div>
        <div className="owner-session">
          <span className="owner-user">{displayName}</span>
          <a href={chatGPTSignOutPath("/")}>Sign out</a>
        </div>
      </header>
      <div className="owner-frame">
        <nav className="owner-nav" aria-label="Owner navigation">
          <OwnerNavLink href="/owner" active={current === "overview"}>Your presence</OwnerNavLink>
          <OwnerNavLink href="/owner/profile" active={current === "profile"}>Identity</OwnerNavLink>
          <OwnerNavLink href="/owner/entries/new" active={current === "entries"}>New update</OwnerNavLink>
          <span className="owner-nav-label">Advanced</span>
          <OwnerNavLink href="/owner/hub" active={current === "hub"}>Provisional Hub setup</OwnerNavLink>
          <a className="owner-public-link" href="/">View public presence ↗</a>
        </nav>
        <div className="owner-content">{children}</div>
      </div>
    </main>
  );
}

export function OwnerAccessState({ status }: { status: "not-owner" | "unconfigured" }) {
  return (
    <main className="owner-access-state">
      <div className="owner-state-mark" aria-hidden="true">A</div>
      <p className="eyebrow">Owner administration</p>
      <h1>{status === "unconfigured" ? "Administration is safely disabled" : "This presence is not yours to administer"}</h1>
      <p>
        {status === "unconfigured"
          ? "Configure AITTA_SOCIAL_OWNER_EMAIL in this Site’s protected runtime settings, then redeploy. Do not add the address to source files. Until then, every write operation remains disabled."
          : "You are signed in, but this ChatGPT identity does not match the sole owner configured for this presence."}
      </p>
      <div className="button-row">
        <a className="button" href="/">Return to public presence</a>
        <a className="button button-quiet" href={chatGPTSignOutPath("/")}>Sign out</a>
      </div>
    </main>
  );
}

function OwnerNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <a href={href} aria-current={active ? "page" : undefined}>{children}</a>;
}
