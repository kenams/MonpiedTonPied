"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Bell, Heart, UserPlus, DollarSign, Star, Loader2 } from "lucide-react";
import Link from "next/link";

type Notif = {
  _id: string;
  type: "like" | "follow" | "purchase" | "tip" | "system";
  message: string;
  read: boolean;
  createdAt: string;
  actor?: { username: string; avatarUrl: string; displayName: string };
  link?: string;
};

const ICONS: Record<string, any> = {
  like: Heart,
  follow: UserPlus,
  purchase: DollarSign,
  tip: Star,
  system: Bell,
};

const COLORS: Record<string, string> = {
  like: "text-red-400 bg-red-400/10",
  follow: "text-purple-400 bg-purple-400/10",
  purchase: "text-green-400 bg-green-400/10",
  tip: "text-amber-400 bg-amber-400/10",
  system: "text-[var(--rose)] bg-[var(--rose)]/10",
};

export default function NotificationsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    api.get<{ notifications: Notif[] }>("/api/notifications", token!)
      .then(d => setNotifs(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Mark as read
    api.post("/api/notifications/read-all", {}, token!).catch(() => {});
  }, [user, authLoading]);

  if (authLoading || loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
    </div>
  );

  return (
    <div className="page-with-nav px-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 py-4 mb-2">
        <Bell size={20} className="text-[var(--rose)]" />
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        {notifs.filter(n => !n.read).length > 0 && (
          <span className="badge badge-rose ml-auto">{notifs.filter(n => !n.read).length} nouvelles</span>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Bell size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium mb-1">Aucune notification</p>
          <p className="text-sm">Vous serez notifié des likes, abonnements et achats</p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {notifs.map(n => {
            const Icon = ICONS[n.type] || Bell;
            const color = COLORS[n.type] || COLORS.system;
            const timeAgo = getTimeAgo(n.createdAt);

            return (
              <div
                key={n._id}
                className={`flex items-start gap-3 p-4 rounded-2xl transition ${!n.read ? "bg-[var(--rose)]/5 border border-[var(--rose)]/15" : "bg-white/4 border border-white/8"}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  {n.actor && (
                    <div className="flex items-center gap-2 mb-1">
                      <img src={n.actor.avatarUrl || "/default-avatar.svg"} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <Link href={`/creator/${n.actor.username}`} className="text-xs font-semibold text-white hover:underline">
                        @{n.actor.username}
                      </Link>
                    </div>
                  )}
                  <p className="text-sm text-white/80 leading-snug">{n.message}</p>
                  <p className="text-xs text-white/30 mt-1">{timeAgo}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--rose)] flex-shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}
