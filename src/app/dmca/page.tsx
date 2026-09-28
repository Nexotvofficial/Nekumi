import Link from 'next/link';
import { ShieldAlert, Mail, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Aviso Legal y DMCA | Nekutoon',
  robots: 'noindex, nofollow'
};

export default function DMCA() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#a855f7] selection:text-white font-sans pb-20">
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="font-black text-2xl tracking-tighter">
            NEKU<span className="text-[#a855f7]">TOON</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <ShieldAlert className="w-8 h-8 text-[#a855f7]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
              Legal Disclaimer & DMCA
            </h1>
            <p className="text-white/50">Aviso Legal de Derechos de Autor</p>
          </div>
        </div>

        <div className="space-y-8 text-white/70 leading-relaxed text-base">
          
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Declaración de No Alojamiento (No-Hosting Statement)</h2>
            </div>
            <div className="space-y-4 text-sm md:text-base">
              <p>
                <strong>Nekutoon does NOT store any image files, manga, manhwa, or copyrighted media files on our servers.</strong>
              </p>
              <p>
                Nekutoon funciona exclusivamente como un <strong>motor de búsqueda y agregador de enlaces</strong> (similar a Google). Todo el contenido visual e imágenes que se muestran en esta plataforma están alojados en servidores externos de terceros (Third-party servers) mediante técnicas de inserción de enlaces directos (Hotlinking).
              </p>
              <p>
                No tenemos ningún tipo de control sobre estos servidores externos, no subimos archivos a ellos, y no nos hacemos responsables por el contenido que otros usuarios puedan haber subido a dichos servidores. Nuestra infraestructura (Vercel/Supabase) almacena únicamente metadatos de texto (títulos y URLs).
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Digital Millennium Copyright Act (DMCA)</h2>
            <p>
              Nekutoon respeta plenamente la propiedad intelectual de terceros. Si usted es el legítimo propietario de los derechos de autor de algún material y desea que desvinculemos las URLs que apuntan a sus imágenes, cumpliremos de inmediato procesando una solicitud de retiro (Takedown Notice).
            </p>
            <p>
              Dado que no alojamos los archivos, <strong>eliminar las URLs de nuestra base de datos no eliminará las imágenes de Internet</strong>, ya que seguirán existiendo en los servidores de terceros donde fueron subidas originalmente. Para eliminarlas permanentemente, deberá contactar a la empresa de alojamiento (Host) real de dichas imágenes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Requisitos para la solicitud de retiro (Takedown Request)</h2>
            <p>Para procesar su solicitud de desvinculación de enlaces, envíe un correo con la siguiente información:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/60 text-sm">
              <li>Evidencia o identificación clara del material protegido por derechos de autor.</li>
              <li>La ubicación exacta (URLs completas de Nekutoon) donde se encuentran los enlaces al material.</li>
              <li>Información de contacto válida (Nombre, empresa, y correo corporativo).</li>
              <li>Una declaración de que la notificación es exacta y se realiza de buena fe.</li>
            </ul>
            <p className="text-sm italic mt-4 text-white/40">
              * Note: We reserve the right to ignore automated DMCA notices or requests missing explicit URLs.
            </p>
          </section>

          <section className="bg-gradient-to-br from-[#a855f7]/10 to-transparent border border-[#a855f7]/20 rounded-2xl p-6 md:p-8 mt-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#a855f7]" />
              Contacto Legal (Abuse & DMCA Desk)
            </h2>
            <p className="mb-6 text-sm">
              Procesaremos la eliminación de los enlaces en un plazo máximo de <strong>48 a 72 horas hábiles</strong> tras recibir un reporte válido.
            </p>
            <a href="mailto:diazmowi07@gmail.com" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#a855f7] text-white font-bold rounded-xl hover:bg-[#c084fc] transition-colors shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              diazmowi07@gmail.com
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
