import type { Metadata } from "next";
import {
  PublicPageFrame,
} from "@/app/_components/PublicPresenceFrame";

export const metadata: Metadata = {
  title: { absolute: "Privacy · Independent Aitta" },
  description: "How this independently controlled Aitta handles public and private data.",
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

type PrivacySection = {
  id: string;
  heading: string;
  body: string[];
};

const privacySections: PrivacySection[] = [
  {
    id: "privacy-public",
    heading: "What is public",
    body: [
      "A configured profile and published updates are public through the human pages and protocol 1.0 resources. Public data can include the display name, description, About text, optional profile links, presentation choices, published update content and timestamps, stable update identifiers, canonical URLs, and the discovery manifest.",
      "Publishing makes an update readable without sign-in. Unpublishing removes it from this Aitta’s public views, but cannot recall a copy already saved, indexed, quoted, or cached elsewhere.",
    ],
  },
  {
    id: "privacy-private",
    heading: "What stays private",
    body: [
      "Drafts and unpublished updates remain in this Aitta’s own D1 database and are available only through the private owner workspace. A signed-in visitor who is not the configured sole owner receives none of that owner-only content.",
      "Sign in with ChatGPT is used only for local owner administration. The server compares the signed-in email with a protected owner setting. This Aitta does not store that ChatGPT identity in D1, publish it as the profile, or treat it as AittaSocial network membership.",
    ],
  },
  {
    id: "privacy-settings",
    heading: "Protected settings",
    body: [
      "Owner authorization and other protected runtime settings remain on the server. Their values are not included in public pages or public data resources. A normalized canonical URL is public when configured, and a Hub verification challenge is public in the manifest only while the owner explicitly configures one.",
    ],
  },
  {
    id: "privacy-sites",
    heading: "ChatGPT Sites boundary",
    body: [
      "ChatGPT Sites provides this app’s hosting, D1 storage, and sign-in processing boundary. Provider-level request processing, access policy, backups, and retention are outside this application’s direct control. This Aitta does not add its own identity provider, shared content database, or external content store.",
    ],
  },
  {
    id: "privacy-network",
    heading: "Network and analytics",
    body: [
      "This Aitta currently has no Hub connection, outbound Hub probe, registration, or network credential flow. Public profile and update reads continue to work without the AittaSocial Hub.",
      "The application adds no analytics subsystem, advertising, tracking feature, media store, or browser-storage record for profile and update content.",
    ],
  },
  {
    id: "privacy-retention",
    heading: "Retention and owner control",
    body: [
      "Profile saves replace the stored profile values. Drafts remain until the owner publishes or deletes them. Unpublishing retains an update privately; deleting removes the application record. Hosting backups or provider recovery retention may continue outside this app’s direct control.",
    ],
  },
];

function PrivacySection({ id, heading, body }: PrivacySection) {
  return (
    <section className="public-information-section" aria-labelledby={id}>
      <h2 id={id}>{heading}</h2>
      {body.map((paragraph) => (
        <p key={`${id}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
      ))}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <PublicPageFrame
      className="privacy-shell"
      profile={null}
      displayName="Independent Aitta"
    >
      <article className="public-information-page" aria-labelledby="privacy-title">
        <header>
          <p className="eyebrow">Privacy</p>
          <h1 id="privacy-title">How this Aitta handles data</h1>
          <p className="public-information-lead">
            This page describes the current application behavior. It does not
            invent an operator identity, contact address, consent service, or
            legal promise for the owner of this Aitta.
          </p>
        </header>

        {privacySections.map((section) => (
          <PrivacySection key={section.id} {...section} />
        ))}
      </article>

    </PublicPageFrame>
  );
}
