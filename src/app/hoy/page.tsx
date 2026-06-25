import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getTodayInArgentinaData } from '../../lib/public-content/public-today-in-argentina';
import { getProvinces, getMunicipalities } from '../../lib/catalogs/catalogs';
import { getCurrentArgentinaDate, formatHistoricalDate } from '../../lib/utils/date';
import PublicPageShell from '../../components/public/PublicPageShell';
import ContentCard from '../../components/cards/ContentCard';
import { getPublicMediaUrl } from '../../lib/utils/media-url';
import { stripHtml, truncateText } from '../../lib/utils/formatters';
import { createServerSupabaseClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hoy en Argentina | La Gauchita Federal',
  description: 'Efemérides, protagonistas y acontecimientos culturales vinculados con la fecha actual y tu territorio.',
};

export default async function HoyEnArgentinaPage() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  const [provinces, municipalities, todayData] = await Promise.all([
    getProvinces(),
    getMunicipalities(),
    getTodayInArgentinaData(territory)
  ]);

  const {
    leadStory,
    secondaryEphemerides,
    rememberedPeople,
    agendaEvents,
    recognitions
  } = todayData;

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

  // Resolve today's date formatted in Argentine Spanish
  const argentinaToday = getCurrentArgentinaDate();
  const formattedDate = argentinaToday.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const showSidebar = rememberedPeople.length > 0 || agendaEvents.length > 0 || recognitions.length > 0;

  // If there are absolutely no ephemerides today, display the custom empty state
  if (!leadStory) {
    return (
      <PublicPageShell maxWidth="max-w-4xl">
        <div className="flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 font-mono">
              Fecha, memoria y territorio
            </span>
            <h1 className="text-4xl font-serif font-black text-charcoal">
              Hoy en Argentina
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 font-mono mt-1">
              <span className="capitalize">{formattedDate}</span>
              <span>📍 Territorio: {territoryName}</span>
            </div>
          </div>

          {/* Empty State Block */}
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-stone-beige/25 flex items-center justify-center text-stone-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="text-xl font-serif font-bold text-charcoal">
                La memoria cultural se construye todos los días
              </h2>
              <p className="text-stone-600 text-sm font-serif leading-relaxed">
                No se registran efemérides públicas para la fecha y el territorio seleccionados. Explore el archivo histórico y cultural de Argentina.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/efemerides"
                className="px-5 py-2.5 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded hover:bg-earth-red/90 transition-colors"
              >
                Ver todas las efemérides
              </Link>
              <Link
                href="/archivo"
                className="px-5 py-2.5 border border-stone-beige text-stone-700 bg-white hover:bg-stone-50 text-xs uppercase tracking-wider font-bold rounded transition-all"
              >
                Explorar archivo de medios
              </Link>
            </div>
          </div>
        </div>
      </PublicPageShell>
    );
  }

  // Fetch cover image for lead story if any from editorial relations
  const leadImage = await (async () => {
    if (!leadStory || !leadStory.id) return null;
    try {
      const supabase = createServerSupabaseClient();
      const { data: rels } = await supabase
        .from('editorial_relations')
        .select('target_entity_id')
        .eq('source_entity_type', 'content')
        .eq('source_entity_id', leadStory.id)
        .eq('target_entity_type', 'media_asset');

      if (!rels || rels.length === 0) return null;
      const assetIds = rels.map((r: any) => r.target_entity_id);

      const { data: assets } = await supabase
        .from('media_assets')
        .select('bucket_name, storage_path, alt_text, asset_type')
        .in('id', assetIds)
        .eq('status', 'active')
        .eq('visibility', 'public');

      if (!assets || assets.length === 0) return null;

      // Prioritize image types: cover_image, content_image, gallery_image, historical_photo
      const imageAsset = assets.find((a: any) =>
        ['cover_image', 'content_image', 'gallery_image', 'historical_photo'].includes(a.asset_type)
      );

      return imageAsset || assets[0];
    } catch (e) {
      console.error('Error fetching lead story image:', e);
      return null;
    }
  })();

  const leadImageUrl = leadImage
    ? getPublicMediaUrl(leadImage.bucket_name, leadImage.storage_path)
    : null;

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Fecha, memoria y territorio
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Hoy en Argentina
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 font-mono mt-1">
            <span className="capitalize">{formattedDate}</span>
            <span>📍 Territorio: {territoryName}</span>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Area (Ephemerides) */}
          <div className={`flex flex-col gap-8 ${showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            
            {/* Lead Story */}
            <section className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col shadow-sm">
              {leadImageUrl && (
                <div className="relative w-full h-64 sm:h-72 bg-stone-100 border-b border-stone-beige/70">
                  <img
                    src={leadImageUrl}
                    alt={leadStory.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-beige/60">
                  <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-widest uppercase font-mono">
                    Efeméride Destacada
                  </span>
                  {leadStory.categories?.name && (
                    <span className="text-[9px] font-bold text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase font-mono">
                      {leadStory.categories.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                    <Link href={`/contenidos/${leadStory.slug}`}>
                      {leadStory.title}
                    </Link>
                  </h2>
                  <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                    {formatHistoricalDate(leadStory.event_date)}
                  </span>
                </div>

                {leadStory.summary && (
                  <p className="text-sm text-stone-700 leading-relaxed font-serif">
                    {stripHtml(leadStory.summary)}
                  </p>
                )}

                <div className="pt-2 flex justify-start">
                  <Link
                    href={`/contenidos/${leadStory.slug}`}
                    className="inline-flex items-center text-xs font-bold text-earth-red hover:underline uppercase tracking-wider font-mono"
                  >
                    Leer historia completa &rarr;
                  </Link>
                </div>
              </div>
            </section>

            {/* Secondary Ephemerides Grid */}
            {secondaryEphemerides.length > 0 && (
              <section className="flex flex-col gap-5">
                <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2">
                  Más historias de hoy
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {secondaryEphemerides.map(c => (
                    <ContentCard
                      key={c.slug}
                      content={c}
                      territoryLabel={c.province_id ? provinces.find(p => p.id === c.province_id)?.name : null}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar */}
          {showSidebar && (
            <aside className="lg:col-span-1 flex flex-col gap-8">
              
              {/* B. Personajes recordados */}
              {rememberedPeople.length > 0 && (
                <section className="bg-[#fdfbf7] border border-stone-beige rounded-lg p-5 flex flex-col gap-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-earth-red border-b border-stone-beige pb-2 font-mono">
                    Personajes recordados
                  </h3>
                  <div className="flex flex-col gap-4">
                    {rememberedPeople.map(p => {
                      const label = p.commemoration_type === 'birth' ? 'Nacimiento' : 'Fallecimiento';
                      const pTerritory = p.provinces?.name || 'Nacional';

                      return (
                        <div key={p.slug} className="flex flex-col gap-1.5 group border-b border-stone-beige/40 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[8px] font-mono font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 uppercase tracking-wider">
                              {label}
                            </span>
                            {p.years_elapsed && (
                              <span className="text-[8px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                                {p.years_elapsed} años
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-sm text-charcoal group-hover:text-earth-red transition-colors leading-snug">
                            <Link href={`/personajes/${p.slug}`}>
                              {p.full_name}
                            </Link>
                          </h4>
                          <span className="text-[9px] font-mono text-stone-500">
                            📍 Ámbito: {pTerritory}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* C. Agenda cultural */}
              {agendaEvents.length > 0 && (
                <section className="bg-[#fdfbf7] border border-stone-beige rounded-lg p-5 flex flex-col gap-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-earth-red border-b border-stone-beige pb-2 font-mono">
                    Agenda cultural (Próximos días)
                  </h3>
                  <div className="flex flex-col gap-4">
                    {agendaEvents.map(e => {
                      const eventTerritory = e.province_id ? provinces.find(p => p.id === e.province_id)?.name : 'Nacional';
                      return (
                        <div key={e.slug} className="flex flex-col gap-1.5 group border-b border-stone-beige/40 pb-3 last:border-b-0 last:pb-0">
                          <span className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                            📅 {e.event_date ? new Date(e.event_date + 'T00:00:00').toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short'
                            }) : ''}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-charcoal group-hover:text-earth-red transition-colors leading-snug">
                            <Link href={`/contenidos/${e.slug}`}>
                              {e.title}
                            </Link>
                          </h4>
                          <span className="text-[9px] font-mono text-stone-500">
                            📍 {eventTerritory}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-stone-beige/40 flex justify-end">
                    <Link
                      href="/agenda"
                      className="text-[10px] font-mono font-bold text-earth-red hover:underline uppercase tracking-wider"
                    >
                      Ver agenda completa &rarr;
                    </Link>
                  </div>
                </section>
              )}

              {/* D. Recordamos */}
              {recognitions.length > 0 && (
                <section className="bg-[#fdfbf7] border border-stone-beige rounded-lg p-5 flex flex-col gap-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-earth-red border-b border-stone-beige pb-2 font-mono">
                    Reconocimientos y Avales
                  </h3>
                  <div className="flex flex-col gap-4">
                    {recognitions.map(r => (
                      <div key={r.slug} className="flex flex-col gap-1.5 group border-b border-stone-beige/40 pb-3 last:border-b-0 last:pb-0">
                        {r.years_elapsed && (
                          <span className="text-[8px] font-mono font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 uppercase tracking-wider self-start">
                            Aniversario: {r.years_elapsed} años
                          </span>
                        )}
                        <h4 className="font-serif font-bold text-sm text-charcoal group-hover:text-earth-red transition-colors leading-snug">
                          <Link href={`/reconocimientos/${r.slug}`}>
                            {r.title}
                          </Link>
                        </h4>
                        <span className="text-[9px] font-mono text-stone-500 italic">
                          Otorgado por: {r.granting_institution_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </aside>
          )}

        </div>

      </div>
    </PublicPageShell>
  );
}
