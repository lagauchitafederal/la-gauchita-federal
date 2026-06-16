import { getPublicMediaAssetsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';

export default async function ArchivoPage() {
  const mediaAssets = await getPublicMediaAssetsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Archivo y Medios"
        description="Fotografias, documentos, portadas y materiales de archivo vinculados al patrimonio cultural federal."
      />

      {mediaAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediaAssets.map((asset) => (
            <div
              key={`${asset.bucket_name}/${asset.storage_path}`}
              className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 flex flex-col gap-3 hover:border-stone-300 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-lg font-bold text-stone-900">
                  {asset.title}
                </h2>
                <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium shrink-0">
                  Archivo publico
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                <span className="font-semibold uppercase tracking-wider">
                  Tipo: {asset.asset_type.replace('_', ' ')}
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
                  Credito: {asset.credit}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
          <p className="text-stone-500 text-sm italic">
            Aun no hay medios publicos cargados.
          </p>
        </div>
      )}
    </PublicPageShell>
  );
}
