import React from 'react';
import Link from 'next/link';
import { getPublicMediaUrl } from '../../lib/utils/media-url';

export interface MagazineEditionCardProps {
  edition: {
    id?: string;
    title: string;
    slug: string;
    edition_number: number;
    volume?: string | null;
    publication_year: number;
    publication_date?: string | null;
    media_assets?: {
      bucket_name: string;
      storage_path: string;
      alt_text?: string | null;
    } | null;
  };
}

export default function MagazineEditionCard({ edition }: MagazineEditionCardProps) {
  const coverUrl = edition.media_assets
    ? getPublicMediaUrl(edition.media_assets.bucket_name, edition.media_assets.storage_path)
    : null;

  return (
    <div className="bg-[#fcf8f2] border border-stone-beige rounded-lg overflow-hidden flex flex-col justify-between hover:border-muted-amber hover:shadow-sm transition-all duration-200">
      <div>
        {/* Cover Image Container */}
        {coverUrl ? (
          <div className="relative w-full h-72 bg-stone-100 overflow-hidden border-b border-stone-beige/70">
            <img
              src={coverUrl}
              alt={edition.media_assets?.alt_text || edition.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-72 bg-[#f2ede4] flex flex-col items-center justify-center text-stone-500/80 p-4 border-b border-stone-beige/70">
            <svg className="w-12 h-12 text-stone-400/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs font-mono text-stone-400">Sin tapa</span>
          </div>
        )}

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
              Edición Nº {edition.edition_number}
            </span>
            {edition.volume && (
              <span className="text-[9px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                Tomo {edition.volume}
              </span>
            )}
          </div>

          <h4 className="font-serif font-black text-base text-charcoal hover:text-earth-red transition-colors leading-snug line-clamp-2">
            <Link href={`/revista/${edition.slug}`}>
              {edition.title}
            </Link>
          </h4>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-2 border-t border-stone-beige/50 mt-auto flex justify-between items-center text-[9px] font-mono text-stone-500">
        <span>
          {edition.publication_date
            ? new Date(edition.publication_date + 'T00:00:00').toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
              })
            : `Año ${edition.publication_year}`}
        </span>
        <Link
          href={`/revista/${edition.slug}`}
          className="text-earth-red hover:underline font-bold uppercase tracking-wider font-mono"
        >
          Ver edición &rarr;
        </Link>
      </div>
    </div>
  );
}
