/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import {
  PublicPageFrame,
} from "@/app/_components/PublicPresenceFrame";
import { TechnicalInformationSection } from "./TechnicalInformationSection";

export const metadata: Metadata = {
  title: { absolute: "Technical · Independent Aitta" },
  description: "Public protocol and machine-readable resources for this Aitta.",
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

export default function TechnicalPage() {
  return (
    <PublicPageFrame
      className="technical-shell"
      profile={null}
      displayName="Independent Aitta"
    >
      <article className="public-information-page" aria-labelledby="technical-title">
        <header>
          <p className="eyebrow">Technical</p>
          <h1 id="technical-title">Public resources for this Aitta</h1>
          <p className="public-information-lead">
            AittaSocial protocol 1.0 provides a small set of public,
            machine-readable resources. They expose public protocol,
            configured profile, and published-update information; owner details
            and drafts stay out of these responses.
          </p>
        </header>

        <TechnicalInformationSection headingId="technical-manifest" title="Manifest">
          <p>
            The discovery manifest identifies the protocol version, this
            Aitta&apos;s canonical address, and the public profile and updates
            endpoints when the Aitta is configured.
          </p>
          <p>
            <a className="public-information-link" href="/.well-known/aitta-social.json">
              Open the discovery manifest
            </a>
          </p>
        </TechnicalInformationSection>

        <TechnicalInformationSection headingId="technical-profile" title="Profile">
          <p>
            The profile resource contains the configured outward identity and
            restrained presentation choices through an explicit public field
            list.
          </p>
          <p>
            <a className="public-information-link" href="/api/v1/site">
              Open the public profile resource
            </a>
          </p>
        </TechnicalInformationSection>

        <TechnicalInformationSection headingId="technical-updates" title="Updates">
          <p>
            The updates resource lists published updates in deterministic
            newest-first pages. Drafts and unpublished updates are never part of
            the public collection.
          </p>
          <p>
            <a className="public-information-link" href="/api/v1/entries">
              Open the published updates resource
            </a>
          </p>
        </TechnicalInformationSection>

        <TechnicalInformationSection headingId="technical-usage" title="Using the resources">
          <p>
            These routes currently return JSON with the protocol 1.0 response
            shapes and cache behavior documented by this application. Resource
            links use the configured canonical Aitta URL, not the incoming
            request host.
          </p>
        </TechnicalInformationSection>
      </article>

    </PublicPageFrame>
  );
}
