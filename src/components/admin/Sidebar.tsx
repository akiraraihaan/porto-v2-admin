import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  Briefcase,
  History,
  Award,
  Images,
  Share2,
  Mail,
  Settings,
  Users,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/skills", label: "Skills", icon: Wrench },
  { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
  { href: "/dashboard/experiences", label: "Experiences", icon: History },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/journey-photos", label: "Journey Photos", icon: Images },
  { href: "/dashboard/social", label: "Social Links", icon: Share2 },
  { href: "/dashboard/messages", label: "Messages", icon: Mail },
  { href: "/dashboard/settings", label: "Site Settings", icon: Settings },
  { href: "/dashboard/users", label: "Users", icon: Users },
];

export default function Sidebar({ siteUrl }: { siteUrl?: string }) {
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 shrink-0 h-full bg-white border-r border-neutral-200 flex flex-col">
      <div className="px-5 py-6 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-white font-extrabold text-sm">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 leading-tight">Portfolio Admin</p>
            <p className="text-[11px] text-gray-500">porto-v2-admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-gray-500 hover:text-neutral-900 hover:bg-neutral-100"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-200 space-y-1">
        <a
          href={siteUrl || "http://localhost:4321"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <ExternalLink className="size-4" />
          View Site
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
