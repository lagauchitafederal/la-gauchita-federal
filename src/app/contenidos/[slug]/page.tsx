import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedContentBySlug } from '../../../lib/public-content/public-content';
import PublicPageShell from '../../../components/public/PublicPageShell';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { getPublicMediaUrl } from '../../../lib/utils/media-url';
import { formatHistoricalDate, parseEventDate, getCurrentArgentinaDate } from '../../../lib/utils/date';
import { getPublicEditorialRelations } from '../../../lib/public-content/public-editorial-relations';
import PublicEditorialRelations from '../../../components/public/PublicEditorialRelations';
import { getArticleJsonLd } from '../../../lib/seo/json-ld';
import { getPublicContentMedia } from '../../../lib/public-content/public-content-media';
import ContentMediaGallery from '../../../components/public/ContentMediaGallery';
import ArchiveAssetCard from '../../../components/cards/ArchiveAssetCard';
import MagazineEditionCard from '../../../components/cards/MagazineEditionCard';
import { formatAssetType } from '../../../lib/utils/formatters';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getPublishedContentBySlug(slug);

  if (!content) {
    return {
      title: "Contenido no encontrado",
    };
  }

  // Resolve cover image from editorial relations
  let imageUrl: string | undefined = undefined;
  try {
    const supabase = createServerSupabaseClient();
    const { data: rels } = await supabase
      .from('editorial_relations')
      .select('target_entity_id')
      .eq('source_entity_type', 'content')
      .eq('source_entity_id', content.id)
      .eq('target_entity_type', 'media_asset');

    if (rels && rels.length > 0) {
      const assetIds = rels.map((r: any) => r.target_entity_id);
      const { data: assets } = await supabase
        .from('media_assets')
        .select('bucket_name, storage_path, asset_type')
        .in('id', assetIds)
        .eq('status', 'active')
        .eq('visibility', 'public');

      if (assets && assets.length > 0) {
        const imageAsset = assets.find((a: any) =>
          ['cover_image', 'content_image', 'gallery_image', 'historical_photo'].includes(a.asset_type)
        ) || assets[0];
        imageUrl = getPublicMediaUrl(imageAsset.bucket_name, imageAsset.storage_path);
      }
    }
  } catch (e) {
    console.error('Error resolving metadata image:', e);
  }

  const cleanDescription = content.summary ? content.summary.replace(/<[^>]*>/g, '') : (content.subtitle || undefined);

  return {
    title: content.title,
    description: cleanDescription,
    alternates: {
      canonical: `/contenidos/${slug}`,
    },
    openGraph: {
      title: content.title,
      description: cleanDescription,
      type: 'article',
      url: `/contenidos/${slug}`,
      publishedTime: content.publish_date || undefined,
      modifiedTime: content.created_at || undefined,
      section: content.categories?.name || undefined,
      authors: content.institutions?.name ? [content.institutions.name] : undefined,
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: cleanDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const content = await getPublishedContentBySlug(slug);

  if (!content) {
    notFound();
  }

  const media = await getPublicContentMedia(content.id);
  const relations = await getPublicEditorialRelations('content', content.id);

  // Fetch full magazine details for related magazines to pass to cards
  const magazineRelations = relations.filter(r => r.relatedType === 'magazine_edition');
  const nonMediaNonMagazineRelations = relations.filter(
    r => r.relatedType !== 'media_asset' && r.relatedType !== 'magazine_edition'
  );

  const supabase = createServerSupabaseClient();
  let relatedMagazines: any[] = [];
  if (magazineRelations.length > 0) {
    try {
      const magIds = magazineRelations.map(r => r.relatedId);
      const { data } = await supabase
        .from('magazine_editions')
        .select('id, title, slug, edition_number, volume, publication_year, publication_date, media_assets:cover_image_asset_id(bucket_name, storage_path, alt_text)')
        .in('id', magIds)
        .eq('status', 'published')
        .eq('visibility', 'public');
      if (data) {
        relatedMagazines = data.map((item: any) => ({
          ...item,
          media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null
        }));
      }
    } catch (e) {
      console.error('Error fetching related magazine editions:', e);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const articleJsonLds = getArticleJsonLd(siteUrl, content, media.mainImage?.url || null);

  return (
    <PublicPageShell>
      {articleJsonLds.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <article className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 md:p-12 flex flex-col gap-6 w-full">
            
            {/* Navigation / Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60">
              <Link href="/contenidos" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
                &larr; Volver a contenidos
              </Link>
              <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Detalle de Contenido</span>
            </div>

            {/* Title and Metadata */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {content.is_featured && (
                  <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Destacado
                  </span>
                )}
                {content.categories?.name && (
                  <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase">
                    {content.categories.name}
                  </span>
                )}
                {content.institutions?.name && (
                  <span className="text-[10px] font-bold text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/60 tracking-wider uppercase">
                    {content.institutions.name}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
                {content.title}
              </h1>
              {content.subtitle && (
                <p className="text-lg text-stone-700 font-medium italic leading-relaxed">
                  {content.subtitle}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-6 text-[11px] text-stone-500 font-mono py-2 border-y border-stone-beige/50">
              {content.publish_date && (
                <span>Publicado: {new Date(content.publish_date).toLocaleDateString()}</span>
              )}
              {content.event_date && (
                <span>
                  {"Hito Hist\u00f3rico"}: {formatHistoricalDate(content.event_date)}
                  {(() => {
                    const { year } = parseEventDate(content.event_date);
                    if (year && !isNaN(year)) {
                      const currentYear = getCurrentArgentinaDate().getFullYear();
                      const yearsElapsed = currentYear - year;
                      if (yearsElapsed > 0) {
                        return ` (Hace ${yearsElapsed} a\u00f1os)`;
                      }
                    }
                    return '';
                  })()}
                </span>
              )}
            </div>

            {/* Imagen Principal */}
            {media.mainImage && (
              <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] bg-stone-100 rounded-lg overflow-hidden border border-stone-beige/60">
                <img
                  src={media.mainImage.url}
                  alt={media.mainImage.alt_text || media.mainImage.title || content.title}
                  className="w-full h-full object-cover"
                />
                {(media.mainImage.title || media.mainImage.credit) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-xs text-white/90 font-mono flex flex-wrap justify-between gap-2">
                    {media.mainImage.title && <span>{media.mainImage.title}</span>}
                    {media.mainImage.credit && <span>Crédito: {media.mainImage.credit}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Summary (if exists, styled as callout/lead paragraph) */}
            {content.summary && (
              <div className="bg-[#fcf8f2] border-l-4 border-earth-red p-5 rounded-r-md">
                <p className="text-stone-850 text-base leading-relaxed font-semibold">
                  {content.summary}
                </p>
              </div>
            )}

            {/* Body Content */}
            {content.body ? (
              <div className="text-stone-850 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-serif flex flex-col gap-6 pt-2">
                {content.body}
              </div>
            ) : (
              <p className="text-stone-400 italic text-sm">
                No hay cuerpo de texto disponible para este contenido.
              </p>
            )}

            {/* Source Reference */}
            {content.source_reference && (
              <div className="mt-8 pt-4 border-t border-stone-beige/50 text-[11px] text-stone-500 font-mono">
                <span className="font-bold">Referencia / Fuente:</span> {content.source_reference}
              </div>
            )}

            {/* Audio Block */}
            {media.audio.length > 0 && (
              <section className="bg-[#fcfbf9] border border-stone-beige/80 rounded-lg p-6 flex flex-col gap-4 mt-6">
                <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige/40 pb-2">
                  Registro sonoro
                </h3>
                <div className="flex flex-col gap-4">
                  {media.audio.map((aud) => (
                    <div key={aud.key} className="flex flex-col gap-2 p-4 bg-[#fcf8f2] border border-stone-beige/60 rounded-md">
                      {aud.title && (
                        <h4 className="text-sm font-serif font-bold text-charcoal">
                          {aud.title}
                        </h4>
                      )}
                      {aud.description && (
                        <p className="text-xs text-stone-600 leading-relaxed font-serif">
                          {aud.description}
                        </p>
                      )}
                      <audio controls preload="none" className="w-full mt-1">
                        <source src={aud.url} type={aud.mime_type || 'audio/mpeg'} />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                      {aud.credit && (
                        <span className="text-[10px] font-mono text-stone-500 italic mt-1 block">
                          Crédito: {aud.credit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery Block */}
            {media.gallery.length > 0 && (
              <div className="mt-6">
                <ContentMediaGallery images={media.gallery} />
              </div>
            )}

            {/* Documents and resources Block */}
            {media.documents.length > 0 && (
              <section className="bg-[#fcfbf9] border border-stone-beige/80 rounded-lg p-6 flex flex-col gap-4 mt-6">
                <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige/40 pb-2">
                  Documentos y recursos vinculados
                </h3>
                <ul className="flex flex-col gap-4">
                  {media.documents.map((doc) => (
                    <li key={doc.key} className="flex flex-col gap-2 p-4 bg-[#fcf8f2] border border-stone-beige/60 rounded-md hover:border-muted-amber transition-colors duration-150">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
                          {formatAssetType(doc.asset_type)}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-serif font-bold text-charcoal">
                        {doc.title}
                      </h4>
                      {doc.description && (
                        <p className="text-xs text-stone-600 leading-relaxed font-serif">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex flex-wrap justify-between items-center gap-4 mt-2">
                        {doc.credit && (
                          <span className="text-[10px] font-mono text-stone-500 italic">
                            Crédito: {doc.credit}
                          </span>
                        )}
                        <a 
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-mono font-bold text-earth-red hover:underline uppercase tracking-wider gap-1"
                        >
                          Ver documento &rarr;
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

        </article>

        {/* Revista relacionada */}
        {relatedMagazines.length > 0 && (
          <section className="flex flex-col gap-4 mt-4">
            <div className="border-b border-stone-beige pb-3">
              <h3 className="text-xl sm:text-2xl font-serif font-black text-charcoal">
                Revistas vinculadas
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedMagazines.map((mag) => (
                <MagazineEditionCard key={mag.id} edition={mag} />
              ))}
            </div>
          </section>
        )}

        {/* Recursos de archivo relacionados */}
        {media.archive.length > 0 && (
          <section className="flex flex-col gap-4 mt-4">
            <div className="border-b border-stone-beige pb-3">
              <h3 className="text-xl sm:text-2xl font-serif font-black text-charcoal">
                Materiales de archivo vinculados
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.archive.map((asset) => (
                <ArchiveAssetCard key={asset.key} asset={asset} />
              ))}
            </div>
          </section>
        )}

        {/* Public Editorial Relations */}
        <PublicEditorialRelations relations={nonMediaNonMagazineRelations} />
      </div>
    </PublicPageShell>
  );
}
