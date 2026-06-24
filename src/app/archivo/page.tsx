import { getPublicMediaAssetsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';
import ArchiveAssetCard from '../../components/cards/ArchiveAssetCard';

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
          {mediaAssets.map((asset) => (
            <ArchiveAssetCard
              key={`${asset.bucket_name}/${asset.storage_path}`}
              asset={asset}
            />
          ))}
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
