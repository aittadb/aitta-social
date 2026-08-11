import { chatGPTSignOutPath } from "@/app/chatgpt-auth";

export function OwnerShell(props: {
  displayName: string;
  current: "overview" | "profile" | "entries";
  children: React.ReactNode;
}) {
  const { current, children } = props;
  return (
    <main className="owner-shell">
      <header className="owner-topbar">
        <a className="owner-wordmark" href="/owner">Manage</a>
        <a className="owner-public-link" href="/">View presence</a>
      </header>
      <nav className="owner-nav" aria-label="Owner navigation">
        <OwnerNavLink href="/owner" active={current === "overview"}>Home</OwnerNavLink>
        <OwnerNavLink href="/owner/profile" active={current === "profile"}>Identity</OwnerNavLink>
        <OwnerNavLink href="/owner/entries/new" active={current === "entries"}>New update</OwnerNavLink>
      </nav>
      <div className="owner-frame">
        <div className="owner-content">{children}</div>
      </div>
      <footer className="owner-footer">
        <span>Private owner workspace</span>
        <a href={chatGPTSignOutPath("/")}>Sign out</a>
      </footer>
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
