import React from 'react';
import Link from 'next/link';
import { stripHtml, truncateText } from '../../lib/utils/formatters';

export interface ContentCardProps {
  content: {
    id?: string;
    title: string;
    slug: string;
    subtitle?: string | null;
    summary?: string | null;
    publish_date?: string | null;
    is_featured?: boolean;
    region_id?: string | null;
    province_id?: string | null;
    municipality_id?: string | null;
    content_types?: { code: string; name: string } | null;
    categories?: { name: string } | null;
    institutions?: { name: string } | null;
  };
  territoryLabel?: string | null;
}

export default function ContentCard({ content, territoryLabel }: ContentCardProps) {
  const cleanSummary = stripHtml(content.summary);
  const cleanSubtitle = stripHtml(content.subtitle);
  const truncatedSummary = truncateText(cleanSummary, 160);
  const typeName = content.content_types?.name || 'Contenido';
  const categoryName = content.categories?.name;
  
  return (
    <div className={`p-6 bg-[#fcf8f2] border border-stone-beige rounded-lg flex flex-col justify-between hover:border-muted-amber hover:shadow-sm transition-all duration-200 gap-4`}>
      <div className="flex flex-col gap-2.5">
        
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
            {typeName}
          </span>
          {categoryName && (
            <span className="text-[9px] font-bold text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/65 uppercase font-mono">
              {categoryName}
            </span>
          )}
          {territoryLabel && (
            <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/65 uppercase">
              📍 {territoryLabel}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-serif font-black text-base text-charcoal hover:text-earth-red transition-colors leading-snug line-clamp-2">
          <Link href={`/contenidos/${content.slug}`}>
            {content.title}
          </Link>
        </h4>

        {/* Subtitle / Preview text */}
        {cleanSubtitle && (
          <p className="text-[11px] font-semibold text-stone-600 italic line-clamp-1">
            {cleanSubtitle}
          </p>
        )}

        {/* Summary */}
        {truncatedSummary && (
          <p className="text-xs text-stone-700 leading-relaxed font-serif line-clamp-3">
            {truncatedSummary}
          </p>
        )}
      </div>

      {/* Footer metadata */}
      <div className="pt-3 border-t border-stone-beige/50 mt-1 flex justify-between items-center text-[9px] font-mono text-stone-500">
        {content.publish_date ? (
          <span>
            {new Date(content.publish_date).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        ) : (
          <span className="invisible">Sin fecha</span>
        )}
        
        <Link 
          href={`/contenidos/${content.slug}`} 
          className="text-earth-red hover:underline font-bold uppercase tracking-wider"
        >
          Leer historia &rarr;
        </Link>
      </div>
    </div>
  );
}
