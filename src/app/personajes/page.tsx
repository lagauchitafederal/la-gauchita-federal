import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getPublishedPeople, PublicPerson } from '../../lib/public-content/public-people';
import { getProvinces } from '../../lib/catalogs/catalogs';
import { getPublicMediaUrl } from '../../lib/utils/media-url';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Personajes Históricos y Culturales',
  description: 'Explorá la biografía y legado de los protagonistas de nuestra historia, cultura y tradiciones federales.',
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

  return (
    <PublicPageShell>
      <div className="flex flex-col gap-6">
        
        <PublicSectionHeader
          title="Protagonistas de nuestra historia"
          description="Descubrí y explorá la vida de figuras fundamentales de la cultura, la política, el arte y el saber de cada rincón de Argentina."
        />

        {/* Territory Status Indicator */}
        {territory && territory.label !== 'Argentina' && (
          <div className="bg-[#f2ede4] border border-stone-beige p-3 rounded-lg flex items-center justify-between text-xs text-stone-700 font-mono">
            <span>
              📍 Relevancia territorial activa: <strong>{territory.label}</strong> (Los perfiles locales se muestran con prioridad)
            </span>
            <Link href="/instituciones" className="text-earth-red hover:underline font-bold uppercase tracking-wider text-[10px]">
              Ver red institucional
            </Link>
          </div>
        )}

        {/* Filter Bar */}
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
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-charcoal bg-white"
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
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
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
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
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

          {/* Action Row */}
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
                className="px-5 py-2 bg-charcoal hover:bg-charcoal/90 text-white text-[11px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
              >
                Filtrar catálogo
              </button>
            </div>
          </div>

        </form>

        {/* Results List */}
        {filteredPeople.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {filteredPeople.map((p) => {
              const imageUrl = p.media_assets ? getPublicMediaUrl(p.media_assets.bucket_name, p.media_assets.storage_path) : null;
              const lifeSpan = getLifeSpan(p);
              
              return (
                <article
                  key={p.slug}
                  className="bg-[#fcf8f2] border border-stone-beige rounded-lg overflow-hidden flex flex-col md:flex-row hover:border-muted-amber hover:shadow-md transition-all duration-200"
                >
                  {/* Portrait / Image Thumbnail */}
                  {imageUrl ? (
                    <div className="w-full md:w-36 h-48 md:h-full bg-stone-100 flex-shrink-0 relative">
                      <img
                        src={imageUrl}
                        alt={p.media_assets?.alt_text || p.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-36 h-40 md:h-full bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-4 flex-shrink-0">
                      <svg className="w-10 h-10 text-stone-400/80 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-[9px] uppercase tracking-wider font-mono text-stone-550 font-semibold">Sin retrato</span>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {p.is_featured && (
                          <span className="text-[9px] bg-muted-amber/15 text-amber-900 border border-muted-amber/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Destacado
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase">
                          {PERSON_TYPE_LABELS[p.person_type] || p.person_type}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-serif font-black text-charcoal hover:text-earth-red transition-colors leading-snug">
                          <Link href={`/personajes/${p.slug}`}>
                            {p.full_name}
                          </Link>
                        </h2>
                        {lifeSpan && (
                          <span className="text-xs font-mono font-bold text-stone-600">
                            {lifeSpan}
                          </span>
                        )}
                      </div>

                      {p.short_bio && (
                        <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">
                          {p.short_bio}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-stone-beige/65 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-stone-500">
                      <span>📍 {getTerritoryLabel(p)}</span>
                      <Link
                        href={`/personajes/${p.slug}`}
                        className="text-earth-red hover:underline font-bold uppercase tracking-wider text-[10px]"
                      >
                        Leer Biografía &rarr;
                      </Link>
                    </div>
                  </div>

                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm">
            <p className="text-stone-500 text-sm italic font-mono">
              No se encontraron personajes que coincidan con la búsqueda.
            </p>
          </div>
        )}

      </div>
    </PublicPageShell>
  );
}
