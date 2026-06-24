import React from 'react';
import { CleanMediaAsset } from '../../lib/public-content/public-content-media';

interface ContentMediaGalleryProps {
  images: CleanMediaAsset[];
}

export default function ContentMediaGallery({ images }: ContentMediaGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  // Display a reasonable maximum (e.g. 12 images) initially
  const visibleImages = images.slice(0, 12);

  return (
    <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-5 mt-4">
      <h3 className="text-xl font-serif font-black text-charcoal border-b border-stone-beige pb-3">
        Imágenes y documentos de la memoria
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {visibleImages.map((img) => (
          <div 
            key={img.key}
            className="flex flex-col gap-3 bg-[#fcf8f2] border border-stone-beige/80 rounded-lg p-4 hover:shadow-md hover:border-muted-amber transition-all duration-200"
          >
            {/* Image Container with aspect ratio to prevent layout shift */}
            <div className="aspect-[4/3] bg-stone-100 rounded-md overflow-hidden relative border border-stone-beige/50">
              <img
                src={img.url}
                alt={img.alt_text || img.title || 'Imagen de la memoria'}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            
            {/* Title and Credits */}
            <div className="flex flex-col gap-1 text-xs text-stone-700">
              {img.title && (
                <span className="font-serif font-bold text-charcoal leading-snug">
                  {img.title}
                </span>
              )}
              {img.description && (
                <p className="text-[11px] text-stone-550 leading-relaxed font-serif line-clamp-2">
                  {img.description}
                </p>
              )}
              {img.credit && (
                <span className="text-[9px] font-mono text-stone-500 italic mt-1 block border-t border-stone-beige/30 pt-1">
                  Crédito: {img.credit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
