"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2, Crown, Send } from "lucide-react";
import Link from "next/link";
import PaywallModal from "@/components/PaywallModal";

type ChatItem = {
  _id: string;
  consumer: { _id: string; username: string; displayName: string; avatarUrl: string };
  creator: { _id: string; username: string; displayName: string; avatarUrl: string };
  lastMessage?: { content: string; createdAt: string; sender: string };
  unread?: number;
};

export default function MessagesPage() {
  const { user, token, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isPremium) { setLoading(false); return; }
    api.get<{ chats: ChatItem[] }>("/api/chats", token!)
      .then(d => setChats(d.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, isPremium]);

  if (authLoading || loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
    </div>
  );

  if (!isPremium) return (
    <>
      <div className="page-with-nav flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--rose)]/10 flex items-center justify-center mb-5">
          <Crown size={28} className="text-[var(--rose)]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Messagerie Premium</h1>
        <p className="text-sm text-white/50 mb-6 max-w-xs">
          Échangez directement avec vos créateurs favoris. Réservé aux membres premium.
        </p>
        <button onClick={() => setShowPaywall(true)} className="btn-primary px-8 rounded-full">
          Débloquer la messagerie
        </button>
      </div>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );

  return (
    <div className="page-with-nav px-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 py-4 mb-4">
        <MessageCircle size={20} className="text-[var(--rose)]" />
        <h1 className="text-xl font-bold text-white">Messages</h1>
      </div>

      {chats.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium mb-2">Aucune conversation</p>
          <p className="text-sm">Visitez le profil d&apos;un créateur pour lui écrire</p>
          <Link href="/explore" className="btn-primary mt-6 inline-flex py-2.5 px-6 rounded-full text-sm">
            Trouver des créateurs
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(chat => {
            const other = user?._id === chat.consumer._id ? chat.creator : chat.consumer;
            return (
              <Link
                key={chat._id}
                href={`/messages/${chat._id}`}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 transition"
              >
                <div className="relative flex-shrink-0">
                  <img src={other.avatarUrl || "/default-avatar.svg"} alt={other.displayName}
                    className="w-12 h-12 rounded-full object-cover" />
                  {(chat.unread || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--rose)] rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{chat.unread}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{other.displayName}</p>
                    {chat.lastMessage && (
                      <p className="text-[10px] text-white/30">{getTimeAgo(chat.lastMessage.createdAt)}</p>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    @{other.username} {chat.lastMessage ? `· ${chat.lastMessage.content.slice(0, 40)}` : "· Démarrer la conversation"}
                  </p>
                </div>
              </Link>
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
  if (m < 1) return "maintenant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}
