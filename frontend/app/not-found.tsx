import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="text-center">
        <p className="text-[#c8907a] text-5xl font-black mb-4">404</p>
        <Link href="/" className="text-white/50 hover:text-white text-sm underline">Retour</Link>
      </div>
    </div>
  );
}
