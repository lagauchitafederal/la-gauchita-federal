import React from 'react';
import Link from 'next/link';
import { formatInstitutionType, stripHtml, truncateText } from '../../lib/utils/formatters';

export interface InstitutionCardProps {
  institution: {
    id?: string;
    name: string;
    slug: string;
    institution_type: string;
    description?: string | null;
    is_featured?: boolean;
    address?: string | null;
  };
}

export default function InstitutionCard({ institution }: InstitutionCardProps) {
  const cleanDescription = stripHtml(institution.description);
  const truncatedDescription = truncateText(cleanDescription, 150);

  return (
    <div className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 flex flex-col gap-3.5 hover:border-muted-amber hover:shadow-sm transition-all duration-200 justify-between">
      <div className="flex flex-col gap-3">
        
        {/* Title and Featured Badge */}
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-lg font-serif font-bold text-charcoal hover:text-earth-red transition-colors duration-200 leading-snug">
            <Link href={`/instituciones/${institution.slug}`}>
              {institution.name}
            </Link>
          </h4>
          {institution.is_featured && (
            <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 font-mono">
              Destacada
            </span>
          )}
        </div>

        {/* Badges/Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
            {formatInstitutionType(institution.institution_type)}
          </span>
          {institution.address && (
            <span className="text-[10px] text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/60 tracking-wider font-medium font-mono">
              📍 {institution.address}
            </span>
          )}
        </div>

        {/* Description */}
        {truncatedDescription && (
          <p className="text-sm text-stone-700 leading-relaxed font-serif line-clamp-3">
            {truncatedDescription}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-stone-beige/50 mt-1 flex justify-end">
        <Link 
          href={`/instituciones/${institution.slug}`} 
          className="text-[10px] text-earth-red hover:underline font-bold font-mono uppercase tracking-wider"
        >
          Ver más detalles &rarr;
        </Link>
      </div>
    </div>
  );
}
