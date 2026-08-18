import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  MailOpen,
  CheckCheck,
  Trash2,
  Reply,
  User,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = messages.filter((m) => !m.read).length;

  const markAsRead = async (id: string) => {
    const msg = messages.find((m) => m.id === id);
    if (msg?.read) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    try {
      await fetch(`/api/admin/messages/${id}/read`, { method: "POST" });
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: false } : m)));
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    try {
      await fetch("/api/admin/messages/read-all", { method: "POST" });
    } catch {
      await load();
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteMessage = async (id: string) => {
    const removed = messages.find((m) => m.id === id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    } catch {
      if (removed) setMessages((prev) => [...prev, removed]);
    }
  };

  const toggleExpand = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) markAsRead(id);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-neutral-900">Contact Messages</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Mail className="size-8 mx-auto mb-2 opacity-40" />
          No messages yet.
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "group border rounded-xl transition-all duration-200 cursor-pointer",
                msg.read
                  ? "bg-white border-neutral-200 hover:border-neutral-300"
                  : "bg-white border-neutral-900 shadow-sm hover:shadow-md"
              )}
              onClick={() => toggleExpand(msg.id)}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5">
                  {msg.read ? (
                    <MailOpen className="size-4 text-neutral-400" />
                  ) : (
                    <Mail className="size-4 text-neutral-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-sm font-semibold truncate",
                        msg.read ? "text-neutral-600" : "text-neutral-900"
                      )}
                    >
                      {msg.name}
                    </span>
                    {!msg.read && (
                      <span className="size-1.5 rounded-full bg-neutral-900 shrink-0" />
                    )}
                    <span className="text-[11px] text-gray-400 ml-auto shrink-0 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] text-gray-400">{msg.email}</span>
                  </div>

                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      expandedId === msg.id
                        ? "text-neutral-700 whitespace-pre-wrap"
                        : msg.read
                        ? "text-gray-500 line-clamp-2"
                        : "text-neutral-700 line-clamp-2"
                    )}
                  >
                    {msg.message}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a
                    href={`mailto:${msg.email}?subject=Re: Your message&body=Hi ${msg.name},%0D%0A%0D%0A`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    title="Reply via email"
                  >
                    <Reply className="size-3.5" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(msg.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
