import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Nav from "@/components/Nav";
import GlobalChat from "@/components/GlobalChat";
import ThemeToggle from "@/components/ThemeToggle";

const eightiesComeback = localFont({
  src: "../../public/fonts/EightiesComeback-Light.otf",
  variable: "--font-eighties-comeback",
  weight: "300",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yair Golan | Head of Design",
  description:
    "Design leader building and scaling teams in complex B2B SaaS. 20+ years turning messy operational domains into clear product experiences.",
  openGraph: {
    title: "Yair Golan | Head of Design",
    description:
      "Design leader who builds and scales teams in complex B2B SaaS. Ask my AI about my experience.",
    type: "website",
  },
};

// Runs synchronously before first paint — applies dark only if user chose it.
// Light is the default so no class is needed for light mode.
const earlyThemeScript = `(function(){if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(eightiesComeback.variable, inter.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: earlyThemeScript }} />
      </head>
      <body className="antialiased font-body min-h-screen bg-bg-primary text-text-body" suppressHydrationWarning>
        <Nav />
        <ThemeToggle />

        <main className="pt-16">
          {children}
        </main>

        <GlobalChat />
      </body>
    </html>
  );
}
