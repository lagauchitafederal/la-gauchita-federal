import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '../../components/public/PublicPageShell';
import { getPublishedMagazines } from '../../lib/public-content/public-magazines';

export const metadata: Metadata = {
  title: 'Revista La Gauchita - Trayectoria Editorial',
  description: 'Conozca la historia de la Revista La Gauchita, publicación emblemática de cultura y patrimonio del norte argentino, y su transición a portal federal.',
  alternates: {
    canonical: '/revista-la-gauchita',
  },
};

export default async function RevistaLaGauchitaPage() {
  // Fetch real published magazine editions from database
  const editions = await getPublishedMagazines();
  
  // Show only first 6 editions to avoid cluttering, sorting is handled by helper
  const recentEditions = editions.slice(0, 6);

  return (
    <PublicPageShell>
      <div className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 md:p-12 flex flex-col gap-8 font-serif">
        
        {/* Navigation / Breadcrumb */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60 font-sans">
          <Link href="/acerca" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
            &larr; Volver a Institucional
          </Link>
          <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Legado Editorial</span>
        </div>

        {/* Brand / Header Block */}
        <div className="flex flex-col gap-3 font-sans">
          <span className="self-start text-[10px] bg-earth-red/5 text-earth-red border border-earth-red/10 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Publicación Cultural Federal
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
            Revista La Gauchita
          </h1>
          <p className="text-sm text-stone-500 italic font-serif leading-relaxed">
            "La voz impresa que recorrió los rincones de nuestra patria para contar las historias de nuestra gente."
          </p>
        </div>

        {/* Narrative Section */}
        <section className="flex flex-col gap-4 border-t border-stone-beige/40 pt-6">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Nuestra Historia
          </h2>
          <div className="text-sm text-stone-750 leading-relaxed font-sans flex flex-col gap-4">
            <p>
              Revista La Gauchita nació como un proyecto independiente bajo la dirección de Eduardo Ceballos y con el respaldo del Instituto Cultural Andino, con el firme propósito de dar visibilidad a los poetas, músicos, artesanos, historiadores y referentes de la cultura popular del norte de la Argentina.
            </p>
            <p>
              A lo largo de sus múltiples ediciones en papel, la revista se convirtió en un faro cultural de distribución federal, recopilando crónicas folklóricas, reportajes biográficos y acontecimientos históricos regionales que la prensa de alcance nacional solía obviar. Su lema y su línea editorial siempre estuvieron marcados por la defensa de la identidad nacional, las tradiciones gauchas y el federalismo cultural.
            </p>
          </div>
        </section>

        {/* Transition to Digital */}
        <section className="bg-stone-50 border border-stone-200 rounded-lg p-6 sm:p-8 flex flex-col gap-4">
          <h3 className="text-base font-serif font-bold text-charcoal flex items-center gap-2 font-sans">
            <svg className="w-4 h-4 text-earth-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            La Continuidad Digital: La Gauchita Federal
          </h3>
          <p className="text-xs text-stone-600 font-sans leading-relaxed">
            Conscientes del advenimiento de las nuevas tecnologías de la información y de la necesidad de preservar este patrimonio, el legado de la Revista La Gauchita evoluciona hacia <strong>La Gauchita Federal</strong>. Esta plataforma web no solo preserva y organiza digitalmente las notas y efemérides de la revista impresa, sino que las extiende como un banco interactivo de memoria viva para escuelas, investigadores y el público general.
          </p>
          <div className="pt-2 font-sans">
            <Link
              href="/revista"
              className="inline-flex items-center px-4 py-2 bg-earth-red hover:bg-earth-red/90 text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-150 shadow-sm"
            >
              Ir a la Biblioteca Digital &rarr;
            </Link>
          </div>
        </section>

        {/* Recent Editions Block */}
        {recentEditions.length > 0 && (
          <section className="flex flex-col gap-6 border-t border-stone-beige/40 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
              Ediciones y Archivo Disponible
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-sans">
              {recentEditions.map((ed) => (
                <div key={ed.id} className="bg-[#fcfbf9] border border-stone-beige/70 p-4 rounded flex flex-col justify-between hover:border-earth-red hover:shadow-sm transition-all duration-200">
                  <div className="flex flex-col gap-2">
                    {ed.media_assets?.storage_path && (
                      <div className="w-full h-40 overflow-hidden mb-2 bg-stone-100 border border-stone-beige rounded-sm">
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${ed.media_assets.bucket_name}/${ed.media_assets.storage_path}`}
                          alt={ed.media_assets.alt_text || ed.title}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                    )}
                    <span className="text-[9px] font-bold text-stone-400 font-mono uppercase">
                      Edición Nº {ed.edition_number} • Año {ed.publication_year}
                    </span>
                    <h4 className="text-sm font-serif font-bold text-charcoal line-clamp-2">
                      {ed.title}
                    </h4>
                    {ed.description && (
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {ed.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/revista/${ed.slug}`}
                      className="text-earth-red hover:underline text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1"
                    >
                      Ver edición &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Legado Links (Pillars Grid Navigation) */}
        <section className="border-t border-stone-beige/40 pt-6 flex flex-col gap-4 font-sans">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
            Vínculos del Legado Cultural
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <Link
              href="/eduardo-ceballos"
              className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
            >
              <span className="text-stone-750 group-hover:text-earth-red transition-colors">Legado de Eduardo Ceballos</span>
              <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
            </Link>
            <Link
              href="/instituto-cultural-andino"
              className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
            >
              <span className="text-stone-750 group-hover:text-earth-red transition-colors">Instituto Cultural Andino</span>
              <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
            </Link>
          </div>
        </section>

      </div>
    </PublicPageShell>
  );
}
