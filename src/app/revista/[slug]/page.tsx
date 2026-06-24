import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedMagazineBySlug } from '../../../lib/public-content/public-magazines';
import { getPublicMediaUrl } from '../../../lib/utils/media-url';
import PublicPageShell from '../../../components/public/PublicPageShell';
import { getPublicEditorialRelations } from '../../../lib/public-content/public-editorial-relations';
import PublicEditorialRelations from '../../../components/public/PublicEditorialRelations';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { getMagazineJsonLd } from '../../../lib/seo/json-ld';

export const dynamic = 'force-dynamic';

interface MagazineDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MagazineDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getPublishedMagazineBySlug(slug);

  if (!edition) {
    return {
      title: 'Edición no encontrada | Revista La Gauchita',
      description: 'La edición de revista solicitada no existe o no se encuentra publicada.',
    };
  }

  // SEO Description based on description, number, and year without inventing information
  let seoDesc = `Revista La Gauchita. Edición Nº ${edition.edition_number}`;
  if (edition.volume) {
    seoDesc += `, Tomo ${edition.volume}`;
  }
  seoDesc += `, año ${edition.publication_year}.`;
  if (edition.description) {
    seoDesc += ` ${edition.description}`;
  }

  if (seoDesc.length > 160) {
    seoDesc = seoDesc.substring(0, 157) + '...';
  }

  const imageUrl = edition.media_assets
    ? getPublicMediaUrl(edition.media_assets.bucket_name, edition.media_assets.storage_path)
    : undefined;

  return {
    title: `${edition.title} | Revista La Gauchita`,
    description: seoDesc,
    alternates: {
      canonical: `/revista/${slug}`,
    },
    openGraph: {
      title: `${edition.title} | Revista La Gauchita`,
      description: seoDesc,
      type: 'website',
      url: `/revista/${slug}`,
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${edition.title} | Revista La Gauchita`,
      description: seoDesc,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function MagazineDetailPage({ params }: MagazineDetailPageProps) {
  const { slug } = await params;
  const edition = await getPublishedMagazineBySlug(slug);

  if (!edition) {
    notFound();
  }

  // Fetch relations for this magazine edition
  const relations = await getPublicEditorialRelations('magazine_edition', edition.id);

  // Check table of contents related_slug values to link only to published and public contents
  const tableOfContents = edition.table_of_contents || [];
  const relatedSlugs = tableOfContents
    .map((item) => item.related_slug)
    .filter((s): s is string => !!s);

  let publicSlugs = new Set<string>();
  if (relatedSlugs.length > 0) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('contents')
      .select('slug')
      .in('slug', relatedSlugs)
      .eq('status', 'published')
      .eq('visibility', 'public');
    if (data) {
      publicSlugs = new Set(data.map((c) => c.slug));
    }
  }

  const coverUrl = edition.media_assets
    ? getPublicMediaUrl(edition.media_assets.bucket_name, edition.media_assets.storage_path)
    : null;

  const pdfUrl = edition.pdf_media_assets
    ? getPublicMediaUrl(edition.pdf_media_assets.bucket_name, edition.pdf_media_assets.storage_path)
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const magazineJsonLds = getMagazineJsonLd(siteUrl, edition, coverUrl);

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      {magazineJsonLds.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      <div className="flex flex-col gap-8">
        
        {/* Back navigation */}
        <div>
          <Link
            href="/revista"
            className="inline-flex items-center text-xs font-mono font-bold text-stone-500 hover:text-earth-red transition-colors duration-150 uppercase tracking-wider"
          >
            &larr; Volver a Revista
          </Link>
        </div>

        {/* Main detail card layout */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          {/* Cover image column */}
          <div className="w-full md:w-2/5 flex justify-center">
            {coverUrl ? (
              <div className="border border-stone-beige rounded-lg overflow-hidden shadow-md bg-stone-100 w-full flex items-center justify-center">
                <img
                  src={coverUrl}
                  alt={edition.media_assets?.alt_text || edition.title}
                  className="w-full h-auto object-contain max-h-[500px]"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-[#f2ede4] border border-stone-beige rounded-lg flex flex-col items-center justify-center text-stone-400 p-8 w-full">
                <svg className="w-16 h-16 text-stone-400/80 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-mono">Sin tapa disponible</span>
              </div>
            )}
          </div>

          {/* Details column */}
          <div className="w-full md:w-3/5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
                Revista La Gauchita
              </span>
              
              <h1 className="text-3xl font-serif font-black text-charcoal leading-tight">
                {edition.title}
              </h1>

              <div className="flex flex-wrap gap-2 text-xs font-mono font-semibold text-stone-500 uppercase tracking-wide">
                <span>Edición Nº {edition.edition_number}</span>
                {edition.volume && (
                  <>
                    <span>•</span>
                    <span>Tomo {edition.volume}</span>
                  </>
                )}
                <span>•</span>
                <span>Año {edition.publication_year}</span>
                {edition.publication_date && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(edition.publication_date + 'T00:00:00').toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Institution linked */}
            {edition.institutions && (
              <div className="text-xs text-stone-600 font-mono">
                Institución editora:{' '}
                <Link
                  href={`/instituciones/${edition.institutions.slug}`}
                  className="text-earth-red hover:underline font-bold uppercase tracking-wider"
                >
                  {edition.institutions.name}
                </Link>
              </div>
            )}

            {edition.description && (
              <div className="text-sm sm:text-base text-stone-700 leading-relaxed font-serif whitespace-pre-wrap pt-2">
                {edition.description}
              </div>
            )}

            {/* PDF Button */}
            {pdfUrl && (
              <div className="pt-4">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-earth-red hover:bg-earth-red/90 text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors"
                >
                  Abrir edición digital
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Index section */}
        {tableOfContents.length > 0 && (
          <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-5 mt-4">
            <h3 className="text-xl font-serif font-black text-charcoal border-b border-stone-beige pb-3">
              Índice de la edición
            </h3>
            <div className="flex flex-col gap-4 font-serif text-sm sm:text-base">
              {tableOfContents.map((entry, index) => {
                const hasLink = entry.related_slug && publicSlugs.has(entry.related_slug);
                const titleText = entry.title;

                return (
                  <div key={index} className="flex items-baseline justify-between gap-4 group">
                    <div className="flex items-baseline gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs text-stone-500 font-bold w-6 flex-shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {hasLink ? (
                        <Link
                          href={`/contenidos/${entry.related_slug}`}
                          className="text-earth-red hover:underline font-bold truncate group-hover:text-earth-red"
                        >
                          {titleText}
                        </Link>
                      ) : (
                        <span className="text-charcoal truncate">{titleText}</span>
                      )}
                    </div>
                    {entry.page && (
                      <span className="font-mono text-xs font-bold text-stone-500 flex-shrink-0">
                        Pág. {entry.page}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Related relations section */}
        {relations.length > 0 && (
          <div className="mt-4">
            <PublicEditorialRelations relations={relations} />
          </div>
        )}

      </div>
    </PublicPageShell>
  );
}
