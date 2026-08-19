import type { Metadata } from "next";
import { PublicPageFrame } from "@/app/_components/PublicPresenceFrame";
import { TechnicalInformationSection } from "./TechnicalInformationSection";
import { getLocale, getMessages } from "@/lib/i18n";
import { en } from "@/lib/i18n/messages/en";

type TechnicalSectionContent = {
  id: string;
  title: string;
  body: readonly string[];
  linkLabel?: string;
};

type TechnicalCopy = {
  readonly title: string;
  readonly heading: string;
  readonly intro: string;
  readonly sections: readonly TechnicalSectionContent[];
};

export const metadata: Metadata = {
  title: { absolute: "Technical · Independent Aitta" },
  description: "Public protocol and machine-readable resources for this Aitta.",
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

export default async function TechnicalPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const ui = messages.ui;

  const displayName =
    typeof ui.shared.aittaName === "string"
      ? ui.shared.aittaName
      : en.ui.shared.aittaName;

  const copy = normalizeTechnicalCopy(ui.owner.technical);
  const safeSections = Array.isArray(copy.sections) ? copy.sections : en.ui.owner.technical.sections;

  return (
    <PublicPageFrame
      className="technical-shell"
      profile={null}
      displayName={displayName}
    >
      <article className="public-information-page" aria-labelledby="technical-title">
        <header>
          <p className="eyebrow">{copy.title}</p>
          <h1 id="technical-title">{copy.heading}</h1>
          <p className="public-information-lead">{copy.intro}</p>
        </header>

        <TechnicalInformationSection headingId={safeSections[0]?.id ?? "technical-manifest"} title={safeSections[0]?.title ?? "Manifest"}>
          <p>{safeSections[0]?.body[0] ?? ""}</p>
          <p>
            <a className="public-information-link" href="/.well-known/aitta-social.json">
              {safeSections[0]?.linkLabel ?? "Open the discovery manifest"}
            </a>
          </p>
        </TechnicalInformationSection>

        <TechnicalInformationSection headingId={safeSections[1]?.id ?? "technical-profile"} title={safeSections[1]?.title ?? "Profile"}>
          <p>{safeSections[1]?.body[0] ?? ""}</p>
          <p>
            <a className="public-information-link" href="/api/v1/site">
              {safeSections[1]?.linkLabel ?? "Open the public profile resource"}
            </a>
          </p>
        </TechnicalInformationSection>

        <TechnicalInformationSection headingId={safeSections[2]?.id ?? "technical-updates"} title={safeSections[2]?.title ?? "Updates"}>
          <p>{safeSections[2]?.body[0] ?? ""}</p>
          <p>
            <a className="public-information-link" href="/api/v1/entries">
              {safeSections[2]?.linkLabel ?? "Open the published updates resource"}
            </a>
          </p>
        </TechnicalInformationSection>

        <TechnicalInformationSection headingId={safeSections[3]?.id ?? "technical-usage"} title={safeSections[3]?.title ?? "Using the resources"}>
          <p>{safeSections[3]?.body[0] ?? ""}</p>
          {safeSections[3]?.body[1] ? <p>{safeSections[3].body[1]}</p> : null}
        </TechnicalInformationSection>
      </article>
    </PublicPageFrame>
  );
}

function normalizeTechnicalCopy(value: unknown): TechnicalCopy {
  if (!value || typeof value !== "object") {
    return en.ui.owner.technical;
  }

  const candidate = value as {
    title?: unknown;
    heading?: unknown;
    intro?: unknown;
    sections?: unknown;
  };

  const normalizedSections = Array.isArray(candidate.sections)
    ? candidate.sections
      .map((entry): TechnicalSectionContent | null => {
        if (!entry || typeof entry !== "object") return null;
        const section = entry as {
          id?: unknown;
          title?: unknown;
          body?: unknown;
          linkLabel?: unknown;
        };

        if (typeof section.id !== "string" || section.id.length === 0) return null;
        if (typeof section.title !== "string" || section.title.length === 0) return null;

        const body = Array.isArray(section.body)
          ? section.body
            .filter((line): line is string => typeof line === "string" && line.length > 0)
          : [];
        const normalizedBody: readonly string[] = body.length > 0 ? body : [""];

        return {
          id: section.id,
          title: section.title,
          body: normalizedBody,
          linkLabel: typeof section.linkLabel === "string" && section.linkLabel.length > 0
            ? section.linkLabel
            : undefined,
        };
      })
      .filter((entry): entry is TechnicalSectionContent => entry !== null)
    : [];

  return {
    title: typeof candidate.title === "string" && candidate.title.length > 0
      ? candidate.title
      : en.ui.owner.technical.title,
    heading: typeof candidate.heading === "string" && candidate.heading.length > 0
      ? candidate.heading
      : en.ui.owner.technical.heading,
    intro: typeof candidate.intro === "string" && candidate.intro.length > 0
      ? candidate.intro
      : en.ui.owner.technical.intro,
    sections: normalizedSections.length > 0
      ? normalizedSections
      : en.ui.owner.technical.sections,
  };
}
