import Link from "next/link";
import { Compass, BookOpen, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#a855f7]/15 blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center bg-[#0f0f15]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.75)]">
        <div className="w-16 h-16 rounded-2xl bg-[#a855f7]/15 border border-[#a855f7]/35 flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
          <Compass className="w-8 h-8 text-[#c084fc]" />
        </div>

        <span className="inline-block px-3.5 py-1 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#d8b4fe] text-xs font-extrabold uppercase tracking-widest mb-4">
          Portal Desconocido · Error 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Esta mazmorra no existe
        </h1>

        <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-8">
          El enlace que abriste fue movido o ya no está disponible. Regresa al catálogo principal de Nekutoon para seguir leyendo tus manhwas en español.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="btn btn-primary w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ir al Catálogo</span>
          </Link>
          <Link
            href="/#recomendados"
            className="btn glass border border-white/10 hover:bg-white/10 w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white/85"
          >
            <ArrowLeft className="w-4 h-4 text-[#c084fc]" />
            <span>Explorar Manhwas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
