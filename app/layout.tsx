import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const origin = requestOrigin(requestHeaders);
  const title = "AittaSocial account";
  const description = "An independently controlled social presence with its own profile and published entries.";
  const image = origin ? `${origin}/og.png` : null;
  return {
    title: { default: title, template: "%s · AittaSocial" },
    description,
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "AittaSocial",
      ...(image ? { images: [{ url: image, width: 1733, height: 909, alt: "One deployment. One account." }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}

function requestOrigin(requestHeaders: Headers): string | null {
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",", 1)[0].trim();
  const host = forwardedHost || requestHeaders.get("host")?.trim();
  if (!host || !/^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])(?::\d{1,5})?$/i.test(host)) return null;
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",", 1)[0].trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${host}`;
}
