import { getRuntimeSettings } from "@/lib/runtime";
import { OwnerAccessState, OwnerShell } from "../_components/OwnerShell";
import { requireOwnerPage } from "../owner-access";
import { HubTest } from "./HubTest";

export const dynamic = "force-dynamic";

export default async function HubSetupPage() {
  const access = await requireOwnerPage("/owner/hub");
  if (access.status !== "owner") return <OwnerAccessState status={access.status} />;
  const settings = getRuntimeSettings();
  return (
    <OwnerShell displayName={access.user.displayName} current="hub">
      <header className="owner-page-header compact-header"><div><p className="eyebrow">Optional network connection</p><h1>AittaSocial Hub setup</h1><p>The public account does not depend on Hub availability. Hub verification proves only that someone could modify this deployment at one moment.</p></div></header>
      <section className="runtime-status" aria-labelledby="runtime-status-title">
        <h2 id="runtime-status-title">Protected setting status</h2>
        <div className="runtime-grid">
          <Setting label="Canonical URL" ready={Boolean(settings.canonicalUrl)} />
          <Setting label="Hub HTTPS origin" ready={Boolean(settings.hubUrl)} />
          <Setting label="Verification challenge" ready={Boolean(settings.hubChallenge)} />
          <Setting label="Deployment credential" ready={Boolean(settings.deploymentCredential)} />
        </div>
        <p className="safe-note">Values are never shown here. Update them through the Site’s protected runtime settings and redeploy.</p>
      </section>
      <section className="setup-steps" aria-labelledby="setup-steps-title">
        <h2 id="setup-steps-title">Connection sequence</h2>
        <ol>
          <li><span>01</span><div><h3>Configure this account</h3><p>Set the owner and canonical URL, deploy privately, complete the profile, and test local access.</p></div></li>
          <li><span>02</span><div><h3>Open Hub separately</h3><p>Sign in with ChatGPT at Hub and submit this deployment’s canonical URL.</p></div></li>
          <li><span>03</span><div><h3>Expose the challenge</h3><p>Save the challenge as <code>AITTA_SOCIAL_HUB_CHALLENGE</code> in protected settings and redeploy. Hub can then verify the public manifest.</p></div></li>
          <li><span>04</span><div><h3>Store the credential</h3><p>Save the issued credential as the protected secret <code>AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL</code>. Never place it in content or source.</p></div></li>
          <li><span>05</span><div><h3>Test safely</h3><p>The account sends the credential only from server code to the configured HTTPS Hub origin and reports a coarse status.</p></div></li>
        </ol>
      </section>
      <HubTest />
    </OwnerShell>
  );
}

function Setting({ label, ready }: { label: string; ready: boolean }) {
  return <div><span>{label}</span><strong className={ready ? "setting-ready" : "setting-needed"}>{ready ? "Configured" : "Needed"}</strong></div>;
}
