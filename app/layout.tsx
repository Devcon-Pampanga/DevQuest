import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
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
        className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
