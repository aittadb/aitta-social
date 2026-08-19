import { PublicPageFrame } from "./_components/PublicPresenceFrame";
import { getLocale, getMessages } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const copy = {
    ariaLabel: messages.ui.notFound.ariaLabel,
    headline: messages.ui.notFound.title,
    body: messages.ui.notFound.body,
    returnToAitta: messages.ui.notFound.returnToAitta,
    ownerName: messages.ui.shared.aittaName,
  };
  return (
    <PublicPageFrame
      className="public-state-shell"
      profile={null}
      displayName={copy.ownerName}
    >
      <section className="public-state-page" aria-label={copy.ariaLabel}>
        <p className="eyebrow">404</p>
        <h1>{copy.headline}</h1>
        <p>{copy.body}</p>
        <a className="button" href="/">{copy.returnToAitta}</a>
      </section>
    </PublicPageFrame>
  );
}
