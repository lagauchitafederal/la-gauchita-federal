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
import PublicPageShell from '../components/public/PublicPageShell';
import { formatInstitutionType, formatAssetType } from '../lib/utils/formatters';
import { getPublicMediaUrl } from '../lib/utils/media-url';
import { getEphemerisLabel, formatHistoricalDate } from '../lib/utils/date';

export const metadata: Metadata = {
  title: 'La Gauchita Federal',
  description: 'Donde late la historia de cada argentino. Conectando regiones, provincias y municipios.',
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

const TYPE_LABELS: Record<string, string> = {
  person: 'Personaje',
  content: 'Contenido',
  institution: 'Institución',
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
    people
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
    getPublishedPeople(territory)
  ]);

  // Composition: determine leadStory and featuredContents
  const allContents = contents || [];
  const generalContents = allContents.filter(c => c.content_types?.code !== 'ephemeris');

  let leadStory: PublicContent | null = null;
  let featuredContents: PublicContent[] = [];

  if (generalContents.length > 0) {
    leadStory = generalContents[0];
    featuredContents = generalContents.slice(1, 7); // Show between 3 and 6
  } else if (allContents.length > 0) {
    leadStory = allContents[0];
    featuredContents = allContents.slice(1, 7);
  }

  // Fetch relations for lead story
  const leadRelations = leadStory && leadStory.id
    ? await getPublicEditorialRelations('content', leadStory.id)
    : [];

  const leadStoryTerritoryLabel = leadStory
    ? getContentTerritoryLabel(leadStory, regions, provinces, municipalities)
    : null;

  // Filter lists according to counts and requirements
  const protagonists = (people || []).slice(0, 8); // Between 4 and 8
  const activeMediaAssets = (mediaAssets || []).slice(0, 6); // Between 3 and 6
  const activeInstitutions = (institutions || []).slice(0, 4); // Up to 4
  const publicRecognitions = (recognitions || []).slice(0, 3); // Closing block, up to 3

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      {/* A. CABECERA EDITORIAL / IDENTIDAD */}
      <header className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 flex flex-col lg:flex-row gap-8 lg:items-center">
        <div className="flex-1 flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red">
              Portal Federal
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-charcoal">
              La Gauchita Federal
            </h1>
            <p className="text-lg text-stone-750 font-serif font-bold italic leading-relaxed">
              Archivo vivo de historia, cultura y memoria federal.
            </p>
          </div>
          
          <p className="text-sm text-stone-650 leading-relaxed">
            Una plataforma impulsada para reunir contenidos, personajes, instituciones, reconocimientos y materiales de archivo vinculados a la identidad cultural de cada argentino.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              href="/contenidos"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 transition-colors duration-200"
            >
              Explorar contenidos
            </Link>
            <Link
              href="/archivo"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-stone-beige text-xs uppercase tracking-wider font-bold rounded-md text-stone-700 bg-white hover:bg-stone-50 hover:text-earth-red transition-all duration-200"
            >
              Ver archivo documental
            </Link>
          </div>

          {/* Reduced weight Indicators */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-mono text-stone-500 border-t border-stone-beige/50 pt-4 mt-2">
            {contents.length > 0 && (
              <span>📖 <strong>{contents.length}</strong> Contenidos</span>
            )}
            {institutions.length > 0 && (
              <span>🏛️ <strong>{institutions.length}</strong> Instituciones</span>
            )}
            {recognitions.length > 0 && (
              <span>⭐ <strong>{recognitions.length}</strong> Avales</span>
            )}
            {mediaAssets.length > 0 && (
              <span>🖼️ <strong>{mediaAssets.length}</strong> Archivos</span>
            )}
          </div>
        </div>
      </header>

      {/* B. PORTADA PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Titular Principal */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {leadStory ? (
            <div className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-4 shadow-sm h-full justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-beige/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-earth-red font-mono">
                    Titular Destacado
                  </span>
                  {leadStoryTerritoryLabel && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/60 uppercase tracking-wide">
                      📍 {leadStoryTerritoryLabel}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase self-start">
                    {leadStory.content_types?.name || 'Destacado'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-charcoal leading-tight hover:text-earth-red transition-colors duration-200">
                    <Link href={`/contenidos/${leadStory.slug}`}>
                      {leadStory.title}
                    </Link>
                  </h2>
                </div>

                {leadStory.subtitle && (
                  <p className="text-sm font-semibold text-stone-750 italic leading-relaxed">
                    {leadStory.subtitle}
                  </p>
                )}

                {leadStory.summary && (
                  <p className="text-sm text-stone-650 leading-relaxed font-serif">
                    {leadStory.summary}
                  </p>
                )}

                <div>
                  <Link
                    href={`/contenidos/${leadStory.slug}`}
                    className="inline-flex items-center text-xs font-bold text-earth-red hover:underline uppercase tracking-wider font-mono mt-1"
                  >
                    Leer la historia completa &rarr;
                  </Link>
                </div>
              </div>

              {/* Lecturas vinculadas */}
              {leadRelations.length > 0 && (
                <div className="pt-5 border-t border-stone-beige/60 flex flex-col gap-3">
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
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200/60 rounded-lg p-8 text-center flex items-center justify-center h-full">
              <p className="text-xs text-stone-500 italic font-mono">
                No hay contenidos destacados disponibles para este territorio.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Un día como hoy */}
        <div className="flex flex-col">
          <section className="bg-[#fdfbf7] border border-muted-amber/60 rounded-lg p-6 flex flex-col gap-6 shadow-sm h-full">
            <div className="flex items-center justify-between pb-3 border-b border-stone-beige/80">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-earth-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-earth-red">
                  Un día como hoy
                </h2>
              </div>
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider font-mono">
                Efemérides
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
                              📍 {ephemerisTerritoryLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-black text-xl text-charcoal hover:text-earth-red transition-colors duration-200 leading-snug">
                          <Link href={`/contenidos/${mainItem.slug}`}>
                            {mainItem.title}
                          </Link>
                        </h3>
                        <p className="text-[10px] font-semibold text-stone-500 italic font-mono uppercase tracking-wider">
                          {histDate}
                        </p>
                        {mainItem.summary && (
                          <p className="text-xs text-stone-700 leading-relaxed line-clamp-4">
                            {mainItem.summary}
                          </p>
                        )}
                        <Link
                          href={`/contenidos/${mainItem.slug}`}
                          className="inline-flex items-center text-[10px] font-bold text-earth-red hover:underline mt-1 uppercase tracking-wider font-mono"
                        >
                          Leer efeméride &rarr;
                        </Link>
                      </>
                    );
                  })()}
                </div>

                {/* Secondary Ephemerides */}
                {todayEphemerides.length > 1 && (
                  <div className="border-t border-stone-beige/80 pt-4 mt-2 flex flex-col gap-3.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                      Otras efemérides
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

      {/* C. CRÓNICAS Y CONTENIDOS DESTACADOS */}
      {featuredContents.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-2xl font-serif font-black text-charcoal">
              Crónicas y contenidos destacados
            </h2>
            <Link href="/contenidos" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todos &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContents.map((c) => {
              const tLabel = getContentTerritoryLabel(c, regions, provinces, municipalities);
              return (
                <div key={c.slug} className="p-5 bg-[#fcf8f2] border border-stone-beige rounded-lg flex flex-col gap-3 hover:border-muted-amber hover:shadow-sm transition-all duration-205 justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase">
                        {c.content_types?.name || 'Contenido'}
                      </span>
                      {tLabel && (
                        <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/60 uppercase">
                          📍 {tLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-base text-charcoal hover:text-earth-red transition-colors leading-snug line-clamp-2">
                      <Link href={`/contenidos/${c.slug}`}>
                        {c.title}
                      </Link>
                    </h3>
                    {c.subtitle && (
                      <p className="text-[11px] font-semibold text-stone-600 italic line-clamp-1">{c.subtitle}</p>
                    )}
                    {c.summary && (
                      <p className="text-xs text-stone-700 leading-relaxed line-clamp-3">{c.summary}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] font-mono mt-2 pt-3 border-t border-stone-beige/50">
                    {c.publish_date && (
                      <span className="text-stone-500">{new Date(c.publish_date).toLocaleDateString()}</span>
                    )}
                    <Link href={`/contenidos/${c.slug}`} className="text-earth-red hover:underline font-bold uppercase tracking-wider">
                      Leer más &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* D. PROTAGONISTAS FEDERALES */}
      {protagonists.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1 pb-3 border-b border-stone-beige/85">
            <h2 className="text-2xl font-serif font-black text-charcoal">
              Protagonistas federales
            </h2>
            <p className="text-xs text-stone-500 font-mono italic">
              Voces y trayectorias vinculadas con este territorio
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {protagonists.map((p) => {
              const imageUrl = p.media_assets
                ? getPublicMediaUrl(p.media_assets.bucket_name, p.media_assets.storage_path)
                : null;

              return (
                <div key={p.slug} className="bg-[#fcf8f2] border border-stone-beige rounded-lg overflow-hidden flex flex-col hover:border-muted-amber hover:shadow-sm transition-all duration-200 justify-between">
                  <div>
                    {imageUrl ? (
                      <div className="relative w-full h-40 bg-stone-100 overflow-hidden border-b border-stone-beige/70">
                        <img
                          src={imageUrl}
                          alt={p.media_assets?.alt_text || p.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-4 border-b border-stone-beige/70">
                        <svg className="w-10 h-10 text-stone-400/80 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-2">
                      <span className="text-[8px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase self-start">
                        {PERSON_TYPE_LABELS[p.person_type] || p.person_type}
                      </span>
                      <h3 className="font-serif font-black text-sm text-charcoal hover:text-earth-red transition-colors leading-snug line-clamp-2">
                        <Link href={`/personajes/${p.slug}`}>
                          {p.full_name}
                        </Link>
                      </h3>
                      {p.short_bio && (
                        <p className="text-xs text-stone-700 leading-relaxed font-serif line-clamp-3">{p.short_bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-stone-beige/50 mt-auto">
                    <Link href={`/personajes/${p.slug}`} className="text-[9px] font-mono font-bold text-earth-red hover:underline uppercase tracking-wider">
                      Ver perfil &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* E. ARCHIVO Y MEMORIA */}
      {activeMediaAssets.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-2xl font-serif font-black text-charcoal">
              Archivo y memoria
            </h2>
            <Link href="/archivo" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Explorar archivo &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMediaAssets.map((ma) => {
              const imageUrl = getPublicMediaUrl(ma.bucket_name, ma.storage_path);
              const isImage = 
                (ma.mime_type && ma.mime_type.startsWith('image/')) ||
                [
                  'cover_image',
                  'content_image',
                  'gallery_image',
                  'historical_photo'
                ].includes(ma.asset_type);

              const useContain = ['recognition_document', 'cover_image'].includes(ma.asset_type);

              return (
                <div key={ma.storage_path} className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col hover:border-muted-amber hover:shadow-sm transition-all duration-300">
                  {isImage && imageUrl ? (
                    useContain ? (
                      <div className="relative w-full h-44 bg-[#f6f0e6] flex items-center justify-center p-4 border-b border-stone-beige/60">
                        <img
                          src={imageUrl}
                          alt={ma.alt_text || ma.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-44 bg-[#f6f0e6] overflow-hidden border-b border-stone-beige/60">
                        <img
                          src={imageUrl}
                          alt={ma.alt_text || ma.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )
                  ) : (
                    <div className="relative w-full h-44 bg-[#f6f0e6] flex flex-col items-center justify-center p-6 border-b border-stone-beige/60 text-stone-400 gap-2">
                      <svg className="w-10 h-10 text-stone-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                        {formatAssetType(ma.asset_type)}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-grow gap-2">
                    <span className="text-[8px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase self-start">
                      {formatAssetType(ma.asset_type)}
                    </span>
                    <h3 className="font-serif font-bold text-charcoal text-base line-clamp-2 leading-snug">{ma.title}</h3>
                    {ma.credit && (
                      <span className="text-[10px] text-stone-500 mt-auto pt-2 border-t border-stone-beige/50 italic">
                        Crédito: {ma.credit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* F. RED FEDERAL PARTICIPANTE */}
      {activeInstitutions.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-2xl font-serif font-black text-charcoal">
              Red federal participante
            </h2>
            <Link href="/instituciones" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todas &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInstitutions.map((inst) => (
              <div key={inst.slug} className="p-5 bg-[#fcf8f2] border border-stone-beige rounded-lg flex flex-col gap-2.5 hover:border-muted-amber hover:shadow-sm transition-colors duration-200">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-serif font-bold text-charcoal text-base hover:text-earth-red transition-colors">
                    <Link href={`/instituciones/${inst.slug}`}>
                      {inst.name}
                    </Link>
                  </h3>
                  {inst.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Destacada
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 self-start tracking-wider uppercase">
                  {formatInstitutionType(inst.institution_type)}
                </span>
                {inst.description && (
                  <p className="text-xs text-stone-700 leading-relaxed line-clamp-2">{inst.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* G. RECONOCIMIENTOS */}
      {publicRecognitions.length > 0 && (
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-end pb-3 border-b border-stone-beige/85">
            <h2 className="text-lg font-serif font-black text-charcoal">
              Trayectoria y Avales
            </h2>
            <Link href="/reconocimientos" className="text-[10px] font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ver todos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {publicRecognitions.map((r) => (
              <div key={r.slug} className="p-4 bg-[#fcf8f2]/60 border border-stone-beige/80 rounded-lg flex flex-col gap-2 hover:border-muted-amber transition-colors duration-200 justify-between">
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif font-bold text-charcoal text-xs hover:text-earth-red transition-colors line-clamp-2">
                    <Link href={`/reconocimientos/${r.slug}`}>
                      {r.title}
                    </Link>
                  </h3>
                  <span className="text-[8px] font-bold text-earth-red bg-earth-red/5 px-1.5 py-0.5 rounded border border-earth-red/10 self-start tracking-wider uppercase">
                    {r.recognition_type}
                  </span>
                  {r.description && (
                    <p className="text-[11px] text-stone-650 leading-relaxed line-clamp-3">{r.description}</p>
                  )}
                </div>
                {r.recognition_date && (
                  <span className="text-[9px] text-stone-500 font-mono mt-2 pt-1 flex items-center gap-1 border-t border-stone-beige/40">
                    Fecha: {new Date(r.recognition_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cierre Institucional */}
      <section className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 text-center flex flex-col items-center gap-6">
        <div className="flex flex-col gap-2 max-w-xl">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red">
            Conexión Federal
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-charcoal">
            Formar parte de La Gauchita Federal
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed mt-2">
            El portal se proyecta como una red de contenidos, personajes, instituciones y archivos que fortalece la memoria cultural de cada comunidad.
          </p>
        </div>
        <Link
          href="/acerca"
          className="inline-flex items-center justify-center px-6 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 transition-colors duration-200"
        >
          Conocer el proyecto
        </Link>
      </section>
    </PublicPageShell>
  );
}