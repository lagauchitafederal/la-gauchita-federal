import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedMagazines } from '../../lib/public-content/public-magazines';
import { getPublicMediaUrl } from '../../lib/utils/media-url';
import PublicPageShell from '../../components/public/PublicPageShell';
import MagazineEditionCard from '../../components/cards/MagazineEditionCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Revista La Gauchita | Archivo Editorial',
  description: 'Ediciones, memoria y producción cultural reunidas en un archivo vivo de la Revista La Gauchita.',
};

interface RevistaPageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function RevistaPage({ searchParams }: RevistaPageProps) {
  const params = await searchParams;
  const selectedYear = params.year ? parseInt(params.year, 10) : undefined;

  const allEditions = await getPublishedMagazines();

  // If there are absolutely no public published editions, show empty state
  if (allEditions.length === 0) {
    return (
      <PublicPageShell maxWidth="max-w-4xl">
        <div className="flex flex-col gap-8">
          {/* Encabezado */}
          <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
              Archivo editorial
            </span>
            <h1 className="text-4xl font-serif font-black text-charcoal">
              Revista La Gauchita
            </h1>
            <p className="text-base text-stone-650 font-serif italic">
              Ediciones, memoria y producción cultural reunidas en un archivo vivo.
            </p>
          </div>

          {/* Estado vacío */}
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-4 items-center">
            <h2 className="text-xl font-serif font-bold text-charcoal">
              El archivo de revista está en preparación
            </h2>
            <p className="text-stone-600 text-sm font-serif max-w-md">
              Las ediciones digitalizadas de Revista La Gauchita se incorporarán progresivamente a este espacio de consulta cultural.
            </p>
          </div>
        </div>
      </PublicPageShell>
    );
  }

  // Get unique publication years from all editions to show the filter
  const years = Array.from(new Set(allEditions.map((e) => e.publication_year))).sort((a, b) => b - a);

  // Filter editions based on query param
  const filteredEditions = selectedYear
    ? allEditions.filter((e) => e.publication_year === selectedYear)
    : allEditions;

  // Determine if there is a featured edition
  const featuredEdition = allEditions.find((e) => e.is_featured);

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* Encabezado */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Archivo editorial
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Revista La Gauchita
          </h1>
          <p className="text-base text-stone-650 font-serif italic">
            Ediciones, memoria y producción cultural reunidas en un archivo vivo.
          </p>
        </div>

        {/* Edición destacada (only if is_featured exists and no year filter is active to keep focus) */}
        {featuredEdition && !selectedYear && (
          <section className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden shadow-sm flex flex-col md:flex-row hover:border-muted-amber hover:shadow-md transition-all duration-300">
            {/* Tapa */}
            <div className="w-full md:w-1/3 min-h-[280px] bg-stone-100 relative border-b md:border-b-0 md:border-r border-stone-beige/70 flex items-center justify-center">
              {featuredEdition.media_assets ? (
                <img
                  src={getPublicMediaUrl(featuredEdition.media_assets.bucket_name, featuredEdition.media_assets.storage_path)}
                  alt={featuredEdition.media_assets.alt_text || featuredEdition.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[280px] bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-4">
                  <svg className="w-12 h-12 text-stone-400/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-xs font-mono">Sin tapa</span>
                </div>
              )}
            </div>
            
            {/* Detalles */}
            <div className="p-6 md:p-8 flex flex-col justify-between flex-1 gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-earth-red font-mono bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10">
                    Edición Destacada
                  </span>
                  <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase">
                    Edición Nº {featuredEdition.edition_number}
                  </span>
                  {featuredEdition.volume && (
                    <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase">
                      Tomo {featuredEdition.volume}
                    </span>
                  )}
                  {featuredEdition.institutions?.name && (
                    <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase">
                      Editor: {featuredEdition.institutions.name}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                  <Link href={`/revista/${featuredEdition.slug}`}>
                    {featuredEdition.title}
                  </Link>
                </h2>

                {featuredEdition.description && (
                  <p className="text-sm text-stone-700 leading-relaxed font-serif line-clamp-4">
                    {featuredEdition.description}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-stone-beige/60 mt-auto text-[10px] font-mono text-stone-500">
                <span>
                  {featuredEdition.publication_date
                    ? new Date(featuredEdition.publication_date + 'T00:00:00').toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : `Año ${featuredEdition.publication_year}`}
                </span>
                <Link
                  href={`/revista/${featuredEdition.slug}`}
                  className="text-earth-red hover:underline font-bold uppercase tracking-wider font-mono"
                >
                  Ver edición &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Filtro por año */}
        {years.length > 1 && (
          <nav className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              Filtrar por año
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/revista"
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
                  !selectedYear
                    ? 'bg-earth-red text-white border-earth-red'
                    : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
                }`}
              >
                Todos
              </Link>
              {years.map((year) => (
                <Link
                  key={year}
                  href={`/revista?year=${year}`}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
                    selectedYear === year
                      ? 'bg-earth-red text-white border-earth-red'
                      : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
                  }`}
                >
                  {year}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Archivo de ediciones */}
        {filteredEditions.length === 0 ? (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
            <p className="text-stone-500 text-sm italic font-mono">
              No se encontraron ediciones para el año seleccionado.
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-6">
            <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2.5">
              Archivo de ediciones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredEditions.map((edition) => (
                <MagazineEditionCard key={edition.id} edition={edition} />
              ))}
            </div>
          </section>
        )}

      </div>
    </PublicPageShell>
  );
}
