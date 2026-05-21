"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  LogIn,
  UserPlus,
  LogOut,
  Refrigerator,
  ShoppingBasket,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Inventory and stats" },
  { href: "/shopping", label: "Shopping list", icon: ShoppingBasket, desc: "Plan what to buy" },
  { href: "/planner", label: "Meal planner", icon: CalendarDays, desc: "Five meals for the week" },
  { href: "/recipe", label: "AI chef", icon: UtensilsCrossed, desc: "Recipes from your fridge" },
];

export function AppSidebar() {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="py-5 px-4 border-b border-sidebar-border/60">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm group-hover:scale-105 transition-transform">
            <Refrigerator className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h2 className="text-lg font-black text-primary tracking-tight">V-Fridge</h2>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Smart Kitchen</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.desc}
                    className="data-[active=true]:bg-secondary data-[active=true]:text-secondary-foreground data-[active=true]:font-semibold rounded-lg"
                  >
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Account
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/settings"}
                className="data-[active=true]:bg-secondary data-[active=true]:text-secondary-foreground rounded-lg"
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <SidebarMenu>
          {status === "authenticated" && user ? (
            <SidebarMenuItem className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/40">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold shrink-0">
                  {(user.username || user.email || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{user.username || "Guest"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <SidebarMenuButton
                onClick={logout}
                className="w-full justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem className="flex flex-col gap-2">
              <SidebarMenuButton
                asChild
                className="w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm"
              >
                <Link href="/signin">
                  <LogIn className="mr-2 h-4 w-4" /> Sign in
                </Link>
              </SidebarMenuButton>
              <SidebarMenuButton
                asChild
                className="w-full justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg"
              >
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Create account
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
