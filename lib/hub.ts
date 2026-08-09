import type { RuntimeSettings } from "./runtime";

export type HubProbeResult = {
  status:
    | "connected"
    | "credentialRejected"
    | "reachable"
    | "unavailable";
  message: string;
};

export async function probeHub(
  settings: RuntimeSettings,
  fetcher: typeof fetch = fetch,
): Promise<HubProbeResult> {
  if (!settings.hubUrl || !settings.deploymentCredential) {
    return {
      status: "unavailable",
      message: "Add the Hub URL and deployment credential in protected runtime settings.",
    };
  }

  const target = configuredHubOrigin(settings.hubUrl);
  if (!target) {
    return {
      status: "unavailable",
      message: "The Hub URL must be a plain HTTPS origin.",
    };
  }

  try {
    const response = await fetcher(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${settings.deploymentCredential}`,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return { status: "connected", message: "The configured Hub accepted the probe." };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        status: "credentialRejected",
        message: "The Hub is reachable but did not accept the deployment credential.",
      };
    }
    return {
      status: "reachable",
      message: "The Hub responded, but no credential contract is confirmed yet.",
    };
  } catch {
    return {
      status: "unavailable",
      message: "The Hub could not be reached. Public account pages remain available.",
    };
  }
}

export function configuredHubOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== "/" && url.pathname !== "")
    ) return null;
    return `${url.origin}/`;
  } catch {
    return null;
  }
}
