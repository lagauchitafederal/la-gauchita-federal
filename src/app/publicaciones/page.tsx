import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicPublications, PublicPublication } from '../../lib/public-content/public-publications';
import { getPublicMediaUrl } from '../../lib/utils/media-url';
import PublicPageShell from '../../components/public/PublicPageShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Publicaciones Culturales | Instituto Cultural Andino',
  description: 'Catálogo oficial de libros, discos y obras especiales del Instituto Cultural Andino.',
};

const TYPE_LABELS: Record<string, string> = {
  book: 'Libro',
  album: 'Disco/Álbum',
  special_work: 'Obra Especial',
};

const TYPE_BADGES: Record<string, string> = {
  book: 'bg-blue-50 text-blue-800 border-blue-200/60',
  album: 'bg-purple-50 text-purple-800 border-purple-200/60',
  special_work: 'bg-amber-50 text-amber-800 border-amber-200/60',
};

interface PublicPublicationsPageProps {
  searchParams: Promise<{ tipo?: string }>;
}

export default async function PublicPublicationsPage({ searchParams }: PublicPublicationsPageProps) {
  const params = await searchParams;
  const selectedType = params.tipo || 'todos';

  const publications = await getPublicPublications();

  // Filter based on query parameter
  const filtered = selectedType !== 'todos'
    ? publications.filter(p => p.publication_type === selectedType)
    : publications;

  // Identify featured publication
  const featured = publications.find(p => p.is_featured);

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* Encabezado */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Catálogo Editorial y Discográfico
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Publicaciones Culturales
          </h1>
          <p className="text-base text-stone-650 font-serif italic">
            Libros, discos, grabaciones y obras especiales que constituyen el patrimonio histórico y musical del Instituto Cultural Andino.
          </p>
        </div>

        {/* Enlace discreto a Revista */}
        <div className="bg-[#fcf8f2] border border-stone-beige p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-700 font-mono shadow-sm">
          <span>
            📖 ¿Busca los números digitalizados de la revista histórica?
          </span>
          <Link
            href="/revista"
            className="text-earth-red hover:underline font-bold uppercase tracking-wider whitespace-nowrap"
          >
            Explorar Archivo de Revista &rarr;
          </Link>
        </div>

        {/* Obra Destacada */}
        {featured && selectedType === 'todos' && (
          <section className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden shadow-sm flex flex-col md:flex-row hover:border-muted-amber hover:shadow-md transition-all duration-300">
            {/* Tapa */}
            <div className="w-full md:w-1/3 min-h-[280px] bg-stone-100 relative border-b md:border-b-0 md:border-r border-stone-beige/70 flex items-center justify-center">
              {featured.media_assets ? (
                <img
                  src={getPublicMediaUrl(featured.media_assets.bucket_name, featured.media_assets.storage_path)}
                  alt={featured.media_assets.alt_text || featured.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[280px] bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-4">
                  <svg className="w-12 h-12 text-stone-400/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-xs font-mono">Sin imagen de tapa</span>
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
                  <span className={`text-[9px] font-mono border px-2.5 py-0.5 rounded uppercase font-bold tracking-wider ${TYPE_BADGES[featured.publication_type]}`}>
                    {TYPE_LABELS[featured.publication_type]}
                  </span>
                  {featured.author_text && (
                    <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase">
                      Autor: {featured.author_text}
                    </span>
                  )}
                  {featured.institutions?.name && (
                    <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase">
                      Editorial: {featured.institutions.name}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                  <Link href={`/publicaciones/${featured.slug}`}>
                    {featured.title}
                  </Link>
                </h2>

                {featured.short_description && (
                  <p className="text-sm text-stone-700 leading-relaxed font-serif">
                    {featured.short_description}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-stone-beige/60 mt-auto text-[10px] font-mono text-stone-500">
                <span>
                  {featured.publication_year ? `Año ${featured.publication_year}` : 'Fecha no especificada'}
                </span>
                <Link
                  href={`/publicaciones/${featured.slug}`}
                  className="text-earth-red hover:underline font-bold uppercase tracking-wider font-mono"
                >
                  Ver Ficha y Reseña &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Filtros por tipo */}
        <nav className="flex flex-col gap-2.5">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
            Filtrar por categoría
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'book', label: 'Libros' },
              { id: 'album', label: 'Discos y Música' },
              { id: 'special_work', label: 'Obras Especiales' },
            ].map((item) => (
              <Link
                key={item.id}
                href={item.id === 'todos' ? '/publicaciones' : `/publicaciones?tipo=${item.id}`}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
                  selectedType === item.id
                    ? 'bg-earth-red text-white border-earth-red'
                    : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Listado Principal */}
        {filtered.length === 0 ? (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-4 items-center">
            <h2 className="text-lg font-serif font-bold text-stone-600">
              No hay publicaciones disponibles
            </h2>
            <p className="text-stone-500 text-sm font-serif max-w-sm">
              Actualmente estamos catalogando nuevas obras y publicaciones. Regrese pronto.
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-6">
            <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2.5">
              Catálogo de Obras
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filtered.map((pub) => {
                const coverUrl = pub.media_assets
                  ? getPublicMediaUrl(pub.media_assets.bucket_name, pub.media_assets.storage_path)
                  : null;

                return (
                  <div
                    key={pub.id}
                    className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col h-full shadow-sm hover:border-earth-red/50 hover:shadow transition-all duration-200"
                  >
                    {/* Imagen de Tapa */}
                    <div className="h-64 bg-stone-100 border-b border-stone-beige/50 relative flex items-center justify-center">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={pub.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                          <svg className="w-10 h-10 text-stone-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-[10px] font-mono">Sin tapa</span>
                        </div>
                      )}

                      <span className={`absolute top-2 left-2 text-[8px] border px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider shadow-sm bg-white/95 ${TYPE_BADGES[pub.publication_type]}`}>
                        {TYPE_LABELS[pub.publication_type]}
                      </span>
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div className="p-4 flex flex-col gap-3 flex-grow justify-between">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider block">
                          {pub.author_text || 'Autor desconocido'}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-charcoal leading-snug line-clamp-2 hover:text-earth-red transition-colors duration-150">
                          <Link href={`/publicaciones/${pub.slug}`}>
                            {pub.title}
                          </Link>
                        </h4>
                        {pub.short_description && (
                          <p className="text-xs text-stone-600 font-serif leading-relaxed line-clamp-3">
                            {pub.short_description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-stone-beige/40 flex justify-between items-center text-[9px] font-mono text-stone-500">
                        <span>{pub.publication_year ? `Año ${pub.publication_year}` : ''}</span>
                        <Link
                          href={`/publicaciones/${pub.slug}`}
                          className="text-earth-red hover:underline font-bold uppercase"
                        >
                          Ver ficha &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </PublicPageShell>
  );
}
