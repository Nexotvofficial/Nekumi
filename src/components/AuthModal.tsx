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
          options: { data: { username } }
        });
        if (error) throw error;

        // Create profile with selected avatar
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            avatar_url: selectedAvatar,
            username: username || email.split("@")[0],
          });
        }

        showToast("¡Registro exitoso! Inicia sesión para continuar.");
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md glass rounded-[22px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 icon-btn"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <svg className="w-10 h-10 mx-auto mb-4 filter drop-shadow-[0_5px_14px_rgba(168,85,247,0.32)]" viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="lg-auth" x1="2" y1="3" x2="42" y2="42">
                <stop stopColor="#7c3aed" />
                <stop offset=".52" stopColor="#c026d3" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" fill="url(#lg-auth)" />
          </svg>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            {isLogin ? "Bienvenido de vuelta" : "Únete a Nekutoon"}
          </h2>
          <p className="text-[#a7a7b1] text-sm">
            {isLogin ? "Inicia sesión para continuar leyendo" : "Crea una cuenta para guardar tus favoritos"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Avatar preview + picker toggle */}
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
                    {showAvatarPicker ? "Cerrar selección" : "Cambiar avatar →"}
                  </button>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="p-4 rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5">
                  <AvatarPicker selected={selectedAvatar} onChange={(key) => { setSelectedAvatar(key); setShowAvatarPicker(false); }} />
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
            onClick={() => { setIsLogin(!isLogin); setShowAvatarPicker(false); }}
            className="text-[#a78bfa] font-semibold hover:text-white transition-colors"
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
