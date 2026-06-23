import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedPersonBySlug, PublicPerson } from '../../../lib/public-content/public-people';
import { getArgentinaDateParts, formatHistoricalDate } from '../../../lib/utils/date';
import { getPublicMediaUrl } from '../../../lib/utils/media-url';
import PublicPageShell from '../../../components/public/PublicPageShell';

export const dynamic = 'force-dynamic';

interface PersonajeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PersonajeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPublishedPersonBySlug(slug);

  if (!person) {
    return {
      title: 'Personaje no encontrado',
      description: 'El perfil solicitado no existe o no se encuentra publicado.',
    };
  }

  return {
    title: `${person.full_name} | La Gauchita Federal`,
    description: person.short_bio || `Perfil y biografía de ${person.full_name}.`,
  };
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

// Robust age calculations
function calculateAges(birthDateStr: string | null, deathDateStr: string | null) {
  if (!birthDateStr) return null;

  const parseDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length >= 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
        day: parseInt(parts[2], 10)
      };
    }
    const d = new Date(dStr);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate()
    };
  };

  try {
    const birth = parseDate(birthDateStr);
    const death = deathDateStr ? parseDate(deathDateStr) : null;
    const today = getArgentinaDateParts();

    const calculateDiff = (
      from: { year: number; month: number; day: number },
      to: { year: number; month: number; day: number }
    ) => {
      let diff = to.year - from.year;
      const monthDiff = to.month - from.month;
      const dayDiff = to.day - from.day;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        diff--;
      }
      return diff;
    };

    const yearsSinceBirth = calculateDiff(birth, today);

    if (death) {
      const ageAtDeath = calculateDiff(birth, death);
      const yearsSinceDeath = calculateDiff(death, today);
      return {
        isDeceased: true,
        ageAtDeath,
        yearsSinceBirth,
        yearsSinceDeath
      };
    } else {
      const currentAge = calculateDiff(birth, today);
      return {
        isDeceased: false,
        currentAge,
        yearsSinceBirth
      };
    }
  } catch (err) {
    console.error('Error calculating age:', err);
    return null;
  }
}

export default async function PersonajeDetailPage({ params }: PersonajeDetailPageProps) {
  const { slug } = await params;
  const person = await getPublishedPersonBySlug(slug);

  if (!person) {
    notFound();
  }

  const imageUrl = person.media_assets ? getPublicMediaUrl(person.media_assets.bucket_name, person.media_assets.storage_path) : null;
  const ageStats = calculateAges(person.birth_date, person.death_date);

  const getTerritoryLabel = (p: PublicPerson) => {
    if (p.municipalities?.name) return `${p.municipalities.name}, ${p.provinces?.name || ''}`;
    if (p.provinces?.name) return p.provinces.name;
    if (p.regions?.name) return p.regions.name;
    return 'Ámbito Nacional';
  };

  return (
    <PublicPageShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        
        {/* Back Link */}
        <div>
          <Link
            href="/personajes"
            className="inline-flex items-center text-xs font-mono font-bold text-stone-500 hover:text-earth-red transition-colors duration-150 uppercase tracking-wider"
          >
            &larr; Volver al catálogo
          </Link>
        </div>

        {/* Hero Card */}
        <div className="bg-[#fcf8f2] border border-stone-beige rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Image */}
          {imageUrl ? (
            <div className="w-full md:w-80 h-96 md:h-auto bg-stone-100 flex-shrink-0 relative">
              <img
                src={imageUrl}
                alt={person.media_assets?.alt_text || person.full_name}
                className="w-full h-full object-cover"
              />
              {person.media_assets?.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 text-[10px] text-white/90 font-mono truncate">
                  Retrato: {person.media_assets.title}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full md:w-80 h-64 md:h-auto bg-[#f2ede4] flex flex-col items-center justify-center text-stone-400 p-8 flex-shrink-0 border-b md:border-b-0 md:border-r border-stone-beige/70">
              <svg className="w-20 h-20 text-stone-400/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs uppercase tracking-wider font-mono text-stone-550 font-bold">Sin retrato oficial</span>
            </div>
          )}

          {/* Details & Biography Summary */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              
              <div className="flex flex-wrap items-center gap-2">
                {person.is_featured && (
                  <span className="text-[10px] bg-muted-amber/15 text-amber-900 border border-muted-amber/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Destacado
                  </span>
                )}
                <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase">
                  {PERSON_TYPE_LABELS[person.person_type] || person.person_type}
                </span>
                <span className="text-[10px] font-mono text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/60">
                  📍 {getTerritoryLabel(person)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-black text-charcoal leading-tight">
                {person.full_name}
              </h1>

              {/* Lifespan & Age statistics box */}
              {person.birth_date && (
                <div className="bg-[#f5efe4] border border-stone-beige/70 rounded-md p-4 flex flex-col gap-2 text-xs font-mono text-stone-750">
                  <div>
                    📅 <strong>Nacimiento:</strong> {formatHistoricalDate(person.birth_date)}
                  </div>
                  {person.death_date && (
                    <div>
                      🕯️ <strong>Fallecimiento:</strong> {formatHistoricalDate(person.death_date)}
                    </div>
                  )}
                  {ageStats && (
                    <div className="border-t border-stone-beige/60 pt-2 mt-1 flex flex-col gap-1 text-[11px] text-stone-600">
                      {ageStats.isDeceased ? (
                        <>
                          <div>• Edad al fallecer: <strong>{ageStats.ageAtDeath} años</strong></div>
                          <div>• Años transcurridos desde su nacimiento: <strong>{ageStats.yearsSinceBirth} años</strong></div>
                          <div>• Años transcurridos desde su fallecimiento: <strong>{ageStats.yearsSinceDeath} años</strong></div>
                        </>
                      ) : (
                        <>
                          <div>• Edad actual: <strong>{ageStats.currentAge} años</strong></div>
                          <div>• Años transcurridos desde su nacimiento: <strong>{ageStats.yearsSinceBirth} años</strong></div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {person.short_bio && (
                <p className="text-base text-stone-850 font-serif italic leading-relaxed border-l-2 border-earth-red/35 pl-4">
                  {person.short_bio}
                </p>
              )}

            </div>

            {person.source_reference && (
              <div className="text-[10px] font-mono text-stone-500 pt-3 border-t border-stone-beige/50">
                📚 <strong>Fuente documental:</strong> {person.source_reference}
              </div>
            )}

          </div>

        </div>

        {/* Biography Detail */}
        {person.biography && (
          <section className="bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-serif font-black text-charcoal mb-4 pb-2 border-b border-stone-beige/70">
              Biografía y Legado
            </h2>
            <div className="text-sm text-stone-800 leading-relaxed space-y-4 whitespace-pre-line font-serif">
              {person.biography}
            </div>
          </section>
        )}

        {/* Prepared section for future relations */}
        <section className="bg-[#fcf8f2] border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 mt-2">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-charcoal mb-3">
            Efemérides, contenidos y publicaciones vinculadas
          </h3>
          <div className="bg-white/80 border border-stone-beige/80 p-4 rounded-md text-xs text-stone-500 font-mono italic">
            Próximamente se listarán las efemérides históricas, publicaciones editoriales y otros contenidos relacionados con esta personalidad.
          </div>
        </section>

      </div>
    </PublicPageShell>
  );
}
