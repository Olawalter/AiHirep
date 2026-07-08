"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/WalletConnect";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/panels", label: "Panels" },
  { href: "/panels/create", label: "Create Panel" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-panel-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-signal-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="font-accent text-sm text-paper-white hidden sm:block">
            AI Hiring Panel
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-display transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-white/10 text-paper-white"
                  : "text-slate-grey hover:text-paper-white hover:bg-white/5"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}
