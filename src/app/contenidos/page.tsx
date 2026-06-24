import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import {
  getPublishedContentsList,
  PublicContent
} from '../../lib/public-content/public-content';
import { getPublicEditorialRelations } from '../../lib/public-content/public-editorial-relations';
import { getRegions, getProvinces, getMunicipalities, getCategories } from '../../lib/catalogs/catalogs';
import PublicPageShell from '../../components/public/PublicPageShell';
import ContentCard from '../../components/cards/ContentCard';
import { stripHtml } from '../../lib/utils/formatters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Historias, cultura y memoria | La Gauchita Federal',
  description: 'Investigaciones, crónicas y relatos para comprender los territorios, las voces y las tradiciones de la Argentina.',
};

const TYPE_LABELS: Record<string, string> = {
  person: 'Personaje',
  content: 'Contenido',
  institution: 'Institución',
  recognition: 'Reconocimiento',
  media_asset: 'Archivo'
};

interface ContenidosPageProps {
  searchParams: Promise<{ categoria?: string }>;
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

export default async function ContenidosPage({ searchParams }: ContenidosPageProps) {
  const params = await searchParams;
  const selectedCategorySlug = params.categoria || 'todas';

  // Load cookies and territory context
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  // Load catalogs, contents, and categories
  const [categories, rawContents, regions, provinces, municipalities] = await Promise.all([
    getCategories(),
    getPublishedContentsList(territory),
    getRegions(),
    getProvinces(),
    getMunicipalities()
  ]);

  // Apply filters on the server side
  let filteredContents = rawContents;

  // 1. Filter by category
  if (selectedCategorySlug !== 'todas') {
    filteredContents = filteredContents.filter(c => c.categories?.slug === selectedCategorySlug);
  }

  // 2. Select main content (leadStory)
  // Exclude ephemerides if general contents exist
  const generalContents = filteredContents.filter(c => c.content_types?.code !== 'ephemeris');
  let leadStory: PublicContent | null = null;

  if (generalContents.length > 0) {
    leadStory = generalContents[0];
  } else if (filteredContents.length > 0) {
    leadStory = filteredContents[0];
  }

  // 3. Exclude leadStory and select between 3 and 6 featuredContents
  let remainingContents = leadStory
    ? filteredContents.filter(c => c.slug !== leadStory?.slug)
    : filteredContents;

  // Exclude ephemerides for list if possible
  const remainingGeneral = remainingContents.filter(c => c.content_types?.code !== 'ephemeris');
  const featuredContents = remainingGeneral.length > 0
    ? remainingGeneral.slice(0, 6)
    : remainingContents.slice(0, 6);

  // Fetch relations for the main story
  const leadRelations = leadStory && leadStory.id
    ? await getPublicEditorialRelations('content', leadStory.id)
    : [];

  const leadStoryTerritoryLabel = leadStory
    ? getContentTerritoryLabel(leadStory, regions, provinces, municipalities)
    : null;

  const cleanLeadSubtitle = leadStory?.subtitle ? stripHtml(leadStory.subtitle) : '';
  const cleanLeadSummary = leadStory?.summary ? stripHtml(leadStory.summary) : '';

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* A. Encabezado editorial */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Portal Federal
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Historias, cultura y memoria
          </h1>
          <p className="text-base text-stone-650 font-serif italic">
            Investigaciones, crónicas y relatos para comprender los territorios, las voces y las tradiciones de la Argentina.
          </p>
        </div>

        {/* E. Explorar por territorio Status Indicator */}
        <div className="bg-[#f2ede4] border border-stone-beige p-4 rounded-lg flex flex-col gap-1.5 text-xs text-stone-700 font-mono">
          <div className="flex items-center justify-between">
            <span>
              📍 Relevancia territorial activa: <strong>{territory?.label || 'Argentina'}</strong>
            </span>
          </div>
          <p className="text-[11px] text-stone-550 italic leading-relaxed">
            Los contenidos se ordenan automáticamente priorizando aquellos vinculados a tu territorio seleccionado.
          </p>
        </div>

        {/* D. Explorar por temas (Navegación por categoría) */}
        {categories.length > 0 && (
          <nav className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              Explorar por temas
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/contenidos"
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
                  selectedCategorySlug === 'todas'
                    ? 'bg-earth-red text-white border-earth-red'
                    : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
                }`}
              >
                Todos
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/contenidos?categoria=${cat.slug}`}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-earth-red text-white border-earth-red'
                      : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* B. Contenido principal */}
        {leadStory ? (
          <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-beige/80">
              <span className="text-[9px] font-bold uppercase tracking-wider text-earth-red font-mono bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10">
                Destacado Principal
              </span>
              {leadStoryTerritoryLabel && (
                <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/65 uppercase">
                  📍 {leadStoryTerritoryLabel}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9.5px] font-mono text-stone-500 uppercase tracking-wider font-bold">
                  {leadStory.content_types?.name || 'Contenido'}
                </span>
                {leadStory.categories?.name && (
                  <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase">
                    {leadStory.categories.name}
                  </span>
                )}
                {leadStory.institutions?.name && (
                  <span className="text-[9px] font-bold text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/60 tracking-wider uppercase">
                    {leadStory.institutions.name}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                <Link href={`/contenidos/${leadStory.slug}`}>
                  {leadStory.title}
                </Link>
              </h2>

              {cleanLeadSubtitle && (
                <p className="text-sm font-semibold text-stone-750 italic leading-relaxed">
                  {cleanLeadSubtitle}
                </p>
              )}
            </div>

            {cleanLeadSummary && (
              <p className="text-sm text-stone-700 leading-relaxed font-serif">
                {cleanLeadSummary}
              </p>
            )}

            <div className="pt-2">
              <Link
                href={`/contenidos/${leadStory.slug}`}
                className="inline-flex items-center text-xs font-bold text-earth-red hover:underline uppercase tracking-wider font-mono"
              >
                Leer historia completa &rarr;
              </Link>
            </div>

            {/* Lecturas vinculadas (for lead story only) */}
            {leadRelations.length > 0 && (
              <div className="mt-4 pt-5 border-t border-stone-beige/60 flex flex-col gap-3">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  Lecturas vinculadas
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {leadRelations.slice(0, 3).map((rel) => {
                    const typeLabel = rel.relatedType === 'content' && rel.contentTypeCode === 'ephemeris'
                      ? 'Efeméride'
                      : TYPE_LABELS[rel.relatedType] || rel.relatedType;

                    const badgeContent = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fcf8f2] border border-stone-beige/85 hover:border-earth-red/60 rounded text-xs transition-colors duration-150">
                        <span className="text-[8px] font-bold text-earth-red uppercase tracking-wider">
                          {typeLabel}
                        </span>
                        <span className="text-stone-800 font-serif font-semibold">
                          {rel.title}
                        </span>
                      </span>
                    );

                    if (rel.href) {
                      return (
                        <Link key={rel.id} href={rel.href} className="group">
                          {badgeContent}
                        </Link>
                      );
                    }
                    return <span key={rel.id}>{badgeContent}</span>;
                  })}
                </div>
              </div>
            )}
          </section>
        ) : null}

        {/* C. Lecturas destacadas List */}
        {featuredContents.length > 0 ? (
          <section className="flex flex-col gap-6">
            <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2.5">
              Crónicas y relatos recomendados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredContents.map((c) => {
                const tLabel = getContentTerritoryLabel(c, regions, provinces, municipalities);
                return (
                  <ContentCard
                    key={c.slug}
                    content={c}
                    territoryLabel={tLabel}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          /* F. Estado sin resultados */
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-4 items-center">
            <p className="text-stone-500 text-sm italic font-mono">
              Estamos preparando nuevas historias y memorias para este territorio.
            </p>
            {selectedCategorySlug !== 'todas' && (
              <div>
                <Link
                  href="/contenidos"
                  className="inline-flex items-center justify-center px-4 py-2 border border-stone-300 text-stone-600 text-xs font-bold font-mono rounded hover:bg-stone-50 uppercase tracking-wider"
                >
                  Quitar filtros temáticos
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </PublicPageShell>
  );
}
