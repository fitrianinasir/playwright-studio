"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  ClipboardList,
  FlaskConical,
  GitCompare,
  ScanSearch,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/", label: "Scenarios", icon: Workflow, match: (path: string) => path === "/" || path.startsWith("/builder") },
  { href: "/visual", label: "Figma visual", icon: Camera, match: (path: string) => path.startsWith("/visual") },
  { href: "/regression", label: "Regression", icon: GitCompare, match: (path: string) => path.startsWith("/regression") },
  { href: "/runs", label: "Reports", icon: ClipboardList, match: (path: string) => path.startsWith("/runs") },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-56 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 text-sidebar-foreground">
        <Link href="/" className="flex items-center gap-2 px-1">
          <ScanSearch className="size-5" />
          <div>
            <p className="text-sm font-semibold">Playwright Studio</p>
            <p className="text-[11px] text-muted-foreground">Visual-Testing-Automation</p>
          </div>
        </Link>
        <nav className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <Button
              key={link.href}
              variant={link.match(pathname) ? "secondary" : "ghost"}
              className="justify-start"
              asChild
            >
              <Link href={link.href}>
                <link.icon data-icon="inline-start" />
                {link.label}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/demo/webpage">
              <FlaskConical data-icon="inline-start" />
              Demo webpage
            </Link>
          </Button>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-background">{children}</div>
    </div>
  );
}
