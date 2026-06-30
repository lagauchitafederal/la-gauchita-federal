import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '../../components/public/PublicPageShell';
import { getPublishedPersonBySlug } from '../../lib/public-content/public-people';
import { getPublicEditorialRelations } from '../../lib/public-content/public-editorial-relations';
import PublicEditorialRelations from '../../components/public/PublicEditorialRelations';

export const metadata: Metadata = {
  title: 'Eduardo Ceballos - Fundador y Legado',
  description: 'Conozca la trayectoria de Eduardo Ceballos, escritor, periodista, promotor cultural del norte argentino y fundador de Revista La Gauchita.',
  alternates: {
    canonical: '/eduardo-ceballos',
  },
};

export default async function EduardoCeballosPage() {
  // Attempt to load the active published character from the database
  const person = await getPublishedPersonBySlug('eduardo-ceballos');
  
  // Resolve relations if the person exists in the database
  const relations = person?.id ? await getPublicEditorialRelations('person', person.id) : [];

  // Static fallback editorial content if database record does not exist
  const defaultShortBio = 'Escritor, periodista, poeta y incansable promotor cultural salteño. Fundador de la Revista La Gauchita y del Instituto Cultural Andino, Eduardo Ceballos ha consagrado su vida a recorrer la Argentina para rescatar el folklore, las tradiciones y la memoria histórica de cada provincia.';
  
  const defaultBiography = `Eduardo Ceballos nació en la provincia de Salta, Argentina. Con una profunda sensibilidad por las raíces folklóricas y las expresiones culturales andinas y gauchas, emprendió desde muy joven la labor de recopilación, registro periodístico y difusión literaria. 

A lo largo de su carrera, ha publicado decenas de libros de poemas, ensayos históricos y crónicas regionales. A través de la Revista La Gauchita, fundada a fines del siglo XX, construyó un canal de expresión clave para creadores y comunidades que no contaban con espacios en la prensa tradicional. 

Como director del Instituto Cultural Andino, Eduardo promovió intensamente eventos folklóricos, encuentros de escritores y la edición discográfica y literaria independiente. Su labor constituye uno de los aportes más significativos al patrimonio cultural vivo del norte de nuestro país, cuya continuidad se proyecta hoy digitalmente en La Gauchita Federal.`;

  return (
    <PublicPageShell>
      <div className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 md:p-12 flex flex-col gap-8 font-serif">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60 font-sans">
          <Link href="/acerca" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
            &larr; Volver a Institucional
          </Link>
          <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Legado de Fundadores</span>
        </div>

        {/* Header Block: Title & Picture */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {person?.media_assets?.storage_path ? (
            <div className="w-full md:w-1/3 max-w-[280px] shrink-0 border border-stone-beige p-2 bg-white shadow-xs rounded">
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${person.media_assets.bucket_name}/${person.media_assets.storage_path}`}
                alt={person.media_assets.alt_text || person.full_name}
                className="w-full h-auto object-cover rounded-sm grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ) : (
            <div className="w-full md:w-1/3 max-w-[280px] shrink-0 border border-stone-beige p-6 bg-[#faf8f4] flex flex-col items-center justify-center text-center gap-2 rounded">
              <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">Eduardo Ceballos</span>
              <span className="text-[10px] text-stone-400 italic">Archivo La Gauchita</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 font-sans">
              <span className="self-start text-[10px] bg-earth-red/5 text-earth-red border border-earth-red/10 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Fundador y Director
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
                {person?.full_name || 'Eduardo Ceballos'}
              </h1>
              <p className="text-xs text-stone-500 font-mono">
                {person?.birth_date ? `Nacido en ${new Date(person.birth_date).getFullYear()}` : 'Salta, Argentina'}
                {person?.death_date ? ` — Fallecido en ${new Date(person.death_date).getFullYear()}` : ''}
              </p>
            </div>
            
            <p className="text-base text-charcoal font-medium leading-relaxed italic border-l-4 border-earth-red pl-4 py-1">
              {person?.short_bio || defaultShortBio}
            </p>
          </div>
        </div>

        {/* Biography Text Section */}
        <section className="flex flex-col gap-4 border-t border-stone-beige/40 pt-6">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Biografía Institucional
          </h2>
          <div className="text-sm text-stone-750 leading-relaxed font-sans flex flex-col gap-4 whitespace-pre-line">
            {person?.biography || defaultBiography}
          </div>
        </section>

        {/* Dynamic Editorial Relations from Database */}
        {relations.length > 0 && (
          <div className="border-t border-stone-beige/40 pt-6 font-sans">
            <PublicEditorialRelations relations={relations} />
          </div>
        )}

        {/* Legado Links (Pillars Grid Navigation) */}
        <section className="border-t border-stone-beige/40 pt-6 flex flex-col gap-4 font-sans">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
            Vínculos del Legado Cultural
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            {person?.slug && (
              <Link
                href={`/personajes/${person.slug}`}
                className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
              >
                <span className="text-stone-750 group-hover:text-earth-red transition-colors">Perfil de Personaje</span>
                <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
              </Link>
            )}
            <Link
              href="/revista-la-gauchita"
              className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
            >
              <span className="text-stone-750 group-hover:text-earth-red transition-colors">Revista La Gauchita</span>
              <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
            </Link>
            <Link
              href="/instituto-cultural-andino"
              className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
            >
              <span className="text-stone-750 group-hover:text-earth-red transition-colors">Instituto Cultural Andino</span>
              <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
            </Link>
          </div>
        </section>

      </div>
    </PublicPageShell>
  );
}
