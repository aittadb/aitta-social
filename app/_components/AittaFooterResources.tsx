import { en } from "@/lib/i18n/messages/en";

type FooterCopy = {
  technicalResourcesAria: string;
  privacy: string;
  technical: string;
  githubAria: string;
  github: string;
  manifest: string;
  profile: string;
  updates: string;
};

export function AittaFooterResources({ copy = en.ui.footer }: { copy?: FooterCopy }) {
  return (
    <nav className="technical-links" aria-label={copy.technicalResourcesAria}>
      <a href="/privacy">{copy.privacy}</a>
      <a href="/technical">{copy.technical}</a>
      <a
        href="https://github.com/aittadb/aitta-social"
        rel="noopener noreferrer"
        aria-label={copy.githubAria}
      >
        {copy.github}
      </a>
      <a href="/.well-known/aitta-social.json">{copy.manifest}</a>
      <a href="/api/v1/site">{copy.profile}</a>
      <a href="/api/v1/entries">{copy.updates}</a>
    </nav>
  );
}
