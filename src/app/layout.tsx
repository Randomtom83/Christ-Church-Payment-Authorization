import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter variable, served from Google Fonts via next/font.
// Falls back to the system font stack defined in globals.css.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChurchOps",
    template: "%s · ChurchOps",
  },
  description:
    "Payment authorization & Sunday counter entry for Christ Episcopal Church Bloomfield/Glen Ridge.",
  applicationName: "ChurchOps",
  appleWebApp: {
    capable: true,
    title: "ChurchOps",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1B4F72",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only-focusable absolute left-2 top-2 z-50 rounded-md bg-primary px-4 py-2 text-base font-semibold text-primary-foreground shadow"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
