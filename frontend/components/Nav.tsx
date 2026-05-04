"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, BarChart2, Brain, PlusCircle } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/analyze", label: "Analyze", icon: PlusCircle },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/memory", label: "Memory", icon: Brain },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border"
      style={{ background: "rgba(6,6,10,0.9)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-accent font-bold text-lg">
          <TrendingUp size={20} />
          <span>FinTrend AI</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                path.startsWith(href)
                  ? "bg-surface-1 text-accent"
                  : "text-muted hover:text-white hover:bg-surface-0"
              )}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
