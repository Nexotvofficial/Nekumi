"use client";

import { useEffect } from "react";

export default function SecurityShield() {
  useEffect(() => {
    // Prevenir arrastrar imágenes accidentalmente durante la lectura táctil o con ratón
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === "IMG") {
        e.preventDefault();
      }
    };

    document.addEventListener("dragstart", handleDragStart);
    return () => {
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}
