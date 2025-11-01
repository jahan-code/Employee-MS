"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, X, ChevronLeft, ChevronRight, Circle } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

declare global {
  interface WindowEventMap {
    "company-settings-sync": Event;
  }
}

export function AppShell({
  children,
  nav,
  title,
  subtitle,
  breadcrumbs,
  companyName,
  settingsNav,
}: {
  children: React.ReactNode;
  nav: NavItem[];
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  companyName?: string;
  settingsNav?: NavItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname?.() ?? "";
  const safeName = companyName?.trim() || "Employee MS";
  const [clientSettings, setClientSettings] = useState<{
    name?: string;
    logoUrl?: string;
    logoFileName?: string;
    officeStart?: string;
    officeEnd?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = () => {
      try {
        const raw = window.localStorage.getItem("company-settings");
        if (!raw) {
          setClientSettings(null);
          return;
        }
        const parsed = JSON.parse(raw) as {
          name?: string;
          logoUrl?: string;
          logoFileName?: string;
          officeStart?: string;
          officeEnd?: string;
        } | null;
        setClientSettings(parsed ?? null);
      } catch {
        setClientSettings(null);
      }
    };

    syncFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "company-settings") {
        syncFromStorage();
      }
    };

    const handleCustom = () => syncFromStorage();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("company-settings-sync", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("company-settings-sync", handleCustom);
    };
  }, []);

  const displayName = clientSettings?.name?.trim() || safeName;
  const logoUrl = clientSettings?.logoUrl?.trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .padEnd(2, "M");
  const allNavItems = [...nav, ...(settingsNav ?? [])];
  const activeHref = allNavItems.reduce<string | null>((best, item) => {
    const href = item.href;
    const exactMatch = pathname === href;
    const descendantMatch = !exactMatch && href !== "/" && pathname.startsWith(`${href}/`);
    if (exactMatch || descendantMatch) {
      if (!best || href.length > best.length) {
        return href;
      }
    }
    return best;
  }, null);
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur shadow-lg transition-colors">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors sm:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="text-lg font-semibold tracking-tight hover:text-primary transition-colors">
              {displayName}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile overlay backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 top-14 z-40 bg-background/70 backdrop-blur-sm sm:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <aside
          className={cn(
            "transition-all duration-300 ease-in-out",
            mobileOpen
              ? "fixed top-14 bottom-0 left-0 z-50 w-72 translate-x-0"
              : "fixed top-14 bottom-0 left-0 z-50 w-72 -translate-x-full",
            "sm:translate-x-0 sm:static sm:z-auto",
            collapsed ? "sm:w-18" : "sm:w-72",
            "overflow-hidden border-r border-border/80 bg-linear-to-b from-card via-card/95 to-muted/40 backdrop-blur-xl shadow-xl"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold tracking-wide text-foreground transition-colors hover:text-primary",
                  collapsed && "px-0"
                )}
              >
                {logoUrl ? (
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    <Image src={logoUrl} alt={`${displayName} logo`} width={32} height={32} className="h-full w-full object-cover" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {initials}
                  </span>
                )}
                <span className={cn("text-base", collapsed && "hidden")}>{displayName}</span>
              </Link>
              <button
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            <nav aria-label="Sidebar navigation" className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
              <ul className="space-y-1.5">
                {nav.map((n) => {
                  const active = activeHref === n.href;
                  const Icon = n.icon;
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-primary/15 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? n.label : undefined}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card shadow-sm transition-colors",
                            active ? "border-primary/60 text-primary" : "group-hover:border-border"
                          )}
                        >
                          {Icon ? (
                            <span className="h-4 w-4 text-inherit">{Icon}</span>
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </span>
                        <div className={cn("flex-1 truncate text-left", collapsed && "hidden")}>{n.label}</div>
                        {active && !collapsed ? (
                          <span className="ml-auto h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {settingsNav?.length ? (
                <div className="mt-6 border-t border-border/60 pt-4">
                  {!collapsed ? (
                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</p>
                  ) : null}
                  <ul className="space-y-1.5">
                    {settingsNav.map((n) => {
                      const active = activeHref === n.href;
                      const Icon = n.icon;
                      return (
                        <li key={n.href}>
                          <Link
                            href={n.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                              active
                                ? "bg-primary/15 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                              collapsed && "justify-center"
                            )}
                            title={collapsed ? n.label : undefined}
                          >
                            <span
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card shadow-sm transition-colors",
                                active ? "border-primary/60 text-primary" : "group-hover:border-border"
                              )}
                            >
                              {Icon ? (
                                <span className="h-4 w-4 text-inherit">{Icon}</span>
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                            </span>
                            <div className={cn("flex-1 truncate text-left", collapsed && "hidden")}>{n.label}</div>
                            {active && !collapsed ? (
                              <span className="ml-auto h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </nav>
            <div className="border-t border-border/60 p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full justify-center"
              >
                Logout
              </Button>
            </div>
          </div>
        </aside>
        <main
          className={cn(
          "flex-1 overflow-x-hidden transition-all duration-300 ease-in-out sm:min-h-[calc(100vh-3.5rem)]",
          collapsed ? "sm:ml-0" : "sm:ml-0"
        )}>
          <div className="h-full px-6 py-6 lg:px-8">
            {(breadcrumbs && breadcrumbs.length > 0) || title ? (
              <div className="mb-6 space-y-1">
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
                    <ol className="flex flex-wrap items-center gap-1">
                      {breadcrumbs.map((b, i) => (
                        <li key={`${b.label}-${i}`} className="flex items-center gap-1">
                          {b.href ? (
                            <Link href={b.href} className="underline hover:text-foreground">{b.label}</Link>
                          ) : (
                            <span>{b.label}</span>
                          )}
                          {i < breadcrumbs.length - 1 ? <span>›</span> : null}
                        </li>
                      ))}
                    </ol>
                  </nav>
                ) : null}
                {title ? (
                  <>
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
                  </>
                ) : null}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
