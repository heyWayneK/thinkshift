import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
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

export const metadata: Metadata = {
  title: "ThinkShift — Let's Build a Business Together",
  description:
    "You bring the industry depth and the niche community inroads. ThinkShift plugs in a complete business-in-a-box growth engine — handling 100% of the tech, engineering, custom platforms, and advanced go-to-market execution.",
  openGraph: {
    title: "ThinkShift — Let's Build a Business Together",
    description:
      "The business-in-a-box growth engine. You bring the market, we bring the full-stack engineering and go-to-market execution.",
    type: "website",
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
          formFieldInput:
            "bg-[#15181d] border border-white/15 text-[#e8eaed]",
          formButtonPrimary:
            "bg-[#34d399] text-[#04110d] font-semibold hover:brightness-110",
          footerActionText: "text-[#9aa0aa]",
          footerActionLink: "text-[#34d399] hover:text-[#22d3ee]",
          dividerText: "text-[#9aa0aa]",
          dividerLine: "bg-white/10",
          userButtonPopoverCard: "bg-[#0d0f12] border border-white/10",
          userButtonPopoverActionButton:
            "text-[#e8eaed] hover:bg-white/5",
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
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
