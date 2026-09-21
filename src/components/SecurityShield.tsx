"use client";

import { useEffect } from "react";

export default function SecurityShield() {
  useEffect(() => {
    // 🛡️ Bloquear Clic Derecho
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 🛡️ Bloquear teclas de herramientas de desarrollador (F12, Ctrl+Shift+I, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // 🛡️ Bloquear arrastrar imágenes (Anti-Guardar como)
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null; // Este componente es invisible, opera en las sombras
}
