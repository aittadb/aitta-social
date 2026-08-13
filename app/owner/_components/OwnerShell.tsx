import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { AittaFooterResources } from "@/app/_components/AittaFooterResources";

export function OwnerShell(props: {
  current: "overview" | "profile" | "entries";
  children: React.ReactNode;
}) {
  const { current, children } = props;
  return (
    <main className="owner-shell">
      <OwnerHeader authorized />
      <nav className="owner-nav" aria-label="Owner navigation">
        <OwnerNavLink href="/owner" active={current === "overview"}>Home</OwnerNavLink>
        <OwnerNavLink href="/owner/profile" active={current === "profile"}>Identity</OwnerNavLink>
        <OwnerNavLink href="/owner/entries/new" active={current === "entries"}>New update</OwnerNavLink>
      </nav>
      <div className="owner-frame">
        <div className="owner-content">{children}</div>
      </div>
      <OwnerFooter />
    </main>
  );
}

export function OwnerAccessState({ status }: { status: "not-owner" | "unconfigured" }) {
  return (
    <main className="owner-shell owner-access-shell">
      <OwnerHeader authorized={false} />
      <div className="owner-frame owner-access-frame">
        <div className="owner-access-state">
          <div className="owner-state-mark" aria-hidden="true">A</div>
          <p className="eyebrow">Owner administration</p>
          <h1>{status === "unconfigured" ? "Administration is safely disabled" : "This Aitta is not yours to administer"}</h1>
          <p>
            {status === "unconfigured"
              ? "Configure AITTA_SOCIAL_OWNER_EMAIL in this Site’s protected runtime settings, then redeploy. Do not add the address to source files. Until then, every write operation remains disabled."
              : "You are signed in, but this ChatGPT identity does not match the sole owner configured for this Aitta."}
          </p>
          <div className="button-row">
            <a className="button" href="/">Return to public Aitta</a>
          </div>
        </div>
      </div>
      <OwnerFooter />
    </main>
  );
}

function OwnerHeader({ authorized }: { authorized: boolean }) {
  return (
    <header className="owner-topbar" aria-label="Private owner workspace">
      <div className="owner-topbar-inner">
        <div className="owner-brand">
          {authorized ? (
            <a className="owner-wordmark" href="/owner" aria-label="Manage this Aitta’s local sole-owner administration">Manage</a>
          ) : (
            <span className="owner-wordmark">Manage</span>
          )}
          <span className="owner-context-label">Private owner workspace</span>
        </div>
        <a className="owner-public-link" href="/">View Aitta</a>
      </div>
    </header>
  );
}

function OwnerFooter() {
  return (
    <footer className="owner-footer">
      <div className="owner-footer-inner">
        <span className="owner-footer-label">Private owner workspace</span>
        <AittaFooterResources />
        <a className="owner-signout" href={chatGPTSignOutPath("/")}>Sign out</a>
      </div>
    </footer>
  );
}

function OwnerNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <a href={href} aria-current={active ? "page" : undefined}>{children}</a>;
}
