import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { AittaFooterResources } from "@/app/_components/AittaFooterResources";
import { en } from "@/lib/i18n/messages/en";
import styles from "./OwnerShell.module.css";

export function OwnerShell(props: {
  current: "overview" | "profile" | "entries" | "pages";
  children: React.ReactNode;
  copy?: {
    navigationAria: string;
    home: string;
    identity: string;
    newUpdate: string;
    pages: string;
    yourWorkspace: string;
    footerWorkspace: string;
  };
}) {
  const { current, children } = props;
  const copy = props.copy ?? {
    navigationAria: en.ui.owner.shell.navigationAria,
    home: en.ui.owner.shell.home,
    identity: en.ui.owner.shell.identity,
    newUpdate: en.ui.owner.shell.newUpdate,
    pages: en.ui.owner.shell.pages,
    yourWorkspace: en.ui.owner.shell.privateWorkspace,
    footerWorkspace: en.ui.owner.shell.privateWorkspace,
  };
  return (
    <main className={styles['owner-shell']}>
      <OwnerHeader authorized />
      <nav className={styles['owner-navigation']} aria-label={copy.navigationAria}>
        <OwnerNavLink href="/owner" active={current === "overview"}>{copy.home}</OwnerNavLink>
        <OwnerNavLink href="/owner/profile" active={current === "profile"}>{copy.identity}</OwnerNavLink>
        <OwnerNavLink href="/owner/entries/new" active={current === "entries"}>{copy.newUpdate}</OwnerNavLink>
        <OwnerNavLink href="/owner/pages/import" active={current === "pages"}>{copy.pages}</OwnerNavLink>
      </nav>
      <div className={styles['owner-frame']}>
        <div className={styles['owner-content']}>{children}</div>
      </div>
      <OwnerFooter />
    </main>
  );
}

export function OwnerAccessState({ status }: { status: "not-owner" | "unconfigured" }) {
  const copy = {
    administration: en.ui.owner.access.administration,
    disabled: en.ui.owner.access.adminSafeDisabled,
    notOwner: en.ui.owner.access.adminNotYours,
    unconfigured: en.ui.owner.access.unconfiguredMessage,
    signedOut: en.ui.owner.access.signedOutMessage,
    returnToAitta: en.ui.publicPresenceFrame.returnToAitta,
  };
  return (
    <main className={styles['owner-shell']}>
      <OwnerHeader authorized={false} />
      <div className={`${styles['owner-frame']} ${styles['owner-access-frame']}`}>
        <div className={styles['owner-access-state']}>
          <div className={styles['owner-state-mark']} aria-hidden="true">A</div>
          <p className="eyebrow">{copy.administration}</p>
          <h1>{status === "unconfigured" ? copy.disabled : copy.notOwner}</h1>
          <p>
            {status === "unconfigured" ? copy.unconfigured : copy.signedOut}
          </p>
          <div className="button-row">
            <a className="button" href="/">{copy.returnToAitta}</a>
          </div>
        </div>
      </div>
      <OwnerFooter />
    </main>
  );
}

function OwnerHeader({ authorized }: { authorized: boolean }) {
  const copy = {
    manage: en.ui.publicPresenceFrame.headerManage,
    workspace: en.ui.publicPresenceFrame.privateWorkspace,
    publicWorkspaceLabel: en.ui.publicPresenceFrame.viewAitta,
    workspaceAriaLabel: en.ui.publicPresenceFrame.privateWorkspace,
  };
  return (
    <header className={styles['owner-topbar']} aria-label={copy.workspaceAriaLabel}>
      <div className={styles['owner-topbar-inner']}>
        <div className={styles['owner-brand']}>
          {authorized ? (
            <a className={styles['owner-wordmark']} href="/owner" aria-label={en.ui.publicPresenceFrame.manageWorkspaceAria}>{copy.manage}</a>
          ) : (
            <span className={styles['owner-wordmark']}>{copy.manage}</span>
          )}
          <span className={styles['owner-context-label']}>{copy.workspace}</span>
        </div>
        <a className={styles['owner-public-link']} href="/">{copy.publicWorkspaceLabel}</a>
      </div>
    </header>
  );
}

function OwnerFooter() {
  const copy = {
    workspace: en.ui.owner.shell.privateWorkspace,
    signOut: en.footer.signOut,
  };
  return (
    <footer className={styles['owner-footer']}>
      <div className={styles['owner-footer-inner']}>
        <span className={styles['owner-footer-label']}>{copy.workspace}</span>
        <AittaFooterResources />
        <a className={styles['owner-sign-out']} href={chatGPTSignOutPath("/")}>{copy.signOut}</a>
      </div>
    </footer>
  );
}

function OwnerNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <a href={href} aria-current={active ? "page" : undefined}>{children}</a>;
}
