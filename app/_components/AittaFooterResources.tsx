/** Fixed Aitta resources shared by public and private human-page footers. */
import styles from "./AittaFooterResources.module.css";

export function AittaFooterResources() {
  return (
    <nav className={styles['footer-resources']} aria-label="Technical resources">
      <a href="/privacy">Privacy</a>
      <a href="/technical">Technical</a>
      <a
        href="https://github.com/aittadb/aitta-social"
        rel="noopener noreferrer"
        aria-label="AittaSocial source on GitHub"
      >
        GitHub
      </a>
      <a href="/.well-known/aitta-social.json">Manifest</a>
      <a href="/api/v1/site">Profile</a>
      <a href="/api/v1/entries">Updates</a>
    </nav>
  );
}
