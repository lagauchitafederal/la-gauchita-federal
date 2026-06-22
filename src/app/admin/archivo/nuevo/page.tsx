import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewMediaAssetForm from '../../../../components/admin/media/NewMediaAssetForm';
import { getAdminContentsList } from '../../../../lib/admin/admin-content';
import { getAdminInstitutionsList } from '../../../../lib/admin/admin-institutions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Subir Archivo - Administración',
  description: 'Carga de nuevos materiales de archivo y multimedia en La Gauchita Federal',
};

export default async function NewMediaAssetPage() {
  let contents: { id: string; title: string }[] = [];
  let institutions: { id: string; name: string }[] = [];
  let fetchError = false;

  try {
    const [contentsData, institutionsData] = await Promise.all([
      getAdminContentsList(),
      getAdminInstitutionsList(),
    ]);
    
    // Map required fields for the form
    contents = contentsData.map((c) => ({ id: c.id, title: c.title }));
    institutions = institutionsData.map((i) => ({ id: i.id, name: i.name }));
  } catch (error) {
    console.error('Error fetching dynamic data for new media asset:', error);
    fetchError = true;
  }

  return (
    <AdminShell>
      {/* Module Header */}
      <AdminSectionHeader
        title="Subir archivo"
        description="Cargue imágenes, documentos o audios al archivo federal y asócielos a contenidos o instituciones."
        inPreparation={false}
      />

      {fetchError && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            Advertencia: Ocurrió un error al cargar la lista de contenidos o instituciones. Algunas opciones de asociación podrían no estar disponibles.
          </p>
        </div>
      )}

      <NewMediaAssetForm contents={contents} institutions={institutions} />
    </AdminShell>
  );
}
