import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { FridgeProvider } from "@/providers/fridge-provider";
import { Toaster } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Refrigerator } from "lucide-react";

// Inlined in <head> so the .dark class is on <html> before React paints — avoids the
// white flash on dark-mode users. Reads the same vf_theme key the ThemeProvider uses.
const themeBootstrapScript = `
(function(){
  try {
    var pref = localStorage.getItem('vf_theme') || 'system';
    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (_) { /* localStorage blocked — fall back to light */ }
})();
`;

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "V-Fridge — Smart fridge with an AI chef",
  description: "Track your groceries, watch expiry dates, and get personal recipes from an AI chef.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF8A1F",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Locale + dictionary come from i18n/request.ts (cookie-driven). Loaded on
  // the server so the very first paint speaks the user's language — no client
  // round-trip and no flash of English.
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} h-full bg-ambient`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <FridgeProvider>
              <SidebarProvider defaultOpen={false} className="h-full">
                <AppSidebar />
                <SidebarInset className="h-full flex flex-col">
                  <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 backdrop-blur px-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-sm">
                        <Refrigerator className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-primary tracking-tight">V-Fridge</span>
                    </div>
                  </header>
                  <main className="flex-1 overflow-y-auto relative">
                    {children}
                    <Toaster richColors position="top-center" closeButton />
                  </main>
                </SidebarInset>
              </SidebarProvider>
              </FridgeProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
