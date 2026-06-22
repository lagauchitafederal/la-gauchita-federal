import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditMediaAssetForm from '../../../../../components/admin/media/EditMediaAssetForm';
import { getAdminMediaAssetById } from '../../../../../lib/admin/admin-media-assets';
import { getAdminContentsList } from '../../../../../lib/admin/admin-content';
import { getAdminInstitutionsList } from '../../../../../lib/admin/admin-institutions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Archivo - Administración',
  description: 'Edición administrativa de metadatos y asociaciones de archivos en La Gauchita Federal',
};

interface EditArchivoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArchivoPage({ params }: EditArchivoPageProps) {
  const { id } = await params;

  let asset = null;
  let contents: { id: string; title: string }[] = [];
  let institutions: { id: string; name: string }[] = [];
  let isError = false;

  try {
    const [assetData, contentsData, institutionsData] = await Promise.all([
      getAdminMediaAssetById(id),
      getAdminContentsList(),
      getAdminInstitutionsList(),
    ]);

    asset = assetData;
    contents = contentsData.map((c) => ({ id: c.id, title: c.title }));
    institutions = institutionsData.map((i) => ({ id: i.id, name: i.name }));
  } catch (error) {
    console.error('Error fetching data for editing media asset:', error);
    isError = true;
  }

  return (
    <AdminShell>
      {/* Module Header */}
      <AdminSectionHeader
        title="Editar archivo"
        description="Modifique los metadatos y asociaciones del archivo seleccionado."
        inPreparation={false}
      />

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            Ocurrió un error al intentar cargar el archivo o las opciones de asociación.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/archivo"
              className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      ) : !asset ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center flex flex-col gap-4 items-center">
          <p className="text-stone-500 text-sm italic font-mono">
            El archivo con el identificador provisto no existe o no tiene privilegios para acceder a él.
          </p>
          <Link
            href="/admin/archivo"
            className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
          >
            Volver al listado
          </Link>
        </div>
      ) : (
        <EditMediaAssetForm asset={asset} contents={contents} institutions={institutions} />
      )}
    </AdminShell>
  );
}
