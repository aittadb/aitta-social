import type { Metadata } from "next";
import { getProfile, listPublishedEntries } from "@/db/repository";
import {
  publicPresenceMetadata,
  unavailablePublicMetadata,
} from "@/lib/public-metadata";
import type { Messages } from "@/lib/i18n/messages/en";
import type { Entry, Profile } from "@/lib/types";
import { getLocale, getMessages } from "@/lib/i18n";
import {
  ConfiguredPresence,
  UnavailablePresence,
  UnconfiguredPresence,
} from "./page-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [profile] = await Promise.all([
      getProfile(),
      listPublishedEntries(12),
    ]);
    return publicPresenceMetadata(profile);
  } catch {
    return unavailablePublicMetadata();
  }
}

export default async function Home() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const publicCopy = {
    common: messages.common,
    deploymentPrompt: messages.deploymentPrompt,
    home: messages.home,
    entry: messages.entry,
    footer: messages.footer,
    shared: messages.ui.shared,
  } as const satisfies {
    common: Messages["common"];
    deploymentPrompt: Messages["deploymentPrompt"];
    home: Messages["home"];
    entry: Messages["entry"];
    footer: Messages["footer"];
    shared: Messages["ui"]["shared"];
  };

  const account = await loadAccount();
  if (account.status === "unavailable") {
    return <UnavailablePresence messages={publicCopy} />;
  }

  const { profile, entries } = account;
  if (!profile) {
    return (
      <UnconfiguredPresence
        entries={entries}
        locale={locale}
        messages={publicCopy}
      />
    );
  }

  return (
    <ConfiguredPresence
      profile={profile}
      entries={entries}
      locale={locale}
      messages={publicCopy}
    />
  );
}

type AccountLoad =
  | { status: "ready"; profile: Profile | null; entries: Entry[] }
  | { status: "unavailable" };

async function loadAccount(): Promise<AccountLoad> {
  try {
    const profile = await getProfile();
    const { entries } = await listPublishedEntries(12);
    return { status: "ready", profile, entries };
  } catch {
    return { status: "unavailable" };
  }
}
