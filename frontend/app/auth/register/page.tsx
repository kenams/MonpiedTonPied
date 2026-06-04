"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Camera, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"consumer" | "creator">("consumer");
  const [form, setForm] = useState({
    email: "", password: "", username: "", displayName: "", birthDate: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const maxBirth = new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const endpoint = role === "creator" ? "/api/auth/register/creator" : "/api/auth/register";
      const data = await api.post<{ token: string }>(endpoint, { ...form });
      localStorage.setItem("token", data.token);
      router.push(role === "creator" ? "/dashboard" : "/");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--rose)" }}>
            Rejoindre Arcane Feet
          </p>
          <p className="text-sm text-white/40 mt-2">Créez votre compte gratuit</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([
            { key: "consumer", label: "Acheteur", icon: ShoppingBag, desc: "Accédez au contenu premium" },
            { key: "creator", label: "Créateur", icon: Camera, desc: "Vendez votre contenu" },
          ] as const).map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={`p-4 rounded-2xl border text-left transition ${role === key ? "border-[var(--rose)] bg-[var(--rose)]/10" : "border-white/10 hover:border-white/20"}`}
            >
              <Icon size={20} className={`mb-2 ${role === key ? "text-[var(--rose)]" : "text-white/40"}`} />
              <p className={`text-sm font-semibold ${role === key ? "text-white" : "text-white/60"}`}>{label}</p>
              <p className="text-xs text-white/30 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="input" type="text" placeholder="Nom d'utilisateur" value={form.username} onChange={set("username")} required minLength={3} />
          <input className="input" type="text" placeholder="Nom affiché (public)" value={form.displayName} onChange={set("displayName")} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
          <div className="relative">
            <input className="input pr-10" type={showPw ? "text" : "password"} placeholder="Mot de passe (8+ caractères)" value={form.password} onChange={set("password")} required minLength={8} />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Date de naissance — vous devez avoir 18 ans ou plus</label>
            <input className="input" type="date" value={form.birthDate} onChange={set("birthDate")} required max={maxBirth} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-primary mt-1" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : `Créer mon compte ${role === "creator" ? "créateur" : ""}`}
          </button>

          <p className="text-[11px] text-white/25 text-center">
            En créant un compte, vous confirmez avoir 18 ans ou plus et acceptez nos CGU et politique de confidentialité.
          </p>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="text-[var(--rose)] hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
