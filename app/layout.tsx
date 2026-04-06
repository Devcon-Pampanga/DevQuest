import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import { AuthProvider } from "@/context/AuthContext";
import Providers from "./providers";

const dmSans = localFont({
  src: "./fonts/DMSans-VariableFont.woff2",
  variable: "--font-dm-sans",
  display: "swap",
});

const agrandirBold = localFont({
  src: "./fonts/AgrandirBold.ttf",
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dev-quest-lilac.vercel.app"),
  title: "DevQuest",
  description: "Turn your volunteer work into your career.",
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
        <Providers>
          <AuthProvider>
            <InstallPrompt />
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
