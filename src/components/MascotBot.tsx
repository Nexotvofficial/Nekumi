"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Terminal, Send } from "lucide-react";

export default function MascotBot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);

  const [inputCommand, setInputCommand] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "neku"; text: string }[]>([
    {
      role: "neku",
      text: "Terminal Neku Inicializada. Comandos disponibles: 'modo cine', 'auto scroll', 'detener', 'modo jefe', 'arriba'.",
    },
  ]);

  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const dragInfo = useRef({ startX: 0, startY: 0, isDragMove: false });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialX = window.innerWidth > 768 ? window.innerWidth - 120 : window.innerWidth - 100;
    const initialY = window.innerHeight > 768 ? window.innerHeight - 150 : window.innerHeight - 150;
    setPosition({ x: initialX, y: initialY });
    posRef.current = { x: initialX, y: initialY };
  }, []);

  // 60fps Smooth Auto-scroll using requestAnimationFrame (no layout thrashing)
  useEffect(() => {
    if (!isAutoScrolling) return;

    let rafId: number;
    const step = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 2) {
        setIsAutoScrolling(false);
        return;
      }
      window.scrollBy(0, 1.4);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoScrolling]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog]);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragInfo.current = { startX: e.clientX, startY: e.clientY, isDragMove: false };
    startRef.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    if (dragRef.current) dragRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (Math.abs(e.clientX - dragInfo.current.startX) > 5 || Math.abs(e.clientY - dragInfo.current.startY) > 5) {
      dragInfo.current.isDragMove = true;
    }
    const newX = Math.max(8, Math.min(window.innerWidth - 96, e.clientX - startRef.current.x));
    const newY = Math.max(8, Math.min(window.innerHeight - 96, e.clientY - startRef.current.y));
    posRef.current = { x: newX, y: newY };
    // Update DOM directly during drag to avoid React re-render lag
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setPosition({ ...posRef.current });
    if (dragRef.current) {
      try {
        dragRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (!dragInfo.current.isDragMove) {
      setIsOpen((prev) => !prev);
    }
  };

  const processCommand = (cmd: string) => {
    if (!cmd.trim()) return;

    const newLog = [...chatLog, { role: "user" as const, text: cmd }];
    setChatLog(newLog);
    setInputCommand("");

    const c = cmd.toLowerCase();

    setTimeout(() => {
      let response = "Comando no reconocido. Intenta: 'modo cine', 'auto scroll', 'detener', 'modo jefe' o 'arriba'.";

      if (c.includes("cine") || c.includes("luz") || c.includes("luces")) {
        setIsCinemaMode((prev) => {
          const next = !prev;
          return next;
        });
        response = !isCinemaMode
          ? "Sistema de iluminación atenuado. Modo Cine activado."
          : "Iluminación estándar restaurada.";
      } else if (c.includes("lee") || c.includes("auto") || c.includes("baja") || c.includes("scroll")) {
        setIsAutoScrolling(true);
        response = "Ejecutando scroll automático a 60fps. Escribe 'detener' para pausar.";
      } else if (c.includes("para") || c.includes("deten") || c.includes("stop")) {
        setIsAutoScrolling(false);
        response = "Scroll automático pausado.";
      } else if (c.includes("jefe") || c.includes("panico") || c.includes("esconde")) {
        setIsBossMode(true);
        setIsOpen(false);
        response = "Protocolo de camuflaje activado.";
      } else if (c.includes("arriba") || c.includes("inicio")) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        response = "Volviendo al inicio de la página.";
      } else if (c.includes("hola") || c.includes("neku")) {
        response = "¡Hola! Soy Neku AI, tu asistente de lectura en Nekutoon.";
      }

      setChatLog((prev) => [...prev, { role: "neku" as const, text: response }]);
    }, 280);
  };

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        aria-label="Abrir asistente Neku AI"
        className="fixed bottom-6 right-6 md:left-6 md:right-auto z-[9999] bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/40 p-3.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-[#a855f7]/25 hover:scale-105 transition-all flex items-center gap-2 group"
      >
        <Sparkles className="w-5 h-5 text-[#c084fc] animate-pulse" />
        <span className="text-white text-xs font-bold max-w-0 overflow-hidden group-hover:max-w-[80px] whitespace-nowrap transition-all duration-300">
          Neku AI
        </span>
      </button>
    );
  }

  return (
    <>
      {isCinemaMode && (
        <div className="fixed inset-0 bg-black/80 z-[9990] pointer-events-none transition-opacity duration-700" />
      )}

      {isBossMode && (
        <div
          onClick={() => setIsBossMode(false)}
          className="fixed inset-0 z-[100000] bg-white text-black flex flex-col cursor-pointer"
        >
          <div className="bg-green-700 text-white p-2 font-bold flex items-center gap-4 text-sm">
            <span>Reporte_Mensual_Final_v3.xlsx - Excel</span>
            <span className="font-normal text-xs opacity-80">(Haz clic en cualquier lugar para volver a Nekutoon)</span>
          </div>
          <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-4 text-xs">
            <span>Archivo</span>
            <span>Inicio</span>
            <span>Insertar</span>
            <span>Fórmulas</span>
            <span>Datos</span>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-1">#</th>
                  <th className="border border-gray-300 p-1">A</th>
                  <th className="border border-gray-300 p-1">B</th>
                  <th className="border border-gray-300 p-1">C</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 22 }).map((_, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-1 text-gray-500 bg-gray-100 w-8 text-center">{i + 1}</td>
                    <td className="border border-gray-300 p-1">Partida #{1040 + i * 17}</td>
                    <td className="border border-gray-300 p-1">Trimestre Q{1 + (i % 4)}</td>
                    <td className="border border-gray-300 p-1">{((i * 13.7) % 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        ref={wrapperRef}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)`, touchAction: "none" }}
        className="fixed top-0 left-0 z-[9999] flex justify-center items-center will-change-transform"
      >
        <div
          className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 transition-all duration-200 transform origin-bottom ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
          } bg-[#09090b]/95 border border-[#a855f7]/30 rounded-2xl shadow-[0_8px_30px_rgb(168,85,247,0.2)] w-80 backdrop-blur-2xl cursor-default flex flex-col overflow-hidden`}
        >
          <div className="flex justify-between items-center p-3.5 border-b border-white/5 bg-gradient-to-r from-[#a855f7]/10 to-transparent">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#a855f7]" />
              <h4 className="text-white font-bold text-sm tracking-wide">
                Neku<span className="text-[#a855f7] font-normal">.AI</span>
              </h4>
            </div>
            <button
              type="button"
              aria-label="Cerrar asistente"
              onClick={() => {
                setIsVisible(false);
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-52 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#a855f7] text-white rounded-br-none"
                      : "bg-[#16161a] text-gray-200 border border-white/5 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="px-3.5 py-2 border-t border-white/5 flex flex-wrap gap-1.5 bg-black/20">
            <button
              type="button"
              onClick={() => processCommand(isAutoScrolling ? "detener" : "auto scroll")}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#a855f7]/20 text-[#d8b4fe] border border-white/10 transition-colors"
            >
              {isAutoScrolling ? "Pausar Scroll" : "Auto Scroll"}
            </button>
            <button
              type="button"
              onClick={() => processCommand("modo cine")}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#a855f7]/20 text-[#d8b4fe] border border-white/10 transition-colors"
            >
              Modo Cine
            </button>
            <button
              type="button"
              onClick={() => processCommand("arriba")}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#a855f7]/20 text-[#d8b4fe] border border-white/10 transition-colors"
            >
              Ir arriba
            </button>
          </div>

          <div className="p-3 border-t border-white/5 bg-black/40">
            <div className="flex items-center gap-2 bg-[#0a0a0c] rounded-xl p-1 border border-white/10 focus-within:border-[#a855f7]/50 transition-all">
              <input
                type="text"
                placeholder="Escribe un comando..."
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white px-3 py-1.5 w-full placeholder:text-gray-500"
                onKeyDown={(e) => e.key === "Enter" && processCommand(inputCommand)}
              />
              <button
                type="button"
                aria-label="Enviar comando"
                onClick={() => processCommand(inputCommand)}
                className="bg-white/5 text-gray-300 p-2 rounded-lg hover:bg-[#a855f7] hover:text-white transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={dragRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`relative group w-16 h-16 md:w-20 md:h-20 transition-transform select-none ${
            isDragging ? "cursor-grabbing scale-95" : "cursor-grab hover:scale-105"
          } filter drop-shadow-[0_5px_15px_rgba(168,85,247,0.3)]`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7] to-[#4f46e5] rounded-full blur-xl -z-10 opacity-30 group-hover:opacity-60 transition-opacity duration-300" />

          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
            <defs>
              <linearGradient id="nekuGradBot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="earGradBot" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M 25 35 L 15 10 L 40 28 Z" fill="url(#earGradBot)" stroke="#1e1b4b" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 75 35 L 85 10 L 60 28 Z" fill="url(#earGradBot)" stroke="#1e1b4b" strokeWidth="2" strokeLinejoin="round" />
            <rect x="15" y="25" width="70" height="55" rx="22" fill="url(#nekuGradBot)" stroke="#1e1b4b" strokeWidth="3" />
            <rect x="22" y="32" width="56" height="41" rx="14" fill="#0f172a" stroke="#1e1b4b" strokeWidth="2" />
            {isAutoScrolling ? (
              <>
                <path d="M 32 46 L 44 46" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
                <path d="M 56 46 L 68 46" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M 32 50 Q 38 42 44 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
                <path d="M 56 50 Q 62 42 68 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
              </>
            )}
            <ellipse cx="30" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
            <ellipse cx="70" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
            <path d="M 47 58 Q 50 62 53 58" fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
}
