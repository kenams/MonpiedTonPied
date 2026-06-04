"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/",          icon: Home,           label: "Feed",     public: true },
  { href: "/explore",   icon: Compass,        label: "Explorer", public: true },
  { href: "/favorites", icon: Heart,          label: "Favoris",  public: false },
  { href: "/messages",  icon: MessageCircle,  label: "Messages", public: false },
  { href: "/profile",   icon: User,           label: "Profil",   public: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on feed (full screen TikTok)
  if (pathname === "/" ) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
      style={{
        background: "linear-gradient(to top, rgba(8,8,8,0.98) 60%, transparent 100%)",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        paddingTop: "12px",
      }}
    >
      {NAV.map(({ href, icon: Icon, label, public: isPublic }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={user || isPublic ? href : "/auth/login"}
            className={`flex flex-col items-center gap-1 min-w-[44px] transition-all ${
              active ? "text-[var(--rose)]" : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[9px] font-medium tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
