import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPageShell from '../../components/public/PublicPageShell';
import { getActiveInstitutionBySlug } from '../../lib/public-content/public-content';
import { getPublicEditorialRelations } from '../../lib/public-content/public-editorial-relations';
import PublicEditorialRelations from '../../components/public/PublicEditorialRelations';
import { formatInstitutionType } from '../../lib/utils/formatters';

export const metadata: Metadata = {
  title: 'Instituto Cultural Andino - Preservación y Difusión',
  description: 'Conozca la labor del Instituto Cultural Andino en la investigación, publicación y promoción del patrimonio del norte argentino.',
  alternates: {
    canonical: '/instituto-cultural-andino',
  },
};

export default async function InstitutoCulturalAndinoPage() {
  // Attempt to fetch the active institution record from database
  const inst = await getActiveInstitutionBySlug('instituto-cultural-andino');
  
  // Resolve relations if the institution exists in the database
  const relations = inst?.id ? await getPublicEditorialRelations('institution', inst.id) : [];

  // Static fallback editorial content if database record does not exist
  const defaultDescription = 'El Instituto Cultural Andino es un organismo civil y cultural consagrado a la investigación, resguardo y promoción del patrimonio folklórico, literario e histórico del norte argentino y del ámbito andino. Funciona como un centro de recopilación documental y fomento de expresiones artísticas autónomas.';
  
  const defaultMission = `El Instituto Cultural Andino se ha destacado por su rol activo en la edición de libros independientes, antologías poéticas, revistas culturales (siendo co-impulsor de la Revista La Gauchita) y producciones fonográficas dedicadas a difundir el folklore y el canto popular salteño y andino.

A través de foros, conferencias y encuentros de escritores regionales, el Instituto actúa como un canal de contención y estímulo para creadores independientes, educadores y jóvenes investigadores abocados a documentar la cultura viva de cada territorio. Su compromiso radica en proyectar las expresiones andinas tradicionales en diálogo con la contemporaneidad y los medios de comunicación modernos.`;

  return (
    <PublicPageShell>
      <div className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 md:p-12 flex flex-col gap-8 font-serif">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60 font-sans">
          <Link href="/acerca" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
            &larr; Volver a Institucional
          </Link>
          <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Legado Institucional</span>
        </div>

        {/* Brand / Header Block */}
        <div className="flex flex-col gap-3 font-sans">
          <span className="self-start text-[10px] bg-earth-red/5 text-earth-red border border-earth-red/10 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Instituto Cultural y de Investigación
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
            {inst?.name || 'Instituto Cultural Andino'}
          </h1>
          {inst && (
            <span className="self-start text-[9px] font-mono text-stone-500 uppercase tracking-wider border border-stone-beige px-2 py-0.5 rounded">
              Tipo: {formatInstitutionType(inst.institution_type)}
            </span>
          )}
        </div>

        {/* Narrative & Description Section */}
        <section className="flex flex-col gap-4 border-t border-stone-beige/40 pt-6">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Nuestra Misión
          </h2>
          <div className="bg-[#fcf8f2] border-l-4 border-earth-red p-4 rounded-r-md my-2">
            <p className="text-stone-850 text-sm leading-relaxed font-sans font-medium">
              {inst?.description || defaultDescription}
            </p>
          </div>
          <div className="text-sm text-stone-750 leading-relaxed font-sans flex flex-col gap-4 whitespace-pre-line mt-2">
            {defaultMission}
          </div>
        </section>

        {/* Contact info grid if available from DB */}
        {inst && (inst.website_url || inst.contact_email || inst.contact_phone || inst.address) && (
          <section className="border-t border-stone-beige/40 pt-6 flex flex-col gap-4 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
              Información del Instituto
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-mono">
              {inst.website_url && (
                <div>
                  <dt className="font-bold text-stone-400 uppercase tracking-wider">Sitio Web</dt>
                  <dd className="mt-1 text-charcoal font-medium">
                    <a href={inst.website_url} target="_blank" rel="noopener noreferrer" className="text-earth-red hover:underline break-all">
                      {inst.website_url}
                    </a>
                  </dd>
                </div>
              )}
              
              {inst.contact_email && (
                <div>
                  <dt className="font-bold text-stone-400 uppercase tracking-wider">Contacto</dt>
                  <dd className="mt-1 text-charcoal font-medium break-all">
                    {inst.contact_email}
                  </dd>
                </div>
              )}

              {inst.contact_phone && (
                <div>
                  <dt className="font-bold text-stone-400 uppercase tracking-wider">Teléfono</dt>
                  <dd className="mt-1 text-charcoal font-medium">
                    {inst.contact_phone}
                  </dd>
                </div>
              )}

              {inst.address && (
                <div className="sm:col-span-2">
                  <dt className="font-bold text-stone-400 uppercase tracking-wider">Sede</dt>
                  <dd className="mt-1 text-charcoal font-medium font-sans">
                    {inst.address}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

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
            {inst?.slug && (
              <Link
                href={`/instituciones/${inst.slug}`}
                className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
              >
                <span className="text-stone-750 group-hover:text-earth-red transition-colors">Perfil Institucional</span>
                <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
              </Link>
            )}
            <Link
              href="/eduardo-ceballos"
              className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
            >
              <span className="text-stone-750 group-hover:text-earth-red transition-colors">Legado de Eduardo Ceballos</span>
              <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
            </Link>
            <Link
              href="/revista-la-gauchita"
              className="bg-[#fcfbf9] border border-stone-beige/80 hover:border-earth-red p-4 rounded flex items-center justify-between group transition-colors duration-150"
            >
              <span className="text-stone-750 group-hover:text-earth-red transition-colors">Revista La Gauchita</span>
              <span className="text-stone-400 group-hover:text-earth-red">&rarr;</span>
            </Link>
          </div>
        </section>

      </div>
    </PublicPageShell>
  );
}
