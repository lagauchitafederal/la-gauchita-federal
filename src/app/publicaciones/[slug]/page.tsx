import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicPublicationBySlug } from '../../../lib/public-content/public-publications';
import { getPublicMediaUrl } from '../../../lib/utils/media-url';
import PublicPageShell from '../../../components/public/PublicPageShell';
import { getPublicEditorialRelations } from '../../../lib/public-content/public-editorial-relations';
import PublicEditorialRelations from '../../../components/public/PublicEditorialRelations';

export const dynamic = 'force-dynamic';

interface PublicationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pub = await getPublicPublicationBySlug(slug);

  if (!pub) {
    return {
      title: 'Publicación no encontrada | La Gauchita Federal',
      description: 'La publicación solicitada no existe o no se encuentra pública.',
    };
  }

  const typeLabel = pub.publication_type === 'book' ? 'Libro' : pub.publication_type === 'album' ? 'Disco/Álbum' : 'Obra Especial';
  let seoDesc = `${typeLabel} del Instituto Cultural Andino.`;
  if (pub.author_text) {
    seoDesc += ` Creado por ${pub.author_text}.`;
  }
  if (pub.publication_year) {
    seoDesc += ` Publicado en ${pub.publication_year}.`;
  }
  if (pub.short_description) {
    seoDesc += ` ${pub.short_description}`;
  }

  if (seoDesc.length > 160) {
    seoDesc = seoDesc.substring(0, 157) + '...';
  }

  const imageUrl = pub.media_assets
    ? getPublicMediaUrl(pub.media_assets.bucket_name, pub.media_assets.storage_path)
    : undefined;

  return {
    title: `${pub.title} | Publicaciones Culturales`,
    description: seoDesc,
    alternates: {
      canonical: `/publicaciones/${slug}`,
    },
    openGraph: {
      title: `${pub.title} | Publicaciones`,
      description: seoDesc,
      type: 'website',
      url: `/publicaciones/${slug}`,
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pub.title} | Publicaciones`,
      description: seoDesc,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PublicationDetailPage({ params }: PublicationDetailPageProps) {
  const { slug } = await params;
  const pub = await getPublicPublicationBySlug(slug);

  if (!pub) {
    notFound();
  }

  // Fetch relations for this publication
  const relations = await getPublicEditorialRelations('cultural_publication', pub.id);

  const coverUrl = pub.media_assets
    ? getPublicMediaUrl(pub.media_assets.bucket_name, pub.media_assets.storage_path)
    : null;

  const typeLabel = pub.publication_type === 'book' ? 'Libro' : pub.publication_type === 'album' ? 'Disco / Álbum' : 'Obra Especial';

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* Back navigation */}
        <div>
          <Link
            href="/publicaciones"
            className="inline-flex items-center text-xs font-mono font-bold text-stone-500 hover:text-earth-red transition-colors duration-150 uppercase tracking-wider"
          >
            &larr; Volver a Publicaciones
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
                  alt={pub.media_assets?.alt_text || pub.title}
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
                {typeLabel}
              </span>
              
              <h1 className="text-3xl font-serif font-black text-charcoal leading-tight">
                {pub.title}
              </h1>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono font-semibold text-stone-500 uppercase tracking-wide">
                {pub.author_text && (
                  <>
                    <span>Por {pub.author_text}</span>
                    <span>•</span>
                  </>
                )}
                {pub.publication_year && (
                  <>
                    <span>Año {pub.publication_year}</span>
                    <span>•</span>
                  </>
                )}
                <span>{pub.institutions ? pub.institutions.name : 'Edición Independiente'}</span>
              </div>
            </div>

            {/* Institution linked */}
            {pub.institutions && (
              <div className="text-xs text-stone-600 font-mono">
                Institución editora:{' '}
                <Link
                  href={`/instituciones/${pub.institutions.slug}`}
                  className="text-earth-red hover:underline font-bold uppercase tracking-wider"
                >
                  {pub.institutions.name}
                </Link>
              </div>
            )}

            {pub.short_description && (
              <div className="text-sm font-serif italic text-stone-550 border-l-2 border-stone-beige pl-3 py-1">
                {pub.short_description}
              </div>
            )}

            {pub.description && (
              <div className="text-sm sm:text-base text-stone-700 leading-relaxed font-serif whitespace-pre-wrap pt-2 border-t border-stone-beige/40">
                {pub.description}
              </div>
            )}

            {/* External Reference Button */}
            {pub.source_reference && (
              <div className="pt-4 border-t border-stone-beige/40 mt-2">
                <a
                  href={pub.source_reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded transition-colors shadow-sm"
                >
                  Ver Ficha / Adquirir Obra Externa
                </a>
              </div>
            )}
          </div>
        </section>

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
