"use client";
import { useEffect, useRef } from "react";

export function AdsterraNative() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Evitar inyección múltiple
    if (adRef.current && !adRef.current.firstChild) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.dataset.cfasync = "false";
      script.src = "//pl31363078.profitableratecpmnetwork.com/cdc0c90b2992b79a81c23be15bd6d3ea/invoke.js";
      
      const container = document.createElement("div");
      container.id = "contenedor-cdc0c90b2992b79a81c23be15bd6d3ea";
      
      adRef.current.appendChild(container);
      adRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-6">
      <div ref={adRef} className="w-full max-w-full overflow-hidden flex justify-center" />
    </div>
  );
}

export function AdsterraBanner300() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      (window as any).atOptions = {
        'key' : 'a135250a082e4273d22307c9d7e5b016',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
      
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "//www.highrevenueformat.com/a135250a082e4273d22307c9d7e5b016/invoke.js";

      adRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4">
      <div ref={adRef} className="overflow-hidden flex justify-center" style={{ minWidth: 300, minHeight: 250 }} />
    </div>
  );
}
