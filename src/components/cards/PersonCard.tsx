import React from 'react';
import Link from 'next/link';
import { stripHtml, truncateText } from '../../lib/utils/formatters';

export interface PersonCardProps {
  person: {
    id?: string;
    full_name: string;
    slug: string;
    person_type: string;
    short_bio?: string | null;
    birth_date?: string | null;
    death_date?: string | null;
    media_assets?: {
      bucket_name: string;
      storage_path: string;
      alt_text?: string | null;
    } | null;
  };
  imageUrl?: string | null;
  lifeSpan?: string | null;
  territoryLabel?: string | null;
}

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

export default function PersonCard({ person, imageUrl, lifeSpan, territoryLabel }: PersonCardProps) {
  const cleanBio = stripHtml(person.short_bio);
  const truncatedBio = truncateText(cleanBio, 120);
  
  // Life span calculation if not passed
  const resolvedLifeSpan = lifeSpan || (() => {
    if (!person.birth_date && !person.death_date) return null;
    const birthYear = person.birth_date ? person.birth_date.split('-')[0] : '¿?';
    const deathYear = person.death_date ? person.death_date.split('-')[0] : 'Presente';
    return `${birthYear} – ${deathYear}`;
  })();

  const initials = person.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-[#fcf8f2] border border-stone-beige rounded-lg overflow-hidden flex flex-col justify-between hover:border-muted-amber hover:shadow-sm transition-all duration-200">
      <div>
        {/* Portrait / Image Container */}
        {imageUrl ? (
          <div className="relative w-full h-44 bg-stone-100 overflow-hidden border-b border-stone-beige/70">
            <img
              src={imageUrl}
              alt={person.media_assets?.alt_text || person.full_name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-103"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-44 bg-[#f2ede4] flex flex-col items-center justify-center text-stone-500/80 p-4 border-b border-stone-beige/70 relative">
            <div className="w-14 h-14 rounded-full border border-stone-300/80 bg-warm-white/60 flex items-center justify-center font-serif text-sm font-bold text-stone-600 shadow-inner">
              {initials}
            </div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-stone-400 mt-2">Sin retrato</span>
          </div>
        )}

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
              {PERSON_TYPE_LABELS[person.person_type] || person.person_type}
            </span>
            {resolvedLifeSpan && (
              <span className="text-[9px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                {resolvedLifeSpan}
              </span>
            )}
          </div>

          <h4 className="font-serif font-black text-base text-charcoal hover:text-earth-red transition-colors leading-snug line-clamp-2">
            <Link href={`/personajes/${person.slug}`}>
              {person.full_name}
            </Link>
          </h4>

          {truncatedBio && (
            <p className="text-xs text-stone-700 leading-relaxed font-serif line-clamp-3">
              {truncatedBio}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-2 border-t border-stone-beige/50 mt-auto flex justify-between items-center text-[9px] font-mono text-stone-500">
        <span>📍 {territoryLabel || 'Ámbito Nacional'}</span>
        <Link 
          href={`/personajes/${person.slug}`} 
          className="text-earth-red hover:underline font-bold uppercase tracking-wider"
        >
          Perfil &rarr;
        </Link>
      </div>
    </div>
  );
}
