import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { getTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

// One-time migration for browsers that only have a theme in localStorage
// from before theme moved to a cookie (see lib/theme.ts). Once the cookie
// is set, the server renders the right `data-theme` directly and this is a
// no-op — it never fights the server-rendered value on later navigations.
const THEME_MIGRATE_SCRIPT = `
(function () {
  try {
    if (document.cookie.indexOf("${THEME_COOKIE}=") !== -1) return;
    var stored = localStorage.getItem("devmeter-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
      document.cookie = "${THEME_COOKIE}=" + stored + "; path=/; max-age=31536000; SameSite=Lax";
    }
  } catch (e) {}
})();
`;

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "DevMeter",
  description:
    "Know what every ticket really costs you — time and AI spend, tracked automatically.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Script id="theme-migrate" strategy="beforeInteractive">
          {THEME_MIGRATE_SCRIPT}
        </Script>
        <NextTopLoader color="#3ee08a" showSpinner={false} height={2} />
        {children}
      </body>
    </html>
  );
}
