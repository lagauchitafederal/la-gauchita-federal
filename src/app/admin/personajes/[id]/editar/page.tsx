import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditPersonForm from '../../../../../components/admin/content/EditPersonForm';
import { getRegions, getProvinces, getMunicipalities } from '../../../../../lib/catalogs/catalogs';
import { getAdminMediaAssetsList } from '../../../../../lib/admin/admin-media-assets';
import { getAdminPersonById } from '../../../../../lib/admin/admin-people';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Personaje',
  description: 'Edición de perfil de personaje en La Gauchita Federal',
};

interface EditPersonPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const { id } = await params;

  const [person, regions, provinces, municipalities, mediaAssets] = await Promise.all([
    getAdminPersonById(id),
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getAdminMediaAssetsList()
  ]);

  if (!person) {
    return (
      <AdminShell>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center flex flex-col gap-4">
          <p className="text-red-700 text-sm font-bold font-mono">
            El personaje solicitado no existe o no tenés permisos para verlo.
          </p>
          <div>
            <Link
              href="/admin/personajes"
              className="inline-flex items-center justify-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold font-mono rounded hover:bg-stone-50 transition-colors"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  const mappedMedia = (mediaAssets || []).map(asset => ({
    id: asset.id,
    title: asset.title || asset.original_filename || asset.storage_path,
    storage_path: asset.storage_path
  }));

  return (
    <AdminShell>
      <AdminSectionHeader
        title={`Editar: ${person.full_name}`}
        description="Editá la información, biografía, territorio y visibilidad del perfil."
        inPreparation={false}
      />
      <EditPersonForm
        person={person}
        regions={regions}
        provinces={provinces}
        municipalities={municipalities}
        mediaAssets={mappedMedia}
      />
    </AdminShell>
  );
}
