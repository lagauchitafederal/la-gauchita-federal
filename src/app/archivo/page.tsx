import { getPublicMediaAssetsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';
import { formatAssetType } from '../../lib/utils/formatters';
import { getPublicMediaUrl } from '../../lib/utils/media-url';

export const metadata: Metadata = {
  title: "Archivo y medios",
  description: "Fotografías, documentos, portadas y materiales de archivo vinculados al patrimonio cultural federal.",
};

export default async function ArchivoPage() {
  const mediaAssets = await getPublicMediaAssetsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Archivo y Medios"
        description="Fotografías, documentos, portadas y materiales de archivo vinculados al patrimonio cultural federal."
      />

      {mediaAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaAssets.map((asset) => {
            const imageUrl = getPublicMediaUrl(asset.bucket_name, asset.storage_path);
            const isImage = 
              (asset.mime_type && asset.mime_type.startsWith('image/')) ||
              [
                'cover_image',
                'content_image',
                'gallery_image',
                'historical_photo'
              ].includes(asset.asset_type);

            const useContain = ['recognition_document', 'cover_image'].includes(asset.asset_type);

            return (
              <div
                key={`${asset.bucket_name}/${asset.storage_path}`}
                className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col hover:border-muted-amber transition-colors duration-300"
              >
                {isImage && imageUrl ? (
                  useContain ? (
                    <div className="relative w-full h-64 bg-[#f6f0e6] flex items-center justify-center p-4 border-b border-stone-beige/60">
                      <img
                        src={imageUrl}
                        alt={asset.alt_text || asset.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-64 bg-[#f6f0e6] overflow-hidden border-b border-stone-beige/60">
                      <img
                        src={imageUrl}
                        alt={asset.alt_text || asset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-64 bg-[#f6f0e6] flex flex-col items-center justify-center p-6 border-b border-stone-beige/60 text-stone-400 gap-3">
                    <svg className="w-12 h-12 text-stone-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      {formatAssetType(asset.asset_type)}
                    </span>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow gap-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10">
                      {formatAssetType(asset.asset_type)}
                    </span>
                    {asset.rights_status && (
                      <span className="bg-stone-beige/30 text-stone-600 px-2 py-0.5 rounded text-[10px] font-mono border border-stone-beige/40">
                        Derechos: {asset.rights_status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-serif font-bold text-charcoal leading-snug">
                    {asset.title}
                  </h2>
                  {asset.description && (
                    <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">
                      {asset.description}
                    </p>
                  )}
                  {(asset.credit || asset.source_reference) && (
                    <div className="mt-auto pt-3 border-t border-stone-beige/50 flex flex-col gap-1 text-[11px] text-stone-500 italic">
                      {asset.credit && <span>Crédito: {asset.credit}</span>}
                      {asset.source_reference && <span>Fuente: {asset.source_reference}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-warm-white border border-stone-beige rounded-lg p-12 text-center">
          <p className="text-stone-500 text-sm italic">
            Aún no hay medios públicos cargados.
          </p>
        </div>
      )}
    </PublicPageShell>
  );
}
