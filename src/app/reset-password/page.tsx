"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.");
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => router.replace("/"), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la contraseña. Solicita un nuevo enlace de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-16 flex items-center justify-center bg-[#08080c] text-white">
      <section className="glass w-full max-w-md rounded-3xl p-7 sm:p-9 border border-white/10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-300 flex items-center justify-center mb-5">
          <LockKeyhole size={24} />
        </div>
        <h1 className="text-2xl font-black mb-2">Crear nueva contraseña</h1>
        <p className="text-sm text-white/60 mb-6">Elige una contraseña nueva de al menos 8 caracteres.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold" htmlFor="new-password">Nueva contraseña</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-purple-400" />
          <label className="block text-sm font-semibold" htmlFor="confirm-password">Confirmar contraseña</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-purple-400" />
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
          <button type="submit" disabled={loading} className="w-full min-h-12 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Actualizar contraseña
          </button>
        </form>
      </section>
    </main>
  );
}
