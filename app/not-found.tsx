import { PublicPageFrame } from "./_components/PublicPresenceFrame";

export default function NotFound() {
  return (
    <PublicPageFrame
      className="public-state-shell"
      profile={null}
      showPoweredBy={false}
      displayName="Independent Aitta"
      identityHref="/"
    >
      <section className="public-state-page" aria-label="Not found">
        <p className="eyebrow">404</p>
        <h1>This update is not public</h1>
        <p>It may be a draft, unpublished, deleted, or the address may be incorrect.</p>
        <a className="button" href="/">Return to Aitta</a>
      </section>
    </PublicPageFrame>
  );
}
