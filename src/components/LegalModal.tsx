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
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = {
    terminos: {
      title: "Términos de Servicio",
      body: "Al utilizar Nekutoon, aceptas nuestras políticas de comunidad. Nos reservamos el derecho de eliminar reseñas tóxicas o cuentas que infrinjan el respeto mutuo. Este es un espacio creado por y para fans."
    },
    privacidad: {
      title: "Política de Privacidad",
      body: "Tu privacidad es importante. Solo guardamos tu correo electrónico para el registro y los datos de tu perfil. No vendemos tus datos a terceros. Toda tu información de cuenta y favoritos está segura en nuestra base de datos."
    },
    cookies: {
      title: "Política de Cookies",
      body: "Utilizamos cookies estrictamente necesarias para mantener tu sesión activa y guardar tus preferencias de tema. No usamos cookies de rastreo publicitario intrusivas."
    },
    derechos: {
      title: "Derechos de Autor",
      body: "Nekutoon es un catálogo creado por la comunidad. Los manhwas listados pertenecen a sus respectivos creadores y editoriales (como Redice Studio, Kakao, Webtoon). Apoya a los creadores leyendo en las plataformas oficiales siempre que sea posible."
    }
  };

  const data = content[type as keyof typeof content] || content.terminos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-[#a855f7]">{data.title}</h2>
        <div className="prose prose-invert">
          <p className="text-white/80 leading-relaxed">{data.body}</p>
        </div>
        
        <button onClick={onClose} className="w-full mt-8 btn bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 rounded-xl transition-colors">
          Entendido
        </button>
      </div>
    </div>
  );
}
