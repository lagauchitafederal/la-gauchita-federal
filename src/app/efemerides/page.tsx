import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import {
  getTodayEphemerides,
  getPublishedContentsList,
  PublicContent
} from '../../lib/public-content/public-content';
import { getRegions, getProvinces, getMunicipalities } from '../../lib/catalogs/catalogs';
import { formatHistoricalDate, getEphemerisLabel, parseEventDate } from '../../lib/utils/date';
import PublicPageShell from '../../components/public/PublicPageShell';
import ContentCard from '../../components/cards/ContentCard';
import { stripHtml } from '../../lib/utils/formatters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Efemérides | La Gauchita Federal',
  description: 'Hechos, memorias y protagonistas que siguen dando sentido a nuestra historia.',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface EfemeridesPageProps {
  searchParams: Promise<{ mes?: string }>;
}

function getContentTerritoryLabel(
  item: { region_id?: string | null; province_id?: string | null; municipality_id?: string | null },
  regions: any[],
  provinces: any[],
  municipalities: any[]
): string | null {
  if (item.municipality_id) {
    const mun = municipalities.find(m => m.id === item.municipality_id);
    const prov = provinces.find(p => p.id === item.province_id);
    if (mun && prov) return `${mun.name}, ${prov.name}`;
    if (mun) return mun.name;
  }
  if (item.province_id) {
    const prov = provinces.find(p => p.id === item.province_id);
    if (prov) return prov.name;
  }
  if (item.region_id) {
    const reg = regions.find(r => r.id === item.region_id);
    if (reg) return reg.name;
  }
  return null;
}

export default async function EfemeridesPage({ searchParams }: EfemeridesPageProps) {
  const params = await searchParams;
  const selectedMonth = params.mes || 'todos';

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  const [regions, provinces, municipalities, todayEphemerides, rawContents] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getTodayEphemerides(territory),
    getPublishedContentsList(territory)
  ]);

  // 1. Filter only contents of type 'ephemeris'
  let ephemerides = rawContents.filter(c => c.content_types?.code === 'ephemeris');

  // 2. Identify the principal ephemeris (Today's top ephemeris)
  const principalEphemeris = todayEphemerides.length > 0 ? todayEphemerides[0] : null;

  // 3. Exclude principal ephemeris from the list to avoid duplicate
  if (principalEphemeris) {
    ephemerides = ephemerides.filter(e => e.slug !== principalEphemeris.slug);
  }

  // 4. Apply month filter if selected
  if (selectedMonth !== 'todos') {
    const monthIndex = parseInt(selectedMonth, 10) - 1;
    ephemerides = ephemerides.filter(e => {
      if (!e.event_date) return false;
      const { month } = parseEventDate(e.event_date);
      return month === monthIndex;
    });
  }

  // 5. Paginate/Slice list (between 6 and 12 results)
  const archiveEphemerides = ephemerides.slice(0, 12);

  const cleanPrincipalSummary = principalEphemeris?.summary ? stripHtml(principalEphemeris.summary) : '';

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* A. Encabezado editorial */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Portal Federal
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Efemérides
          </h1>
          <p className="text-base text-stone-650 font-serif italic">
            Hechos, memorias y protagonistas que siguen dando sentido a nuestra historia.
          </p>
        </div>

        {/* Territory Status Indicator */}
        {territory && territory.label !== 'Argentina' && (
          <div className="bg-[#f2ede4] border border-stone-beige p-3 rounded-lg flex items-center justify-between text-xs text-stone-700 font-mono">
            <span>
              📍 Relevancia territorial activa: <strong>{territory.label}</strong> (Efemérides locales priorizadas)
            </span>
          </div>
        )}

        {/* B. Efeméride principal */}
        {principalEphemeris && selectedMonth === 'todos' && (
          <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-beige/80">
              <span className="text-[9px] font-bold uppercase tracking-wider text-earth-red font-mono bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10">
                {getEphemerisLabel(principalEphemeris.event_date)}
              </span>
              {getContentTerritoryLabel(principalEphemeris, regions, provinces, municipalities) && (
                <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/65 uppercase">
                  📍 {getContentTerritoryLabel(principalEphemeris, regions, provinces, municipalities)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                <Link href={`/contenidos/${principalEphemeris.slug}`}>
                  {principalEphemeris.title}
                </Link>
              </h2>
              <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                {formatHistoricalDate(principalEphemeris.event_date)}
              </span>
            </div>

            {cleanPrincipalSummary && (
              <p className="text-sm text-stone-700 leading-relaxed font-serif">
                {cleanPrincipalSummary}
              </p>
            )}

            <div className="pt-2">
              <Link
                href={`/contenidos/${principalEphemeris.slug}`}
                className="inline-flex items-center text-xs font-bold text-earth-red hover:underline uppercase tracking-wider font-mono"
              >
                Leer historia completa &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* D. Exploración (Filter Form) */}
        <form method="GET" action="/efemerides" className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              Explorar Archivo Cronológico
            </span>
            <span className="text-xs text-stone-600">
              Filtrar efemérides por mes de acontecimiento
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              id="mes"
              name="mes"
              defaultValue={selectedMonth}
              className="px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white w-full sm:w-48"
            >
              <option value="todos">Todos los meses</option>
              {MONTH_NAMES.map((name, index) => (
                <option key={index} value={(index + 1).toString()}>
                  {name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-charcoal hover:bg-charcoal/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors whitespace-nowrap"
            >
              Filtrar
            </button>
          </div>
        </form>

        {/* C. Archivo de efemérides List */}
        {archiveEphemerides.length > 0 ? (
          <section className="flex flex-col gap-6">
            <h2 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2.5">
              {selectedMonth !== 'todos' ? `Efemérides de ${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]}` : 'Archivo de efemérides'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {archiveEphemerides.map((e) => {
                const tLabel = getContentTerritoryLabel(e, regions, provinces, municipalities);
                return (
                  <ContentCard
                    key={e.slug}
                    content={e}
                    territoryLabel={tLabel}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          /* E. Estados vacíos */
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm">
            <p className="text-stone-500 text-sm italic font-mono">
              Estamos preparando nuevas memorias para este territorio.
            </p>
          </div>
        )}

      </div>
    </PublicPageShell>
  );
}
