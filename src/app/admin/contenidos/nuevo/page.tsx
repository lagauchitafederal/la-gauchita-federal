import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewContentForm from '../../../../components/admin/content/NewContentForm';
import { getContentTypes, getCategories } from '../../../../lib/catalogs/catalogs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nuevo Contenido',
  description: 'Creación administrativa de contenidos en La Gauchita Federal',
};

export default async function NewContenidoPage() {
  const [contentTypes, categories] = await Promise.all([
    getContentTypes(),
    getCategories(),
  ]);

  return (
    <AdminShell>
      {/* Module Header */}
      <AdminSectionHeader
        title="Nuevo contenido"
        description="Agregue un nuevo artículo, efeméride o material editorial."
        inPreparation={false}
      />

      <NewContentForm contentTypes={contentTypes} categories={categories} />
    </AdminShell>
  );
}
