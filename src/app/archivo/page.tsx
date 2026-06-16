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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediaAssets.map((asset) => {
            const imageUrl = getPublicMediaUrl(asset.bucket_name, asset.storage_path);
            const isImage = [
              'cover_image',
              'content_image',
              'gallery_image',
              'historical_photo'
            ].includes(asset.asset_type);

            return (
              <div
                key={`${asset.bucket_name}/${asset.storage_path}`}
                className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 flex flex-col gap-3 hover:border-stone-300 transition-colors"
              >
                {isImage && imageUrl && (
                  <div className="relative w-full h-48 mb-2 overflow-hidden rounded bg-stone-200 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={asset.alt_text || asset.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-lg font-bold text-stone-900">
                    {asset.title}
                  </h2>
                  <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium shrink-0">
                    Archivo público
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                  <span className="font-semibold uppercase tracking-wider">
                    Tipo: {formatAssetType(asset.asset_type)}
                  </span>
                  {asset.rights_status && (
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-mono">
                      Derechos: {asset.rights_status}
                    </span>
                  )}
                </div>

                {asset.description && (
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {asset.description}
                  </p>
                )}

                {asset.alt_text && (
                  <p className="text-xs text-stone-500 italic">
                    Alt: {asset.alt_text}
                  </p>
                )}

                {asset.credit && (
                  <div className="mt-auto pt-3 border-t border-stone-100 text-xs text-stone-400 font-mono">
                    Crédito: {asset.credit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
          <p className="text-stone-500 text-sm italic">
            Aún no hay medios públicos cargados.
          </p>
        </div>
      )}
    </PublicPageShell>
  );
}
