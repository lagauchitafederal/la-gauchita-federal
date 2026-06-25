import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getProvinces, getMunicipalities } from '../../lib/catalogs/catalogs';
import { getPublicCulturalAgenda } from '../../lib/public-content/public-cultural-agenda';
import { stripHtml } from '../../lib/utils/formatters';
import PublicPageShell from '../../components/public/PublicPageShell';
import ContentCard from '../../components/cards/ContentCard';
import { getCurrentArgentinaDate } from '../../lib/utils/date';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agenda Cultural Federal | La Gauchita Federal',
  description: 'Actividades, encuentros y propuestas culturales vinculadas con el territorio y la memoria federal argentina.',
  alternates: {
    canonical: '/agenda'
  }
};

interface AgendaPageProps {
  searchParams: Promise<{
    provincia?: string;
    categoria?: string;
    periodo?: string;
  }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const { provincia, categoria, periodo } = await searchParams;

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  const [provinces, municipalities, agendaData] = await Promise.all([
    getProvinces(),
    getMunicipalities(),
    getPublicCulturalAgenda(territory, {
      provincia,
      categoria,
      periodo: periodo as any
    })
  ]);

  const {
    featuredUpcoming,
    secondaryUpcoming,
    archiveEvents,
    availableProvinces,
    availableCategories
  } = agendaData;

  // Resolve territory display name
  const territoryName = (() => {
    if (!territory) return 'Argentina';
    if (territory.municipalityId) {
      const mun = municipalities.find(m => m.id === territory.municipalityId);
      const prov = provinces.find(p => p.id === territory.provinceId);
      if (mun && prov) return `${mun.name}, ${prov.name}`;
      if (mun) return mun.name;
    }
    if (territory.provinceId) {
      const prov = provinces.find(p => p.id === territory.provinceId);
      if (prov) return prov.name;
    }
    return 'Argentina';
  })();

  const activePeriod = periodo || 'todos';
  const hasUpcoming = !!featuredUpcoming || secondaryUpcoming.length > 0;
  const hasArchive = archiveEvents.length > 0;

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Cartelera cultural
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Agenda Cultural Federal
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 font-mono mt-1">
            <p className="text-stone-700 leading-relaxed max-w-2xl font-serif">
              Actividades, encuentros y propuestas culturales vinculadas con el territorio seleccionado.
            </p>
            <div className="w-full flex items-center gap-1.5 mt-2 text-stone-500 font-bold uppercase text-[10px]">
              <span>📍 Territorio seleccionado:</span>
              <span className="text-earth-red font-mono">{territoryName}</span>
            </div>
          </div>
        </div>

        {/* Filters and Tabs Form */}
        <div className="flex flex-col gap-4">
          <form method="GET" action="/agenda" className="flex flex-wrap items-end gap-4 bg-[#fcf8f2] border border-stone-beige p-5 rounded-lg">
            
            {/* Select Provincia */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label htmlFor="provincia" className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                Provincia
              </label>
              <select 
                name="provincia" 
                id="provincia" 
                defaultValue={provincia || ''} 
                className="w-full text-sm bg-white border border-stone-beige/80 rounded px-3 py-2 text-charcoal outline-none focus:border-muted-amber font-serif"
              >
                <option value="">Todas las provincias con eventos</option>
                {availableProvinces.map(p => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Select Categoria */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label htmlFor="categoria" className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                Categoría
              </label>
              <select 
                name="categoria" 
                id="categoria" 
                defaultValue={categoria || ''} 
                className="w-full text-sm bg-white border border-stone-beige/80 rounded px-3 py-2 text-charcoal outline-none focus:border-muted-amber font-serif"
              >
                <option value="">Todas las categorías</option>
                {availableCategories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Hidden field to keep period parameter when submitting form */}
            {periodo && <input type="hidden" name="periodo" value={periodo} />}

            {/* Submit button */}
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-earth-red hover:bg-earth-red/90 text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors h-[38px] flex-shrink-0"
            >
              Filtrar
            </button>

            {/* Reset button */}
            {(provincia || categoria || periodo) && (
              <Link 
                href="/agenda" 
                className="text-xs font-mono font-bold text-stone-500 hover:text-earth-red hover:underline h-[38px] flex items-center justify-center px-2"
              >
                Limpiar filtros
              </Link>
            )}
          </form>

          {/* Period Tabs */}
          <div className="flex border-b border-stone-beige/85 gap-6 mt-2">
            <Link
              href={{
                pathname: '/agenda',
                query: { ...(provincia ? { provincia } : {}), ...(categoria ? { categoria } : {}), periodo: 'todos' }
              }}
              className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold border-b-2 transition-colors duration-150 ${activePeriod === 'todos' ? 'border-earth-red text-earth-red' : 'border-transparent text-stone-500 hover:text-earth-red'}`}
            >
              Todos
            </Link>
            <Link
              href={{
                pathname: '/agenda',
                query: { ...(provincia ? { provincia } : {}), ...(categoria ? { categoria } : {}), periodo: 'proximos' }
              }}
              className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold border-b-2 transition-colors duration-150 ${activePeriod === 'proximos' ? 'border-earth-red text-earth-red' : 'border-transparent text-stone-500 hover:text-earth-red'}`}
            >
              Próximos
            </Link>
            <Link
              href={{
                pathname: '/agenda',
                query: { ...(provincia ? { provincia } : {}), ...(categoria ? { categoria } : {}), periodo: 'archivo' }
              }}
              className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold border-b-2 transition-colors duration-150 ${activePeriod === 'archivo' ? 'border-earth-red text-earth-red' : 'border-transparent text-stone-500 hover:text-earth-red'}`}
            >
              Archivo
            </Link>
          </div>
        </div>

        {/* Content sections */}
        <div className="flex flex-col gap-10">
          
          {/* A. Próximos destacados (Hero) */}
          {activePeriod !== 'archivo' && featuredUpcoming && (
            <section className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm hover:border-muted-amber hover:shadow-md transition-all duration-300 mt-2">
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 gap-6">
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-beige/60">
                    <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10 tracking-widest uppercase font-mono">
                      Próximamente
                    </span>
                    {featuredUpcoming.categories?.name && (
                      <span className="text-[9px] font-bold text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase font-mono">
                        {featuredUpcoming.categories.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight">
                    {featuredUpcoming.title}
                  </h2>
                  <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider block">
                    📅 {featuredUpcoming.event_date ? new Date(featuredUpcoming.event_date + 'T00:00:00').toLocaleDateString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : ''}
                  </span>
                  {featuredUpcoming.summary && (
                    <p className="text-sm text-stone-700 leading-relaxed font-serif">
                      {stripHtml(featuredUpcoming.summary)}
                    </p>
                  )}
                </div>
                <div className="pt-2 flex justify-start">
                  <Link
                    href={`/contenidos/${featuredUpcoming.slug}`}
                    className="px-5 py-2.5 bg-earth-red hover:bg-earth-red/90 text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors"
                  >
                    Ver actividad &rarr;
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* B. Más actividades (Secondary upcoming grid) */}
          {activePeriod !== 'archivo' && secondaryUpcoming.length > 0 && (
            <section className="flex flex-col gap-5 mt-2">
              <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2">
                Más actividades próximas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {secondaryUpcoming.map(c => {
                  const provLabel = c.province_id ? provinces.find(p => p.id === c.province_id)?.name : null;
                  return (
                    <ContentCard
                      key={c.slug}
                      content={c}
                      territoryLabel={provLabel}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* C. Archivo de agenda */}
          {activePeriod !== 'proximos' && hasArchive && (
            <section className="flex flex-col gap-5 mt-4">
              <div className="border-b border-stone-beige pb-3">
                <h3 className="text-xl sm:text-2xl font-serif font-black text-charcoal">
                  Archivo de actividades
                </h3>
                <p className="text-xs text-stone-500 font-serif mt-1">
                  Encuentros y propuestas que forman parte de la memoria cultural del territorio.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archiveEvents.map(c => {
                  const provLabel = c.province_id ? provinces.find(p => p.id === c.province_id)?.name : null;
                  return (
                    <ContentCard
                      key={c.slug}
                      content={c}
                      territoryLabel={provLabel}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* D. Estado vacío */}
          {((activePeriod === 'proximos' && !hasUpcoming) || 
            (activePeriod === 'archivo' && !hasArchive) ||
            (activePeriod === 'todos' && !hasUpcoming && !hasArchive)) && (
            <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-6 items-center">
              <div className="w-16 h-16 rounded-full bg-stone-beige/25 flex items-center justify-center text-stone-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2 max-w-md">
                <h2 className="text-xl font-serif font-bold text-charcoal">
                  No hay actividades próximas registradas
                </h2>
                <p className="text-stone-600 text-sm font-serif leading-relaxed">
                  La agenda cultural se actualiza progresivamente con propuestas públicas y actividades vinculadas a cada territorio.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-2">
                <Link
                  href="/efemerides"
                  className="px-5 py-2.5 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded hover:bg-earth-red/90 transition-colors"
                >
                  Explorar efemérides
                </Link>
                <Link
                  href="/archivo"
                  className="px-5 py-2.5 border border-stone-beige text-stone-700 bg-white hover:bg-stone-50 text-xs uppercase tracking-wider font-bold rounded transition-all"
                >
                  Ver archivo cultural
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </PublicPageShell>
  );
}
