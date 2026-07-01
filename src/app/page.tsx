import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../lib/utils/territory';
import {
  getRegions,
  getProvinces,
  getMunicipalities,
  getContentTypes,
  getCategories,
  getMembershipLevels
} from '../lib/catalogs/catalogs';
import {
  getPublishedContents,
  getActiveInstitutions,
  getActiveRecognitions,
  getPublicMediaAssets,
  getTodayEphemerides,
  PublicContent
} from '../lib/public-content/public-content';
import { getPublishedPeople } from '../lib/public-content/public-people';
import { getPublicEditorialRelations } from '../lib/public-content/public-editorial-relations';
import { resolveHomepageLayout } from '../lib/public-content/public-homepage-slots';
import PublicPageShell from '../components/public/PublicPageShell';
import { formatInstitutionType, formatAssetType } from '../lib/utils/formatters';
import { getPublicMediaUrl } from '../lib/utils/media-url';
import { getEphemerisLabel, formatHistoricalDate } from '../lib/utils/date';

// Consolidated Card components imports
import ContentCard from '../components/cards/ContentCard';
import PersonCard from '../components/cards/PersonCard';
import InstitutionCard from '../components/cards/InstitutionCard';
import RecognitionCard from '../components/cards/RecognitionCard';
import MagazineEditionCard from '../components/cards/MagazineEditionCard';
import ArchiveAssetCard from '../components/cards/ArchiveAssetCard';

// Utility and DB imports
import { getPublishedMagazines } from '../lib/public-content/public-magazines';
import { stripHtml, truncateText } from '../lib/utils/formatters';
import { createServerSupabaseClient } from '../lib/supabase/server';
import { getHomeJsonLd } from '../lib/seo/json-ld';

export const metadata: Metadata = {
  title: 'La Gauchita Federal',
  description: 'Donde late la historia de cada argentino. Conectando regiones, provincias y municipios.',
};

const PERSON_TYPE_LABELS: Record<string, string> = {
  historical_figure: 'PrÃ³cer / Figura HistÃ³rica',
  writer: 'Escritor/a',
  poet: 'Poeta / Poetisa',
  historian: 'Historiador/a',
  musician: 'MÃºsico/a',
  singer: 'Cantante',
  artist: 'Artista',
  artisan: 'Artesano/a',
  educator: 'Educador/a',
  researcher: 'Investigador/a',
  public_figure: 'Figura PÃºblica',
  cultural_referent: 'Referente Cultural',
  other: 'Personaje Popular'
};

const TYPE_LABELS: Record<string, string> = {
  person: 'Personaje',
  content: 'Contenido',
  institution: 'InstituciÃ³n',
  recognition: 'Reconocimiento',
  media_asset: 'Archivo'
};

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

export default async function Home() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  const [
    regions,
    provinces,
    municipalities,
    contentTypes,
    categories,
    membershipLevels,
    contents,
    institutions,
    recognitions,
    mediaAssets,
    todayEphemerides,
    people,
    editorialLayout,
    magazines
  ] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getContentTypes(),
    getCategories(),
    getMembershipLevels(),
    getPublishedContents(territory),
    getActiveInstitutions(territory),
    getActiveRecognitions(),
    getPublicMediaAssets(),
    getTodayEphemerides(territory),
    getPublishedPeople(territory),
    resolveHomepageLayout(territory),
    getPublishedMagazines()
  ]);

  // Composition: determine leadStory and featuredContents from resolved layout
  const { leadStory, featuredContents } = editorialLayout;

  // Fetch cover image for lead story if any from editorial relations
  const leadImage = await (async () => {
    if (!leadStory) return null;
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

  // Fetch relations for lead story
  const leadRelations = leadStory && leadStory.id
    ? await getPublicEditorialRelations('content', leadStory.id)
    : [];

  const leadStoryTerritoryLabel = leadStory
    ? getContentTerritoryLabel(leadStory, regions, provinces, municipalities)
    : null;

  // Filter lists according to counts and requirements
  const mainStories = (featuredContents || []).slice(0, 4); // B. Max 4 stories
  const protagonists = (people || []).slice(0, 4); // D. Max 4 characters
  const activeMediaAssets = (mediaAssets || []).slice(0, 3); // E. Max 3 assets
  const magazineEditions = (magazines || []).slice(0, 3); // E. Max 3 magazine editions
  const activeInstitutions = (institutions || []).slice(0, 4); // F. Max 4 institutions
  const publicRecognitions = (recognitions || []).slice(0, 3); // E. Max 3 recognitions

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const homeJsonLds = getHomeJsonLd(siteUrl);

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      {homeJsonLds.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      {/* A. HERO PRINCIPAL */}
      {leadStory ? (
        <section className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm hover:border-muted-amber hover:shadow-md transition-all duration-350">
          {leadImageUrl ? (
            <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[320px] relative bg-stone-100 border-b md:border-b-0 md:border-r border-stone-beige/70">
              <img
                src={leadImageUrl}
                alt={leadImage?.alt_text || leadStory.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          ) : (
            /* Editorial Fallback Layout when no real image exists */
            <div className="w-full md:w-1/2 min-h-[320px] bg-[#fbf8f3] flex flex-col justify-between p-8 border-b md:border-b-0 md:border-r border-stone-beige/75 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-stone-beige/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-earth-red/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex flex-col gap-3 z-10">
                <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10 tracking-widest uppercase font-mono self-start">
                  Patrimonio & Memoria
                </span>
                <span className="font-serif italic text-stone-500 text-sm">
                  Documento e InvestigaciÃ³n
                </span>
              </div>

              <div className="mt-8 z-10 flex flex-col gap-2">
                <p className="font-serif font-black text-2xl text-charcoal leading-tight">
                  {leadStory.title}
                </p>
                <div className="w-16 h-[2px] bg-earth-red mt-2" />
              </div>

              <div className="mt-8 z-10 flex items-center justify-between text-[9px] font-mono text-stone-400">
                <span>LA GAUCHITA FEDERAL</span>
                <span>{leadStory.publish_date ? new Date(leadStory.publish_date).toLocaleDateString('es-AR') : ''}</span>
              </div>
            </div>
          )}

          {/* Details Column */}
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-beige/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
                    {leadStory.content_types?.name || 'Destacado'}
                  </span>
                  {leadStory.categories?.name && (
                    <span className="text-[9px] font-bold text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/65 uppercase font-mono">
                      {leadStory.categories.name}
                    </span>
                  )}
                </div>

                {leadStoryTerritoryLabel && (
                  <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/65 uppercase tracking-wide">
                    ðŸ“ {leadStoryTerritoryLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-2xl md:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                  <Link href={`/contenidos/${leadStory.slug}`}>
                    {leadStory.title}
                  </Link>
                </h2>

                {leadStory.subtitle && (
                  <p className="text-xs font-semibold text-stone-700 italic leading-relaxed">
                    {stripHtml(leadStory.subtitle)}
                  </p>
                )}

                {leadStory.summary && (
                  <p className="text-sm text-stone-700 leading-relaxed font-serif">
                    {truncateText(stripHtml(leadStory.summary), 240)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-stone-beige/50">
              <Link
                href={`/contenidos/${leadStory.slug}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-earth-red hover:bg-earth-red/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
              >
                Leer historia completa &rarr;
              </Link>

              <Link
                href="/acerca"
                className="inline-flex items-center justify-center px-4 py-2 border border-stone-beige hover:border-earth-red text-stone-700 hover:text-earth-red text-[10px] uppercase font-bold tracking-wider rounded font-mono bg-white transition-all"
              >
                Conocer el proyecto
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* Empty/Fallback main hero if absolutely no leadStory is available */
        <header className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 text-center flex flex-col items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red">
            La Gauchita Federal
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-charcoal">
            Archivo Vivo de Historia y Cultura
          </h1>
          <p className="text-sm text-stone-600 max-w-lg">
            Estamos preparando contenidos y recopilando documentos histÃ³ricos de cada rincÃ³n del paÃ­s.
          </p>
        </header>
      )}

      {/* B. BLOQUE PRINCIPAL DE HISTORIAS + C. EFEMÃ‰RIDES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Historias y Cultura */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-xl font-serif font-black text-charcoal">
              Historias y cultura
            </h2>
            <Link href="/contenidos" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todas &rarr;
            </Link>
          </div>

          {mainStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {mainStories.map((c) => {
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
          ) : (
            <div className="bg-stone-50 border border-stone-200/60 rounded-lg p-8 text-center">
              <p className="text-xs text-stone-500 italic font-mono">
                No hay mÃ¡s historias publicadas para este territorio.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Un dÃ­a como hoy */}
        <div className="flex flex-col">
          <section className="bg-[#fdfbf7] border border-muted-amber/60 rounded-lg p-6 flex flex-col gap-6 shadow-sm h-full">
            <div className="flex items-center justify-between pb-3 border-b border-stone-beige/80">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-earth-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-earth-red">
                  Un dÃ­a como hoy
                </h2>
              </div>
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider font-mono">
                EfemÃ©rides
              </span>
            </div>

            {todayEphemerides.length > 0 ? (
              <div className="flex flex-col gap-5 flex-grow justify-between">
                {/* Principal Ephemeris */}
                <div className="flex flex-col gap-3">
                  {(() => {
                    const mainItem = todayEphemerides[0];
                    const label = getEphemerisLabel(mainItem.event_date);
                    const histDate = formatHistoricalDate(mainItem.event_date);
                    const ephemerisTerritoryLabel = getContentTerritoryLabel(mainItem, regions, provinces, municipalities);

                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-bold text-earth-red uppercase tracking-wide bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10">
                            {label}
                          </span>
                          {ephemerisTerritoryLabel && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/60 uppercase tracking-wide">
                              ðŸ“ {ephemerisTerritoryLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-bold text-lg text-charcoal hover:text-earth-red transition-colors duration-200 leading-snug">
                          <Link href={`/contenidos/${mainItem.slug}`}>
                            {mainItem.title}
                          </Link>
                        </h3>
                        <p className="text-[10px] font-semibold text-stone-500 italic font-mono uppercase tracking-wider">
                          {histDate}
                        </p>
                        {mainItem.summary && (
                          <p className="text-xs text-stone-705 leading-relaxed line-clamp-4 font-serif">
                            {stripHtml(mainItem.summary)}
                          </p>
                        )}
                        <Link
                          href={`/contenidos/${mainItem.slug}`}
                          className="inline-flex items-center text-[10px] font-bold text-earth-red hover:underline mt-1 uppercase tracking-wider font-mono"
                        >
                          Leer efemÃ©ride &rarr;
                        </Link>
                      </>
                    );
                  })()}
                </div>

                {/* Secondary Ephemerides */}
                {todayEphemerides.length > 1 && (
                  <div className="border-t border-stone-beige/80 pt-4 mt-2 flex flex-col gap-3.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                      Otras efemÃ©rides
                    </h4>
                    <div className="flex flex-col gap-3">
                      {todayEphemerides.slice(1, 3).map((item) => {
                        const histDate = formatHistoricalDate(item.event_date);
                        const ephemerisTerritoryLabel = getContentTerritoryLabel(item, regions, provinces, municipalities);

                        return (
                          <div key={item.slug} className="flex flex-col gap-1 group">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-mono text-stone-500">
                                {histDate}
                              </span>
                              {ephemerisTerritoryLabel && (
                                <span className="text-[8px] font-bold text-earth-red uppercase tracking-wider bg-earth-red/5 px-1.5 py-0.5 rounded border border-earth-red/10">
                                  {ephemerisTerritoryLabel}
                                </span>
                              )}
                            </div>
                            <h5 className="font-serif font-bold text-xs text-charcoal group-hover:text-earth-red transition-colors duration-200 leading-snug line-clamp-2">
                              <Link href={`/contenidos/${item.slug}`}>
                                {item.title}
                              </Link>
                            </h5>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Compact Hoy en Argentina CTA */}
                <div className="mt-2 pt-4 border-t border-stone-beige/65 flex flex-col gap-2 bg-stone-beige/10 p-3 rounded border border-stone-beige/30">
                  <span className="text-[9px] font-bold text-stone-550 uppercase tracking-widest font-mono">
                    Hoy en Argentina
                  </span>
                  <p className="text-[11px] text-stone-600 leading-normal font-serif">
                    Acontecimientos, conmemoraciones de prÃ³ceres y la agenda cultural federal programada para el dÃ­a de la fecha.
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-beige/40 pt-2.5 mt-1">
                    <Link
                      href="/hoy"
                      className="text-[10px] font-bold text-earth-red hover:underline uppercase tracking-wider font-mono"
                    >
                      Explorar el dÃ­a &rarr;
                    </Link>
                    <Link
                      href="/agenda"
                      className="text-[10px] font-bold text-stone-600 hover:underline uppercase tracking-wider font-mono"
                    >
                      Ver agenda completa &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 my-auto">
                <p className="text-stone-500 text-xs italic font-medium">
                  Estamos preparando nuevos contenidos para esta fecha.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* D. PERSONAJES DESTACADOS */}
      {protagonists.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-serif font-black text-charcoal">
                Personajes destacados
              </h2>
              <p className="text-[10px] text-stone-500 font-mono italic">
                Voces y trayectorias vinculadas con nuestra cultura
              </p>
            </div>
            <Link href="/personajes" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {protagonists.map((p) => {
              const imageUrl = p.media_assets
                ? getPublicMediaUrl(p.media_assets.bucket_name, p.media_assets.storage_path)
                : null;
              const lifeSpan = (() => {
                if (!p.birth_date && !p.death_date) return null;
                const birthYear = p.birth_date ? p.birth_date.split('-')[0] : 'Â¿?';
                const deathYear = p.death_date ? p.death_date.split('-')[0] : 'Presente';
                return `${birthYear} â€“ ${deathYear}`;
              })();
              const tLabel = (() => {
                if (p.municipalities?.name) return `${p.municipalities.name}, ${p.provinces?.name || ''}`;
                if (p.provinces?.name) return p.provinces.name;
                if (p.regions?.name) return p.regions.name;
                return 'Ãmbito Nacional';
              })();

              return (
                <PersonCard
                  key={p.slug}
                  person={p}
                  imageUrl={imageUrl}
                  lifeSpan={lifeSpan}
                  territoryLabel={tLabel}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* E.1 REVISTA DIGITAL */}
      {magazineEditions.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-xl font-serif font-black text-charcoal">
              Revista La Gauchita
            </h2>
            <Link href="/revista" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todas &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {magazineEditions.map((edition) => (
              <MagazineEditionCard key={edition.id} edition={edition} />
            ))}
          </div>
        </section>
      )}

      {/* E.2 ARCHIVO Y MEMORIA */}
      {activeMediaAssets.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-xl font-serif font-black text-charcoal">
              Archivo y memoria
            </h2>
            <Link href="/archivo" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Explorar archivo &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {activeMediaAssets.map((asset) => (
              <ArchiveAssetCard
                key={`${asset.bucket_name}/${asset.storage_path}`}
                asset={asset}
              />
            ))}
          </div>
        </section>
      )}

      {/* E.3 AVALES Y RECONOCIMIENTOS */}
      {publicRecognitions.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-xl font-serif font-black text-charcoal">
              Trayectoria y Reconocimientos
            </h2>
            <Link href="/reconocimientos" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todos &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicRecognitions.map((r) => (
              <RecognitionCard key={r.slug} recognition={r} />
            ))}
          </div>
        </section>
      )}

      {/* F. BLOQUE INSTITUCIONAL */}
      <section className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 sm:p-8 md:p-10 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-2.5 text-center max-w-2xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Legado e Institucional
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight">
            Una historia que sigue creciendo
          </h2>
          <p className="text-sm text-stone-705 leading-relaxed font-serif">
            La Gauchita Federal nace como continuidad digital de una obra cultural construida durante dÃ©cadas: Revista La Gauchita, el legado de Eduardo Ceballos y el Instituto Cultural Andino.
          </p>
        </div>

        {/* Tres Columnas del Legado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">

          {/* Eduardo Ceballos */}
          <Link href="/eduardo-ceballos" className="group bg-white border border-stone-beige/85 hover:border-earth-red p-5 rounded-lg flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
            <div className="flex flex-col gap-2">
              <h3 className="font-serif font-bold text-base text-charcoal group-hover:text-earth-red transition-colors">
                Eduardo Ceballos
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Legado de escritor, periodista e investigador cultural.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-earth-red uppercase tracking-wider mt-4 flex items-center gap-1">
              Ver legado &rarr;
            </span>
          </Link>

          {/* Revista La Gauchita */}
          <Link href="/revista-la-gauchita" className="group bg-white border border-stone-beige/85 hover:border-earth-red p-5 rounded-lg flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
            <div className="flex flex-col gap-2">
              <h3 className="font-serif font-bold text-base text-charcoal group-hover:text-earth-red transition-colors">
                Revista La Gauchita
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Trayectoria editorial, memoria y cultura popular.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-earth-red uppercase tracking-wider mt-4 flex items-center gap-1">
              Explorar revista &rarr;
            </span>
          </Link>

          {/* Instituto Cultural Andino */}
          <Link href="/instituto-cultural-andino" className="group bg-white border border-stone-beige/85 hover:border-earth-red p-5 rounded-lg flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
            <div className="flex flex-col gap-2">
              <h3 className="font-serif font-bold text-base text-charcoal group-hover:text-earth-red transition-colors">
                Instituto Cultural Andino
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Publicaciones, investigaciÃ³n y promociÃ³n cultural.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-earth-red uppercase tracking-wider mt-4 flex items-center gap-1">
              Ver instituto &rarr;
            </span>
          </Link>

        </div>

        {/* Enlace editorial final */}
        <div className="text-center pt-4 border-t border-stone-beige/40 mt-2">
          <Link
            href="/acerca"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-earth-red hover:bg-earth-red/90 text-white text-[10px] uppercase font-bold tracking-widest rounded font-mono transition-colors shadow-xs"
          >
            Conocer La Gauchita Federal
          </Link>
        </div>
      </section>

    </PublicPageShell>
  );
}
