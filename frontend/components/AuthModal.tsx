"use client";
import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/auth-context";

type Props = { onClose: () => void; defaultTab?: "login" | "register" };

export default function AuthModal({ onClose, defaultTab = "login" }: Props) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [role, setRole] = useState<"consumer" | "creator">("consumer");
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "", birthDate: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const endpoint = role === "creator" ? "/api/auth/register/creator" : "/api/auth/register";
      const data = await api.post<{ token: string; user: AuthUser }>(endpoint, { ...form });
      localStorage.setItem("token", data.token);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Erreur d'inscription");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 modal-bg" onClick={onClose} />
      <div className="relative w-full max-w-sm glass rounded-3xl p-6 fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white transition">
          <X size={15} />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--rose)" }}>
            Arcane Feet
          </p>
          <p className="text-xs text-white/40 mt-1">Marketplace créateurs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
          {(["login", "register"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-[var(--rose)] text-white" : "text-white/50 hover:text-white"}`}>
              {t === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
            <div className="relative">
              <input className="input pr-10" type={showPw ? "text" : "password"} placeholder="Mot de passe" value={form.password} onChange={set("password")} required />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="btn-primary mt-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            {/* Role choice */}
            <div className="flex gap-2">
              {(["consumer", "creator"] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${role === r ? "bg-[var(--rose)]/15 border-[var(--rose)] text-[var(--rose)]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                  {r === "consumer" ? "👁 Acheteur" : "📸 Créateur"}
                </button>
              ))}
            </div>
            <input className="input" type="text" placeholder="Nom d'utilisateur" value={form.username} onChange={set("username")} required />
            <input className="input" type="text" placeholder="Nom affiché" value={form.displayName} onChange={set("displayName")} required />
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
            <div className="relative">
              <input className="input pr-10" type={showPw ? "text" : "password"} placeholder="Mot de passe" value={form.password} onChange={set("password")} required />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Date de naissance (+18 requis)</label>
              <input className="input" type="date" value={form.birthDate} onChange={set("birthDate")} required max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]} />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="btn-primary mt-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Créer mon compte"}
            </button>
            <p className="text-[10px] text-white/25 text-center">
              En vous inscrivant, vous confirmez avoir 18 ans ou plus.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
