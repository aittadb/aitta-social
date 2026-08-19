import type { Messages } from "./messages/en";
import type { Locale } from "./config";
import { en } from "./messages/en";

export async function getMessages(locale: Locale): Promise<Messages> {
  try {
    switch (locale) {
      case "fi":
        return (await import("./messages/fi")).fi;
      case "en":
      default:
        return (await import("./messages/en")).en;
    }
  } catch {
    return en;
  }
}
