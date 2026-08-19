import { PublicPageFrame } from "@/app/_components/PublicPresenceFrame";
import { getLocale, getMessages } from "@/lib/i18n";
import { en } from "@/lib/i18n/messages/en";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Privacy · Independent Aitta" },
  description: "Public privacy commitments for this Aitta.",
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadata;
}

type PrivacySectionContent = {
  id: string;
  title: string;
  body: readonly string[];
};

type PrivacyCopy = {
  readonly title: string;
  readonly heading: string;
  readonly intro: string;
  readonly sections: readonly PrivacySectionContent[];
};

function PrivacySection({ id, title, body }: PrivacySectionContent) {
  return (
    <section className="public-information-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {body.map((paragraph) => (
        <p key={`${id}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
      ))}
    </section>
  );
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const ui = messages.ui;

  const displayName =
    typeof ui.shared.aittaName === "string" ? ui.shared.aittaName : en.ui.shared.aittaName;
  const copy = normalizePrivacyCopy(ui.owner.privacy);
  const sectionCopy = Array.isArray(copy.sections) ? copy.sections : en.ui.owner.privacy.sections;

  return (
    <PublicPageFrame
      className="privacy-shell"
      profile={null}
      displayName={displayName}
    >
      <article className="public-information-page" aria-labelledby="privacy-title">
        <header>
          <p className="eyebrow">{copy.title}</p>
          <h1 id="privacy-title">{copy.heading}</h1>
          <p className="public-information-lead">{copy.intro}</p>
        </header>

        {sectionCopy.map((section: PrivacySectionContent) => (
          <PrivacySection
            key={section.id}
            {...section}
          />
        ))}
      </article>
    </PublicPageFrame>
  );
}

function normalizePrivacyCopy(value: unknown): PrivacyCopy {
  if (!value || typeof value !== "object") {
    return en.ui.owner.privacy;
  }

  const candidate = value as {
    title?: unknown;
    heading?: unknown;
    intro?: unknown;
    sections?: unknown;
  };

  const rawSections = Array.isArray(candidate.sections)
    ? candidate.sections
      .map((entry): PrivacySectionContent | null => {
        if (!entry || typeof entry !== "object") return null;
        const section = entry as {
          id?: unknown;
          title?: unknown;
          body?: unknown;
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
        };
      })
      .filter((entry): entry is PrivacySectionContent => entry !== null)
    : [];

  return {
    title: typeof candidate.title === "string" && candidate.title.length > 0
      ? candidate.title
      : en.ui.owner.privacy.title,
    heading: typeof candidate.heading === "string" && candidate.heading.length > 0
      ? candidate.heading
      : en.ui.owner.privacy.heading,
    intro: typeof candidate.intro === "string" && candidate.intro.length > 0
      ? candidate.intro
      : en.ui.owner.privacy.intro,
    sections: rawSections.length > 0
      ? rawSections
      : en.ui.owner.privacy.sections,
  };
}
