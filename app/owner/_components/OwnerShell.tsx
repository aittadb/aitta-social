import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { AittaFooterResources } from "@/app/_components/AittaFooterResources";
import styles from "./OwnerShell.module.css";

export function OwnerShell(props: {
  current: "overview" | "profile" | "entries" | "pages";
  children: React.ReactNode;
}) {
  const { current, children } = props;
  return (
    <main className={styles['owner-shell']}>
      <OwnerHeader authorized />
      <nav className={styles['owner-navigation']} aria-label="Owner navigation">
        <OwnerNavLink href="/owner" active={current === "overview"}>Home</OwnerNavLink>
        <OwnerNavLink href="/owner/profile" active={current === "profile"}>Identity</OwnerNavLink>
        <OwnerNavLink href="/owner/entries/new" active={current === "entries"}>New update</OwnerNavLink>
        <OwnerNavLink href="/owner/pages/import" active={current === "pages"}>Pages</OwnerNavLink>
      </nav>
      <div className={styles['owner-frame']}>
        <div className={styles['owner-content']}>{children}</div>
      </div>
      <OwnerFooter />
    </main>
  );
}

export function OwnerAccessState({ status }: { status: "not-owner" | "unconfigured" }) {
  return (
    <main className={styles['owner-shell']}>
      <OwnerHeader authorized={false} />
      <div className={`${styles['owner-frame']} ${styles['owner-access-frame']}`}>
        <div className={styles['owner-access-state']}>
        <div className={styles['owner-state-mark']} aria-hidden="true">A</div>
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
    <header className={styles['owner-topbar']} aria-label="Private owner workspace">
      <div className={styles['owner-topbar-inner']}>
        <div className={styles['owner-brand']}>
          {authorized ? (
            <a className={styles['owner-wordmark']} href="/owner" aria-label="Manage this Aitta’s local sole-owner administration">Manage</a>
          ) : (
            <span className={styles['owner-wordmark']}>Manage</span>
          )}
          <span className={styles['owner-context-label']}>Private owner workspace</span>
        </div>
        <a className={styles['owner-public-link']} href="/">View Aitta</a>
      </div>
    </header>
  );
}

function OwnerFooter() {
  return (
    <footer className={styles['owner-footer']}>
      <div className={styles['owner-footer-inner']}>
        <span className={styles['owner-footer-label']}>Private owner workspace</span>
        <AittaFooterResources />
        <a className={styles['owner-sign-out']} href={chatGPTSignOutPath("/")}>Sign out</a>
      </div>
    </footer>
  );
}

function OwnerNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <a href={href} aria-current={active ? "page" : undefined}>{children}</a>;
}
