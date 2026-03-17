import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const agrandirBold = localFont({
  src: "./fonts/AgrandirBold.ttf",
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dev-quest-lilac.vercel.app"),
  title: "DevQuest",
  description: "Turn your volunteer work into your career.",
  themeColor: "#0a0a0f",
  appleWebApp: {
    capable: true,
    title: "DevQuest",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    images: [{ url: "/banner.png", alt: "DevQuest" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${agrandirBold.variable} antialiased`}
      >
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
