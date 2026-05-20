import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SessionProvider from "@/providers/session-provider";
import { Toaster } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Refrigerator } from "lucide-react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "V-Fridge — Розумний холодильник з AI-кухарем",
  description: "Керуйте продуктами, відстежуйте терміни придатності та отримуйте персональні рецепти від AI-кухаря Gemini.",
  themeColor: "#8C5383",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full bg-ambient`}>
        <SessionProvider>
          <SidebarProvider className="h-full">
            <AppSidebar />
            <SidebarInset className="h-full flex flex-col">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 backdrop-blur px-4 lg:hidden">
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
        </SessionProvider>
      </body>
    </html>
  );
}
