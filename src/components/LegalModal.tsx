"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terminos" | "privacidad" | "cookies" | "derechos" | "";
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = {
    terminos: {
      title: "Términos de Servicio",
      body: "Al utilizar Nekumi, aceptas nuestras políticas de comunidad. Nos reservamos el derecho de moderar reseñas o cuentas que infrinjan el respeto mutuo. Este es un espacio creado por y para apasionados del manhwa y webtoon.",
    },
    privacidad: {
      title: "Política de Privacidad",
      body: "Tu privacidad es primordial. Solo almacenamos tu correo electrónico para la autenticación y los datos de tu perfil (avatar y favoritos). No vendemos ni compartimos tus datos con terceros.",
    },
    cookies: {
      title: "Política de Cookies",
      body: "Utilizamos almacenamiento local y cookies estrictamente necesarias para mantener tu sesión activa, recordar el último capítulo leído y guardar tus preferencias de lectura.",
    },
    derechos: {
      title: "Derechos de Autor",
      body: "Nekumi es un índice y lector comunitario. Las obras listadas pertenecen a sus respectivos autores y estudios originales. Apoya siempre a los creadores en sus lanzamientos oficiales.",
    },
  };

  const data = content[type as keyof typeof content] || content.terminos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-[#a855f7]">{data.title}</h2>
        <div className="prose prose-invert">
          <p className="text-white/80 leading-relaxed text-sm sm:text-base">{data.body}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-8 btn bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 rounded-xl transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
