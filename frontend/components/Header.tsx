"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Search, Bell, Upload } from "lucide-react";
import { useState } from "react";
import AuthModal from "./AuthModal";

export default function Header() {
  const { user, isCreator } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(to bottom, rgba(8,8,8,0.95) 0%, transparent 100%)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--rose)" }}
          >
            Arcane
          </span>
          <span className="text-base font-light text-white/70 tracking-tight">Feet</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white transition"
          >
            <Search size={18} />
          </Link>

          {user ? (
            <>
              {isCreator && (
                <Link href="/dashboard/upload" className="btn-primary py-1.5 px-3 text-xs rounded-full">
                  <Upload size={13} />
                  Publier
                </Link>
              )}
              <Link href="/notifications" className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white transition relative">
                <Bell size={18} />
              </Link>
              <Link href="/profile">
                <img
                  src={user.avatarUrl || "/default-avatar.svg"}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                />
              </Link>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className="btn-primary py-1.5 px-4 text-xs rounded-full">
              Connexion
            </button>
          )}
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
