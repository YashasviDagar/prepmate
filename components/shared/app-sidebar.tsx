"use client";

import {
  BarChart3Icon,
  BrainCircuitIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

export const APP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/interview/new", label: "New Interview", icon: SparklesIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/question-bank", label: "Question Bank", icon: LibraryIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 border-r md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <BrainCircuitIcon className="size-5" />
        InterviewPrep
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {APP_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="text-muted-foreground border-t p-4 text-xs">
        AI-generated practice. Not a validated assessment.
      </div>
    </aside>
  );
}
