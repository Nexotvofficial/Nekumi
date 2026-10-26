"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { X, Mail, Lock, User, Loader2 } from "lucide-react";
import AvatarPicker from "@/components/AvatarPicker";
import { getAvatarSvg } from "@/lib/avatars";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  showToast: (msg: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("hunter");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("¡Has iniciado sesión correctamente!");
        onSuccess(data.user);
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            avatar_url: selectedAvatar,
            username: username || email.split("@")[0],
          });
        }

        showToast("¡Registro exitoso! Ya puedes iniciar sesión.");
        setIsLogin(true);
      }
    } catch (err: any) {
      showToast(err.message || "Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-[22px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 icon-btn" aria-label="Cerrar modal">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 filter drop-shadow-[0_6px_18px_rgba(168,85,247,0.4)]"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nk-auth-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1a1033" />
                <stop offset="100%" stopColor="#090711" />
              </linearGradient>
              <linearGradient id="nk-auth-rim" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="nk-auth-pillar" x1="0" y1="10" x2="0" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="nk-auth-slash" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#nk-auth-bg)" stroke="url(#nk-auth-rim)" strokeWidth="1.5" />
            <path d="M12 13C12 11.6 13.1 10.5 14.5 10.5H17.2V37.5H14.5C13.1 37.5 12 36.4 12 35V13Z" fill="url(#nk-auth-pillar)" />
            <path d="M30.8 10.5H33.5C34.9 10.5 36 11.6 36 13V35C36 36.4 34.9 37.5 33.5 37.5H30.8V10.5Z" fill="url(#nk-auth-pillar)" />
            <path d="M13 10.5H19.4L35 37.5H28.6L13 10.5Z" fill="url(#nk-auth-slash)" />
          </svg>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            {isLogin ? "Bienvenido de vuelta" : "Únete a Nekutoon"}
          </h2>
          <p className="text-[#a7a7b1] text-sm">
            {isLogin ? "Inicia sesión para continuar leyendo" : "Crea una cuenta para sincronizar tus favoritos"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 border-[#a855f7]/50"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  dangerouslySetInnerHTML={{ __html: getAvatarSvg(selectedAvatar) }}
                />
                <div className="flex-1">
                  <p className="text-xs text-white/60">Tu avatar</p>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="text-sm font-semibold text-[#c084fc] hover:text-white transition-colors"
                  >
                    {showAvatarPicker ? "Cerrar selección" : "Cambiar avatar"}
                  </button>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="p-4 rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5">
                  <AvatarPicker
                    selected={selectedAvatar}
                    onChange={(key) => {
                      setSelectedAvatar(key);
                      setShowAvatarPicker(false);
                    }}
                  />
                </div>
              )}

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777782]" />
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-[46px] rounded-full border border-white/10 bg-white/5 text-white px-11 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777782]" />
            <input
              type="email"
              placeholder="Correo electrónico"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[46px] rounded-full border border-white/10 bg-white/5 text-white px-11 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777782]" />
            <input
              type="password"
              placeholder="Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[46px] rounded-full border border-white/10 bg-white/5 text-white px-11 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10"
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    showToast("Primero escribe tu correo arriba para recuperar la contraseña");
                    return;
                  }
                  try {
                    setLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    showToast("Te hemos enviado un correo para restablecer tu contraseña");
                  } catch {
                    showToast("Envía un correo a diazmowi07@gmail.com para asistencia con tu cuenta.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-xs text-[#a78bfa] hover:text-white transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] mt-2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#d946ef] text-white font-bold text-sm shadow-[0_10px_28px_rgba(139,92,246,0.27)] hover:-translate-y-[2px] hover:shadow-[0_14px_35px_rgba(217,70,239,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#777782]">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setShowAvatarPicker(false);
            }}
            className="text-[#a78bfa] font-semibold hover:text-white transition-colors"
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
