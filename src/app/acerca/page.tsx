import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import { getPublishedPersonBySlug } from '../../lib/public-content/public-people';
import { getAcercaJsonLd } from '../../lib/seo/json-ld';

export const metadata: Metadata = {
  title: "Acerca de nosotros",
  description: "Una plataforma cultural para preservar, organizar y difundir la memoria histórica y el patrimonio federal argentino.",
};

export default async function AcercaPage() {
  const eduardoCeballosExists = await getPublishedPersonBySlug('eduardo-ceballos').then(p => !!p);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const acercaJsonLds = getAcercaJsonLd(siteUrl);

  return (
    <PublicPageShell>
      {acercaJsonLds.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      <PublicSectionHeader
        title="Acerca de La Gauchita Federal"
        description="Una plataforma cultural para preservar, organizar y difundir la memoria histórica y el patrimonio federal argentino."
      />

      {/* Presentación Institucional Principal */}
      <div className="flex flex-col gap-8 mt-4">
        
        {/* Bloque 1: Qué es La Gauchita Federal */}
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Qué es La Gauchita Federal
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            La Gauchita Federal es un portal cultural e histórico impulsado por el Instituto Cultural Andino y la Revista La Gauchita, orientado a reunir, preservar y difundir contenidos vinculados a la memoria cultural, histórica y documental del norte argentino y del ámbito federal andino.
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-medium italic">
            La Gauchita Federal busca rescatar el pasado, ordenar la memoria disponible y construir un puente entre archivo, comunidad y futuro.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bloque 2: Qué reúne la plataforma */}
          <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
            <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
              Qué reúne la plataforma
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed">
              La plataforma integra artículos, efemérides, notas culturales, instituciones participantes o vinculadas al archivo, reconocimientos, materiales documentales e imágenes de valor histórico. Su propósito es ofrecer un espacio digital sobrio, accesible y organizado, donde la trayectoria de La Gauchita y el trabajo cultural de Eduardo Ceballos puedan proyectarse hacia nuevas comunidades, instituciones, docentes, investigadores y lectores interesados en el patrimonio regional.
            </p>
          </section>

          {/* Bloque 3: Una red cultural en construcción */}
          <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
            <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
              Una red cultural en construcción
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed">
              En esta primera etapa, el portal funciona como una versión inicial institucional, con contenidos reales, archivo visual, reconocimientos documentados y navegación pública. A futuro, se proyecta como una red cultural federal abierta a nuevas instituciones, municipios, bibliotecas, museos, escuelas, investigadores y espacios comunitarios que deseen aportar materiales, historias y referencias vinculadas a la identidad cultural de cada territorio.
            </p>
          </section>
        </div>

        {/* Separador de Sección */}
        <div className="pt-4 pb-2 border-b border-stone-beige/60">
          <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-stone-500">
            Los pilares de La Gauchita Federal
          </h3>
        </div>

        {/* Grid de Impulsores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Instituto Cultural Andino */}
          <section className="bg-[#fcfbf9] border border-stone-beige/80 rounded-lg p-6 flex flex-col justify-between hover:border-muted-amber hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <h4 className="font-serif font-bold text-charcoal text-base">
                Instituto Cultural Andino
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                Pilar fundamental en la investigación y promoción de las tradiciones, el folklore y el patrimonio cultural del norte argentino. Colabora activamente en la difusión de materiales y documentos valiosos para docentes, investigadores y estudiantes.
              </p>
            </div>
            <div className="mt-4">
              <Link 
                href="/instituciones/instituto-cultural-andino" 
                className="text-earth-red hover:underline text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
              >
                Ver institución &rarr;
              </Link>
            </div>
          </section>

          {/* Revista La Gauchita */}
          <section className="bg-[#fcfbf9] border border-stone-beige/80 rounded-lg p-6 flex flex-col justify-between hover:border-muted-amber hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <h4 className="font-serif font-bold text-charcoal text-base">
                Revista La Gauchita
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                Con una larga trayectoria en la comunicación cultural, ha sido un medio clave para registrar testimonios, crónicas, efemérides y expresiones artísticas. Este portal representa su evolución digital y federal.
              </p>
            </div>
            <div className="mt-4">
              <Link 
                href="/instituciones/revista-la-gauchita" 
                className="text-earth-red hover:underline text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
              >
                Explorar revista &rarr;
              </Link>
            </div>
          </section>

          {/* Eduardo Ceballos */}
          <section className="bg-[#fcfbf9] border border-stone-beige/80 rounded-lg p-6 flex flex-col justify-between hover:border-muted-amber hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <h4 className="font-serif font-bold text-charcoal text-base">
                Eduardo Ceballos
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                Escritor, periodista y promotor cultural, ha dedicado su labor al rescate y resguardo de la identidad federal. Sus valiosas recopilaciones históricas forman parte del núcleo de conocimiento de este portal.
              </p>
            </div>
            <div className="mt-4">
              {eduardoCeballosExists ? (
                <Link 
                  href="/personajes/eduardo-ceballos" 
                  className="text-earth-red hover:underline text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
                >
                  Ver perfil &rarr;
                </Link>
              ) : (
                <span className="text-stone-400 text-xs font-mono font-bold uppercase tracking-wider block">
                  Próximamente
                </span>
              )}
            </div>
          </section>
        </div>

      </div>
    </PublicPageShell>
  );
}
