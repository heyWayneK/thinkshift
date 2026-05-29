import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import Script from "next/script";
import ConvexClientProvider from "./ConvexClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Required for og:image / twitter:image to resolve to absolute URLs in the
// rendered <meta> tags. WhatsApp, iMessage, Slack, Facebook and Twitter all
// refuse relative image paths, so without this they'd silently show no image.
// Apex (not www) per the canonical-host decision in deployment notes.
export const metadata: Metadata = {
  metadataBase: new URL("https://thinkshift-ai.com"),
  title: "ThinkShift — Let's Build a Business Together",
  description:
    "You bring the industry depth and the niche community inroads. ThinkShift plugs in a complete business-in-a-box growth engine — handling 100% of the tech, engineering, custom platforms, and advanced go-to-market execution.",
  openGraph: {
    title: "ThinkShift — Let's Build a Business Together",
    description:
      "The business-in-a-box growth engine. You bring the market, we bring the full-stack engineering and go-to-market execution.",
    siteName: "ThinkShift",
    type: "website",
    url: "/",
    // First image is the universal default (most scrapers pick index 0).
    // The square is offered second so clients that explicitly prefer 1:1
    // (some WhatsApp / iMessage versions) can pick it up.
    images: [
      {
        url: "/og_image_1200x630.jpg",
        width: 1200,
        height: 630,
        alt: "ThinkShift — Let's build your business together",
      },
      {
        url: "/og_image_square.jpg",
        width: 1200,
        height: 1200,
        alt: "ThinkShift — Let's build your business together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ThinkShift — Let's Build a Business Together",
    description:
      "The business-in-a-box growth engine. You bring the market, we bring the full-stack engineering and go-to-market execution.",
    images: ["/og_image_1200x630.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
      appearance={{
        // Runtime clerk-js is v6 (instance display_config.clerk_js_version),
        // so the theme MUST come from `@clerk/ui/themes` (v6 schema), not
        // the Core-2 `@clerk/themes`. Feeding a `@clerk/themes@2` `dark`
        // object to clerk-js v6 throws and blanks every Clerk component.
        theme: dark,
        options: {
          // v6 renamed the Core-2 `layout` block to `options`.
          // Dashboard logo is the black variant -> invisible on the dark
          // card; force the white asset for our dark theme.
          logoImageUrl: "/thinkshift_logo_white.svg",
          logoLinkUrl: "/",
        },
        variables: {
          // clerk-js v6 (@clerk/ui) renamed several Core-2 variable keys;
          // old names are silently dropped, so use the v6 names.
          colorPrimary: "#34d399",
          colorPrimaryForeground: "#04110d", // was colorTextOnPrimaryBackground
          colorBackground: "#0d0f12",
          colorForeground: "#e8eaed", // was colorText
          colorMutedForeground: "#9aa0aa", // was colorTextSecondary
          colorInput: "#15181d", // was colorInputBackground
          colorInputForeground: "#e8eaed", // was colorInputText
          colorNeutral: "#e8eaed",
          colorShimmer: "rgba(255,255,255,0.08)",
          borderRadius: "0.6rem",
        },
        elements: {
          // Keep modals/cards on our surface with readable borders.
          card: "bg-[#0d0f12] border border-white/10 shadow-2xl",
          modalContent: "bg-[#0d0f12]",
          modalCloseButton: "text-[#9aa0aa] hover:text-white",
          headerTitle: "text-[#e8eaed]",
          headerSubtitle: "text-[#9aa0aa]",
          socialButtonsBlockButton:
            "border border-white/15 text-[#e8eaed] hover:bg-white/5",
          formFieldLabel: "text-[#e8eaed]",
          formFieldInput: "bg-[#15181d] border border-white/15 text-[#e8eaed]",
          formButtonPrimary:
            "bg-[#34d399] text-[#04110d] font-semibold hover:brightness-110",
          footerActionText: "text-[#9aa0aa]",
          footerActionLink: "text-[#34d399] hover:text-[#22d3ee]",
          dividerText: "text-[#9aa0aa]",
          dividerLine: "bg-white/10",
          userButtonPopoverCard: "bg-[#0d0f12] border border-white/10",
          userButtonPopoverActionButton: "text-[#e8eaed] hover:bg-white/5",
          organizationSwitcherPopoverCard:
            "bg-[#0d0f12] border border-white/10",
          organizationPreviewMainIdentifier: "text-[#e8eaed]",
          organizationSwitcherTrigger:
            "text-[#e8eaed] border border-white/15 hover:bg-white/5",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=AW-18196687762"
            strategy="afterInteractive"
          />
          <Script id="google-ads-tag" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18196687762');`}
          </Script>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
