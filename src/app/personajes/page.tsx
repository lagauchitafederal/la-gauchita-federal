import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getPublishedPeople, PublicPerson } from '../../lib/public-content/public-people';
import { getProvinces } from '../../lib/catalogs/catalogs';
import { getPublicMediaUrl } from '../../lib/utils/media-url';
import PublicPageShell from '../../components/public/PublicPageShell';

import PersonCard from '../../components/cards/PersonCard';
import { stripHtml } from '../../lib/utils/formatters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Personajes | La Gauchita Federal',
  description: 'Voces, trayectorias y protagonistas que dejaron huella en la historia y la cultura argentina.',
};

const PERSON_TYPE_LABELS: Record<string, string> = {
  historical_figure: 'Prócer / Figura Histórica',
  writer: 'Escritor/a',
  poet: 'Poeta / Poetisa',
  historian: 'Historiador/a',
  musician: 'Músico/a',
  singer: 'Cantante',
  artist: 'Artista',
  artisan: 'Artesano/a',
  educator: 'Educador/a',
  researcher: 'Investigador/a',
  public_figure: 'Figura Pública',
  cultural_referent: 'Referente Cultural',
  other: 'Personaje Popular'
};

interface PersonajesPageProps {
  searchParams: Promise<{ q?: string; tipo?: string; provincia?: string }>;
}

export default async function PersonajesPage({ searchParams }: PersonajesPageProps) {
  const params = await searchParams;
  const searchQuery = params.q || '';
  const selectedType = params.tipo || 'todos';
  const selectedProv = params.provincia || 'todas';

  // Load cookies and territory context
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  // Load catalogs and people
  const [provinces, rawPeople] = await Promise.all([
    getProvinces(),
    getPublishedPeople(territory)
  ]);

  // Apply filters on the server side
  let filteredPeople = rawPeople;

  // 1. Search Query filter (name/full_name)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredPeople = filteredPeople.filter(
      p => p.full_name.toLowerCase().includes(query) || p.short_bio?.toLowerCase().includes(query)
    );
  }

  // 2. Type filter
  if (selectedType !== 'todos') {
    filteredPeople = filteredPeople.filter(p => p.person_type === selectedType);
  }

  // 3. Province filter
  if (selectedProv !== 'todas') {
    filteredPeople = filteredPeople.filter(p => p.province_id === selectedProv);
  }

  // Helper to format life span years
  const getLifeSpan = (p: PublicPerson) => {
    if (!p.birth_date && !p.death_date) return '';
    const birthYear = p.birth_date ? p.birth_date.split('-')[0] : '¿?';
    const deathYear = p.death_date ? p.death_date.split('-')[0] : 'Presente';
    return `${birthYear} – ${deathYear}`;
  };

  // Helper to format territory label
  const getTerritoryLabel = (p: PublicPerson) => {
    if (p.municipalities?.name) return `${p.municipalities.name}, ${p.provinces?.name || ''}`;
    if (p.provinces?.name) return p.provinces.name;
    if (p.regions?.name) return p.regions.name;
    return 'Ámbito Nacional';
  };

  // Editorial composition: select featured/spotlight person (first item in the filtered list)
  const mainPerson = filteredPeople[0] || null;
  const listPeople = mainPerson ? filteredPeople.slice(1, 13) : []; // between 6 and 12

  const mainPersonImageUrl = mainPerson && mainPerson.media_assets
    ? getPublicMediaUrl(mainPerson.media_assets.bucket_name, mainPerson.media_assets.storage_path)
    : null;

  const mainPersonLifeSpan = mainPerson ? getLifeSpan(mainPerson) : '';

  const cleanMainBio = mainPerson?.short_bio ? stripHtml(mainPerson.short_bio) : '';

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* A. Encabezado editorial */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Portal Federal
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Personajes
          </h1>
          <p className="text-base text-stone-650 font-serif italic">
            Voces, trayectorias y protagonistas que dejaron huella en la historia y la cultura argentina.
          </p>
        </div>

        {/* Territory Status Indicator */}
        {territory && territory.label !== 'Argentina' && (
          <div className="bg-[#f2ede4] border border-stone-beige p-3 rounded-lg flex items-center justify-between text-xs text-stone-700 font-mono">
            <span>
              📍 Relevancia territorial activa: <strong>{territory.label}</strong> (Personajes locales priorizados)
            </span>
          </div>
        )}

        {/* B. Personaje destacado */}
        {mainPerson && (
          <section className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm">
            {mainPersonImageUrl ? (
              <div className="w-full md:w-80 h-64 md:h-auto bg-stone-100 flex-shrink-0 relative">
                <img
                  src={mainPersonImageUrl}
                  alt={mainPerson.media_assets?.alt_text || mainPerson.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full md:w-80 h-48 md:h-auto bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-8 flex-shrink-0 border-b md:border-b-0 md:border-r border-stone-beige/70">
                <svg className="w-12 h-12 text-stone-400/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[9px] uppercase tracking-wider font-mono text-stone-550 font-bold">Sin retrato</span>
              </div>
            )}

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] bg-muted-amber/15 text-amber-900 border border-muted-amber/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                    Destacado
                  </span>
                  <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
                    {PERSON_TYPE_LABELS[mainPerson.person_type] || mainPerson.person_type}
                  </span>
                  <span className="text-[10px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/60 uppercase">
                    📍 {getTerritoryLabel(mainPerson)}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                  <Link href={`/personajes/${mainPerson.slug}`}>
                    {mainPerson.full_name}
                  </Link>
                </h2>
                
                {mainPersonLifeSpan && (
                  <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                    {mainPersonLifeSpan}
                  </span>
                )}

                {cleanMainBio && (
                  <p className="text-sm text-stone-700 leading-relaxed font-serif">
                    {cleanMainBio}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={`/personajes/${mainPerson.slug}`}
                  className="inline-flex items-center text-xs font-bold text-earth-red hover:underline uppercase tracking-wider font-mono"
                >
                  Leer Biografía Completa &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* D. Exploración (Filter Bar) */}
        <form method="GET" action="/personajes" className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-5 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="q" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Buscar por nombre:
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={searchQuery}
                placeholder="Ej. José de San Martín..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-charcoal bg-white"
              />
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tipo" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Tipo de personaje:
              </label>
              <select
                id="tipo"
                name="tipo"
                defaultValue={selectedType}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
              >
                <option value="todos">Todos los tipos</option>
                {Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="provincia" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Por Provincia:
              </label>
              <select
                id="provincia"
                name="provincia"
                defaultValue={selectedProv}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
              >
                <option value="todas">Todas las provincias</option>
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-stone-beige/60 pt-3 mt-1">
            <span className="text-xs text-stone-500 font-mono">
              Encontrados: <strong>{filteredPeople.length}</strong> personajes
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedType !== 'todos' || selectedProv !== 'todas') && (
                <Link
                  href="/personajes"
                  className="text-xs font-mono font-bold text-stone-500 hover:text-earth-red border-b border-stone-300 hover:border-earth-red transition-all duration-150"
                >
                  Limpiar filtros
                </Link>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-charcoal hover:bg-charcoal/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
              >
                Filtrar catálogo
              </button>
            </div>
          </div>
        </form>

        {/* C. Protagonistas del territorio List */}
        {listPeople.length > 0 ? (
          <section className="flex flex-col gap-6">
            <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2.5">
              Protagonistas del territorio
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listPeople.map((p) => {
                const imageUrl = p.media_assets ? getPublicMediaUrl(p.media_assets.bucket_name, p.media_assets.storage_path) : null;
                const lifeSpan = getLifeSpan(p);
                
                return (
                  <PersonCard
                    key={p.slug}
                    person={p}
                    imageUrl={imageUrl}
                    lifeSpan={lifeSpan}
                    territoryLabel={getTerritoryLabel(p)}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          /* E. Estados vacíos */
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm">
            <p className="text-stone-500 text-sm italic font-mono">
              Estamos incorporando nuevas trayectorias y protagonistas para este territorio.
            </p>
          </div>
        )}

      </div>
    </PublicPageShell>
  );
}
