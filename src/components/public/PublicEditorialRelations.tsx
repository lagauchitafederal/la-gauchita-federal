import React from 'react';
import Link from 'next/link';
import { PublicRelationDetail } from '../../lib/public-content/public-editorial-relations';

interface PublicEditorialRelationsProps {
  relations: PublicRelationDetail[];
}

const RELATION_LABELS: Record<string, string> = {
  protagonista_de: 'Protagonista de',
  autor_de: 'Autor de',
  relacionado_con: 'Relacionado con',
  mencionado_en: 'Mencionado en',
  vinculado_a_institucion: 'Vinculado a institución',
  reconocimiento_de: 'Reconocimiento de',
  parte_de_coleccion: 'Parte de colección',
  lectura_recomendada: 'Lectura recomendada'
};

const TYPE_LABELS: Record<string, string> = {
  person: 'Personaje',
  content: 'Contenido',
  institution: 'Institución',
  recognition: 'Reconocimiento',
  media_asset: 'Archivo',
  magazine_edition: 'Edición de Revista'
};

export default function PublicEditorialRelations({ relations }: PublicEditorialRelationsProps) {
  if (!relations || relations.length === 0) {
    return null;
  }

  // Filter into the three requested groups
  const protagonistas = relations.filter(r => r.relationType === 'protagonista_de');
  const recomendados = relations.filter(r => ['lectura_recomendada', 'relacionado_con', 'autor_de'].includes(r.relationType));
  const referencias = relations.filter(r => !['protagonista_de', 'lectura_recomendada', 'relacionado_con', 'autor_de'].includes(r.relationType));

  const renderCard = (rel: PublicRelationDetail) => {
    const typeLabel = rel.relatedType === 'content' && rel.contentTypeCode === 'ephemeris'
      ? 'Efeméride'
      : TYPE_LABELS[rel.relatedType] || rel.relatedType;

    const relationLabel = RELATION_LABELS[rel.relationType] || rel.relationType;

    const cardContent = (
      <div className="bg-[#fcf8f2] border border-stone-beige/85 rounded-lg p-5 flex flex-col gap-2.5 hover:shadow-md hover:border-stone-beige transition-all duration-200 h-full justify-between">
        <div className="flex flex-col gap-2">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase">
              {typeLabel}
            </span>
            <span className="text-[9px] font-mono text-stone-600 bg-stone-beige/40 px-2 py-0.5 rounded border border-stone-beige/65">
              {relationLabel}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm sm:text-base font-serif font-black text-charcoal leading-snug group-hover:text-earth-red transition-colors">
            {rel.title}
          </h4>

          {/* Description */}
          {rel.description && (
            <p className="text-xs text-stone-650 leading-relaxed font-serif line-clamp-3">
              {rel.description}
            </p>
          )}
        </div>

        {rel.href && (
          <div className="pt-2 text-[9px] font-mono font-bold text-earth-red uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Leer más &rarr;
          </div>
        )}
      </div>
    );

    if (rel.href) {
      return (
        <Link href={rel.href} key={rel.id} className="group block h-full">
          {cardContent}
        </Link>
      );
    }

    return <div key={rel.id} className="h-full">{cardContent}</div>;
  };

  return (
    <section className="flex flex-col gap-8 mt-6">
      {/* Principal Title */}
      <div className="border-b border-stone-beige pb-3">
        <h2 className="text-xl sm:text-2xl font-serif font-black text-charcoal">
          Lecturas y referencias vinculadas
        </h2>
      </div>

      {/* Protagonistas relacionados */}
      {protagonistas.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 border-l-2 border-earth-red pl-2.5">
            Protagonistas relacionados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protagonistas.map(renderCard)}
          </div>
        </div>
      )}

      {/* También puede interesarte */}
      {recomendados.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 border-l-2 border-earth-red pl-2.5">
            También puede interesarte
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recomendados.map(renderCard)}
          </div>
        </div>
      )}

      {/* Referencias vinculadas */}
      {referencias.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 border-l-2 border-earth-red pl-2.5">
            Referencias vinculadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referencias.map(renderCard)}
          </div>
        </div>
      )}
    </section>
  );
}
