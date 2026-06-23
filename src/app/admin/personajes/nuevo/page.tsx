import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewPersonForm from '../../../../components/admin/content/NewPersonForm';
import { getRegions, getProvinces, getMunicipalities } from '../../../../lib/catalogs/catalogs';
import { getAdminMediaAssetsList } from '../../../../lib/admin/admin-media-assets';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nuevo Personaje',
  description: 'Creación de un nuevo perfil de personaje en La Gauchita Federal',
};

export default async function NewPersonPage() {
  const [regions, provinces, municipalities, mediaAssets] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getAdminMediaAssetsList()
  ]);

  const mappedMedia = (mediaAssets || []).map(asset => ({
    id: asset.id,
    title: asset.title || asset.original_filename || asset.storage_path,
    storage_path: asset.storage_path
  }));

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Nuevo Personaje"
        description="Agregá un nuevo prócer, escritor, artista o referente popular al catálogo nacional."
        inPreparation={false}
      />
      <NewPersonForm
        regions={regions}
        provinces={provinces}
        municipalities={municipalities}
        mediaAssets={mappedMedia}
      />
    </AdminShell>
  );
}
