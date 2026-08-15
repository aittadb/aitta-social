/* eslint-disable react-refresh/only-export-components */
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

        <section className="public-information-section" aria-labelledby="privacy-public">
          <h2 id="privacy-public">What is public</h2>
          <p>
            A configured profile and published updates are public through the
            human pages and protocol 1.0 resources. Public data can include the
            display name, description, About text, optional profile links,
            presentation choices, published update content and timestamps,
            stable update identifiers, canonical URLs, and the discovery
            manifest.
          </p>
          <p>
            Publishing makes an update readable without sign-in. Unpublishing
            removes it from this Aitta&apos;s public views, but cannot recall a
            copy already saved, indexed, quoted, or cached elsewhere.
          </p>
        </section>

        <section className="public-information-section" aria-labelledby="privacy-private">
          <h2 id="privacy-private">What stays private</h2>
          <p>
            Drafts and unpublished updates remain in this Aitta&apos;s own D1
            database and are available only through the private owner workspace.
            A signed-in visitor who is not the configured sole owner receives
            none of that owner-only content.
          </p>
          <p>
            Sign in with ChatGPT is used only for local owner administration.
            The server compares the signed-in email with a protected owner
            setting. This Aitta does not store that ChatGPT identity in D1,
            publish it as the profile, or treat it as AittaSocial network
            membership.
          </p>
        </section>

        <section className="public-information-section" aria-labelledby="privacy-settings">
          <h2 id="privacy-settings">Protected settings</h2>
          <p>
            Owner authorization and other protected runtime settings remain on
            the server. Their values are not included in public pages or public
            data resources. A normalized canonical URL is public when configured,
            and a Hub verification challenge is public in the manifest only
            while the owner explicitly configures one.
          </p>
        </section>

        <section className="public-information-section" aria-labelledby="privacy-sites">
          <h2 id="privacy-sites">ChatGPT Sites boundary</h2>
          <p>
            ChatGPT Sites provides this app&apos;s hosting, D1 storage, and sign-in
            processing boundary. Provider-level request processing, access
            policy, backups, and retention are outside this application&apos;s
            direct control. This Aitta does not add its own identity provider,
            shared content database, or external content store.
          </p>
        </section>

        <section className="public-information-section" aria-labelledby="privacy-network">
          <h2 id="privacy-network">Network and analytics</h2>
          <p>
            This Aitta currently has no Hub connection, outbound Hub probe,
            registration, or network credential flow. Public profile and update
            reads continue to work without the AittaSocial Hub.
          </p>
          <p>
            The application adds no analytics subsystem, advertising, tracking
            feature, media store, or browser-storage record for profile and
            update content.
          </p>
        </section>

        <section className="public-information-section" aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">Retention and owner control</h2>
          <p>
            Profile saves replace the stored profile values. Drafts remain until
            the owner publishes or deletes them. Unpublishing retains an update
            privately; deleting removes the application record. Hosting backups
            or provider recovery retention may continue outside this app&apos;s
            direct control.
          </p>
        </section>
      </article>

    </PublicPageFrame>
  );
}
