import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#34d399",
          colorTextOnPrimaryBackground: "#04110d",
          colorBackground: "#0d0f12",
          colorText: "#e8eaed",
          colorTextSecondary: "#9aa0aa",
          colorInputBackground: "#15181d",
          colorInputText: "#e8eaed",
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
