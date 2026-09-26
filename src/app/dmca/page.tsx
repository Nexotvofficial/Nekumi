import Link from 'next/link';
import { ShieldAlert, Mail } from 'lucide-react';

export default function DMCA() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ec4899] selection:text-white font-sans pb-20">
      {/* Header Minimalista */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4">
        <div className="shell flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg">
            <span className="brand-word tracking-[0.02em] text-[24px] font-black uppercase">
              <span className="text-white">Neku</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a855f7] to-[#ec4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">mi</span>
            </span>
          </Link>
          <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="shell mt-12 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-lg">
            <ShieldAlert className="w-6 h-6 text-pink-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            Aviso Legal y DMCA
          </h1>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed text-base md:text-lg">
          
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <h2 className="text-xl font-bold text-white mb-4">Declaración de Responsabilidad (Disclaimer)</h2>
            <p className="mb-4">
              <strong>Nekutoon</strong> funciona como un índice y repositorio para los fans. Recopilamos, traducimos y organizamos contenido de dominio público en Internet para facilitar su lectura y preservación.
            </p>
            <p>
              Aunque parte del contenido puede estar respaldado en nuestra infraestructura de base de datos para garantizar su disponibilidad técnica, Nekutoon no reclama derechos de propiedad sobre ninguna de las obras mostradas, respetando siempre el crédito de los creadores originales y scanlations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Política de Derechos de Autor (DMCA)</h2>
            <p>
              Nekutoon respeta plenamente la propiedad intelectual de terceros y cumple estrictamente con las directrices establecidas por la Ley de Derechos de Autor de la Era Digital (DMCA, por sus siglas en inglés).
            </p>
            <p>
              Si usted es el legítimo propietario de los derechos de autor de algún material enlazado o indexado en nuestra plataforma y desea que sea removido de nuestro directorio, por favor envíenos una solicitud formal de retiro (Takedown Notice). 
            </p>
            <p>
              Una vez recibida y verificada la solicitud, procederemos a eliminar el enlace o referencia al contenido protegido en un plazo máximo de <strong>48 a 72 horas hábiles</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Requisitos para la solicitud de retiro</h2>
            <p>Para que podamos procesar su solicitud de forma rápida y eficiente, asegúrese de incluir la siguiente información en su correo electrónico:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/70">
              <li>El nombre y la información de contacto de la persona autorizada para actuar en nombre del titular de los derechos exclusivos que presuntamente se han infringido.</li>
              <li>La identificación clara y precisa del material protegido por derechos de autor que se reclama ha sido infringido.</li>
              <li>La ubicación exacta (URLs) dentro de Nekutoon donde se encuentran los enlaces al material infractor.</li>
              <li>Una declaración de que la parte demandante cree de buena fe que el uso del material no está autorizado por el propietario de los derechos de autor, su agente o la ley.</li>
              <li>Una declaración bajo pena de perjurio de que la información contenida en la notificación es exacta.</li>
            </ul>
          </section>

          <section className="bg-gradient-to-br from-[#a855f7]/10 to-[#ec4899]/10 border border-pink-500/20 rounded-2xl p-6 md:p-8 mt-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-pink-400" />
              Contacto de Abuso (Abuse Desk)
            </h2>
            <p className="mb-4">
              Por favor, envíe todas las notificaciones de infracción de derechos de autor exclusivamente a nuestro correo electrónico de soporte.
            </p>
            <a href="mailto:diazmowi07@gmail.com" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors">
              diazmowi07@gmail.com
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
