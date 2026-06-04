"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Send, Loader2, ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

type Message = {
  _id: string;
  sender: { _id: string; username: string; avatarUrl: string };
  content: string;
  createdAt: string;
};

type ChatInfo = {
  _id: string;
  consumer: { _id: string; username: string; displayName: string; avatarUrl: string };
  creator: { _id: string; username: string; displayName: string; avatarUrl: string };
};

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    loadChat();
  }, [user, authLoading]);

  async function loadChat() {
    try {
      const [chatData, msgData] = await Promise.all([
        api.get<ChatInfo>(`/api/chats/${params.chatId}`, token!),
        api.get<{ messages: Message[] }>(`/api/chats/${params.chatId}/messages`, token!),
      ]);
      setChat(chatData);
      setMessages(msgData.messages || []);
    } catch { router.back(); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true); setWarning("");
    try {
      const msg = await api.post<Message>(`/api/chats/${params.chatId}/messages`, { content: input.trim() }, token!);
      setMessages(prev => [...prev, msg]);
      setInput("");
    } catch (err: any) {
      setWarning(err.message || "Message non envoyé");
    } finally { setSending(false); }
  }

  if (authLoading || loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
    </div>
  );

  const other = chat ? (user?._id === chat.consumer._id ? chat.creator : chat.consumer) : null;

  return (
    <div className="flex flex-col h-dvh pt-14 pb-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0f0f0f]">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white transition">
          <ChevronLeft size={20} />
        </button>
        {other && (
          <Link href={`/creator/${other.username}`} className="flex items-center gap-3">
            <img src={other.avatarUrl || "/default-avatar.svg"} alt="" className="w-9 h-9 rounded-full object-cover" />
            <div>
              <p className="text-sm font-semibold text-white">{other.displayName}</p>
              <p className="text-xs text-white/40">@{other.username}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <p className="text-sm">Démarrez la conversation ✨</p>
            <p className="text-xs mt-2 text-white/20">Pas d&apos;infos de contact · Pas de liens externes</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender._id === user?._id;
          return (
            <div key={msg._id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                <img src={msg.sender.avatarUrl || "/default-avatar.svg"} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-snug ${isMe ? "bg-[var(--rose)] text-white rounded-tr-sm" : "bg-white/10 text-white/90 rounded-tl-sm"}`}>
                {msg.content}
                <p className="text-[9px] opacity-50 mt-1">{getTimeAgo(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Warning */}
      {warning && (
        <div className="mx-4 mb-2 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{warning}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-white/8 bg-[#0f0f0f]" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <input
          className="input flex-1 rounded-full py-2.5"
          type="text"
          placeholder="Message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={500}
        />
        <button type="submit" disabled={!input.trim() || sending}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--rose)] text-white disabled:opacity-40 transition">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
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
  return new Date(dateStr).toLocaleDateString("fr-FR");
}
