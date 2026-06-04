"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings, LogOut, Crown, Shield, Grid3X3,
  CreditCard, Heart, ChevronRight, Loader2
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, loading, isCreator, isPremium } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const menuItems = [
    ...(isCreator ? [{ label: "Dashboard créateur", href: "/dashboard", icon: Grid3X3 }] : []),
    { label: "Favoris", href: "/favorites", icon: Heart },
    { label: "Abonnement & facturation", href: "/billing", icon: CreditCard },
    { label: "Paramètres", href: "/profile/settings", icon: Settings },
  ];

  return (
    <div className="page-with-nav px-4 max-w-lg mx-auto">
      {/* Avatar + info */}
      <div className="flex flex-col items-center py-8 text-center">
        <img
          src={user.avatarUrl || "/default-avatar.svg"}
          alt={user.displayName}
          className="w-24 h-24 rounded-full object-cover avatar-ring mb-4"
        />
        <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
        <p className="text-sm text-white/40">@{user.username}</p>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3">
          {isPremium && <span className="badge badge-gold"><Crown size={9} />Premium</span>}
          {isCreator && <span className="badge badge-rose"><Shield size={9} />Créateur</span>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          {isCreator ? (
            <>
              <Link href={`/creator/${user.username}`} className="btn-secondary py-2 px-4 text-sm rounded-full">
                Voir profil public
              </Link>
              <Link href="/dashboard" className="btn-primary py-2 px-4 text-sm rounded-full">
                Dashboard
              </Link>
            </>
          ) : (
            !isPremium && (
              <Link href="/" className="btn-primary py-2 px-6 text-sm rounded-full">
                <Crown size={14} />
                Passer Premium
              </Link>
            )
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-8">
        {menuItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/12 transition">
            <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-white/60" />
            </div>
            <span className="flex-1 text-sm font-medium text-white">{label}</span>
            <ChevronRight size={16} className="text-white/20" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
      >
        <LogOut size={16} />
        <span className="text-sm font-medium">Se déconnecter</span>
      </button>
    </div>
  );
}
