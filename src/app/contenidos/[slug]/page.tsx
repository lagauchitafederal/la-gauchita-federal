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

  const relations = await getPublicEditorialRelations('content', content.id);

  return (
    <PublicPageShell>
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

        </article>

        {/* Public Editorial Relations */}
        <PublicEditorialRelations relations={relations} />
      </div>
    </PublicPageShell>
  );
}
