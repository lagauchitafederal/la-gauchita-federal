import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import { getPublishedPersonBySlug } from '../../lib/public-content/public-people';
import { getAcercaJsonLd } from '../../lib/seo/json-ld';

export const metadata: Metadata = {
  title: 'La Gauchita Federal - Institucional',
  description: 'Conozca La Gauchita Federal, portal de memoria, archivo y patrimonio histórico, continuidad de Revista La Gauchita, Eduardo Ceballos y el Instituto Cultural Andino.',
  alternates: {
    canonical: '/acerca',
  },
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
        title="La Gauchita Federal"
        description="Donde late la historia de cada argentino"
      />

      <div className="flex flex-col gap-8 mt-4 font-serif">
        
        {/* Presentacion Editorial del Proyecto */}
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-4 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-xl font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            El Banco Cultural de Nuestra Memoria
          </h2>
          <p className="text-sm text-stone-750 leading-relaxed font-sans">
            La Gauchita Federal es una plataforma digital comunitaria, federal y patrimonial concebida como un banco dinámico de historia, cultura y tradiciones. El portal nace con la misión de salvaguardar, organizar y proyectar hacia el futuro el valioso acervo documental, testimonial y artístico del norte argentino y del ámbito federal andino, proporcionando un canal de acceso público, sobrio y riguroso.
          </p>
          <p className="text-sm text-stone-750 leading-relaxed font-sans">
            Este proyecto constituye la continuidad digital y el espacio de preservación de la obra de Revista La Gauchita, las recopilaciones de su fundador Eduardo Ceballos y el fondo de fomento cultural del Instituto Cultural Andino.
          </p>
        </section>

        {/* Criterio Central de Navegacion */}
        <section className="bg-stone-50 border border-stone-200 rounded-lg p-6 sm:p-8 flex flex-col gap-4">
          <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
            <svg className="w-4 h-4 text-earth-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Criterio de Experiencia Personalizada
          </h3>
          <p className="text-xs text-stone-600 font-sans leading-relaxed">
            La Gauchita Federal organiza y presenta de forma dinámica su patrimonio a través de tres filtros transversales obligatorios que adaptan el contenido del portal:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs mt-1">
            <div className="bg-white border border-stone-200 p-4 rounded flex flex-col gap-1">
              <span className="text-earth-red font-bold uppercase tracking-wider">1. Fecha Actual</span>
              <span className="text-[11px] text-stone-500">Muestra las efemérides relevantes asociadas al calendario del día.</span>
            </div>
            <div className="bg-white border border-stone-200 p-4 rounded flex flex-col gap-1">
              <span className="text-earth-red font-bold uppercase tracking-wider">2. Territorio</span>
              <span className="text-[11px] text-stone-500">Filtra la información de acuerdo al alcance seleccionado (nacional, regional, provincial o municipal).</span>
            </div>
            <div className="bg-white border border-stone-200 p-4 rounded flex flex-col gap-1">
              <span className="text-earth-red font-bold uppercase tracking-wider">3. Nivel de Usuario</span>
              <span className="text-[11px] text-stone-500">Diferencia la experiencia según el rol (público general, colaboradores editoriales o administradores).</span>
            </div>
          </div>
        </section>

        {/* Separador de Seccion */}
        <div className="pt-4 pb-2 border-b border-stone-beige/60">
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500 font-sans">
            Los Pilares de Nuestro Legado
          </h3>
        </div>

        {/* Grid de Pilares con enlaces reales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          
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
            <div className="mt-5">
              <Link 
                href="/eduardo-ceballos" 
                className="text-earth-red hover:underline text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
              >
                Ver Legado de Eduardo &rarr;
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
            <div className="mt-5">
              <Link 
                href="/revista-la-gauchita" 
                className="text-earth-red hover:underline text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
              >
                Explorar Revista &rarr;
              </Link>
            </div>
          </section>

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
            <div className="mt-5">
              <Link 
                href="/instituto-cultural-andino" 
                className="text-earth-red hover:underline text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
              >
                Ver Instituto &rarr;
              </Link>
            </div>
          </section>

        </div>

      </div>
    </PublicPageShell>
  );
}
