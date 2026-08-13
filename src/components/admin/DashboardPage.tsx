import { useEffect, useState } from "react";
import {
  Wrench,
  Briefcase,
  History,
  Award,
  Images,
  Users,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

interface Stats {
  counts: {
    skills: number;
    projects: number;
    experiences: number;
    certificates: number;
    journeyPhotos: number;
    social: number;
    messages: number;
    unreadMessages: number;
    users: number;
  };
  recentMessages: {
    id: string;
    name: string;
    email: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
}

const CARDS = [
  { key: "skills", label: "Skills", href: "/dashboard/skills", icon: Wrench },
  { key: "projects", label: "Projects", href: "/dashboard/projects", icon: Briefcase },
  { key: "experiences", label: "Experiences", href: "/dashboard/experiences", icon: History },
  { key: "certificates", label: "Certificates", href: "/dashboard/certificates", icon: Award },
  { key: "journeyPhotos", label: "Journey Photos", href: "/dashboard/journey-photos", icon: Images },
  { key: "users", label: "Admin Users", href: "/dashboard/users", icon: Users },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm py-10">Memuat dashboard...</div>;
  }

  const c = stats?.counts;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan konten yang terhubung ke database bersama (porto-v2 &amp; admin).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {CARDS.map((card) => (
          <a
            key={card.key}
            href={card.href}
            className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-sm transition-all"
          >
            <card.icon className="size-5 text-neutral-900 mb-3" />
            <p className="text-3xl font-bold text-neutral-900">{c?.[card.key as keyof typeof c] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </a>
        ))}
        <a
          href="/dashboard/messages"
          className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-sm transition-all"
        >
          <MessageSquare className="size-5 text-neutral-900 mb-3" />
          <p className="text-3xl font-bold text-neutral-900">{c?.messages ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            Messages{" "}
            {(c?.unreadMessages ?? 0) > 0 && (
              <span className="text-red-600 font-semibold">
                ({c?.unreadMessages} belum dibaca)
              </span>
            )}
          </p>
        </a>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900 text-sm">Pesan Terbaru</h2>
          <a
            href="/dashboard/messages"
            className="flex items-center gap-1 text-xs text-neutral-900 hover:underline"
          >
            Lihat semua <ArrowRight className="size-3" />
          </a>
        </div>
        {stats?.recentMessages && stats.recentMessages.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {stats.recentMessages.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={
                      m.read
                        ? "bg-neutral-100 text-gray-500"
                        : "bg-neutral-900 text-white"
                    }
                  >
                    {m.read ? "Dibaca" : "Baru"}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.email}</span>
                  <span className="ml-auto text-[11px] text-gray-400">
                    {new Date(m.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{m.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            Belum ada pesan masuk.
          </div>
        )}
      </div>
    </div>
  );
}
