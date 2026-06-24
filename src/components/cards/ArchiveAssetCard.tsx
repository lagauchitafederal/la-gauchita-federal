import React from 'react';
import { formatAssetType, stripHtml, truncateText } from '../../lib/utils/formatters';
import { getPublicMediaUrl } from '../../lib/utils/media-url';

export interface ArchiveAssetCardProps {
  asset: {
    bucket_name: string;
    storage_path: string;
    alt_text?: string | null;
    title: string;
    description?: string | null;
    asset_type: string;
    mime_type?: string | null;
    rights_status?: string | null;
    credit?: string | null;
    source_reference?: string | null;
  };
}

export default function ArchiveAssetCard({ asset }: ArchiveAssetCardProps) {
  const imageUrl = getPublicMediaUrl(asset.bucket_name, asset.storage_path);
  const cleanDescription = stripHtml(asset.description);
  const truncatedDescription = truncateText(cleanDescription, 150);

  const isImage = 
    (asset.mime_type && asset.mime_type.startsWith('image/')) ||
    [
      'cover_image',
      'content_image',
      'gallery_image',
      'historical_photo'
    ].includes(asset.asset_type);

  const useContain = [
    'recognition_document',
    'cover_image',
    'archive_material',
    'pdf_document',
    'magazine_pdf',
    'book_pdf',
    'teacher_resource',
    'institutional_document'
  ].includes(asset.asset_type);

  return (
    <div className="bg-[#fcf8f2] border border-stone-beige rounded-lg overflow-hidden flex flex-col justify-between hover:border-muted-amber hover:shadow-sm transition-all duration-200">
      <div>
        {/* Media Preview Container */}
        {isImage && imageUrl ? (
          useContain ? (
            <div className="relative w-full h-64 bg-[#f6f0e6] flex items-center justify-center p-4 border-b border-stone-beige/60">
              <img
                src={imageUrl}
                alt={asset.alt_text || asset.title}
                className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative w-full h-64 bg-[#f6f0e6] overflow-hidden border-b border-stone-beige/60">
              <img
                src={imageUrl}
                alt={asset.alt_text || asset.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          )
        ) : (
          <div className="relative w-full h-64 bg-[#f6f0e6] flex flex-col items-center justify-center p-6 border-b border-stone-beige/60 text-stone-400 gap-3">
            <svg className="w-12 h-12 text-stone-400/85" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
              {formatAssetType(asset.asset_type)}
            </span>
          </div>
        )}

        {/* Card Content */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase font-mono">
              {formatAssetType(asset.asset_type)}
            </span>
            {asset.rights_status && (
              <span className="bg-stone-beige/40 text-stone-600 px-2 py-0.5 rounded text-[9px] font-mono border border-stone-beige/65 uppercase tracking-wide">
                © {asset.rights_status}
              </span>
            )}
          </div>

          <h4 className="font-serif font-black text-base text-charcoal leading-snug">
            {asset.title}
          </h4>

          {truncatedDescription && (
            <p className="text-xs text-stone-700 leading-relaxed font-serif line-clamp-3">
              {truncatedDescription}
            </p>
          )}
        </div>
      </div>

      {/* Credit / Origin Footer */}
      {(asset.credit || asset.source_reference) && (
        <div className="p-5 pt-3 border-t border-stone-beige/50 mt-auto flex flex-col gap-0.5 text-[9px] font-mono text-stone-500 italic">
          {asset.credit && <span className="line-clamp-1">Crédito: {asset.credit}</span>}
          {asset.source_reference && <span className="line-clamp-1">Fuente: {asset.source_reference}</span>}
        </div>
      )}
    </div>
  );
}
