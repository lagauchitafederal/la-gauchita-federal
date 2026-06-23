import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewEphemerisForm from '../../../../components/admin/content/NewEphemerisForm';
import {
  getCategories,
  getRegions,
  getProvinces,
  getMunicipalities
} from '../../../../lib/catalogs/catalogs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nueva Efeméride',
  description: 'Creación de un nuevo hito histórico en La Gauchita Federal',
};

export default async function NewEphemerisPage() {
  const [categories, regions, provinces, municipalities] = await Promise.all([
    getCategories(),
    getRegions(),
    getProvinces(),
    getMunicipalities()
  ]);

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Nueva Efeméride"
        description="Agregá un nuevo hito o efeméride al catálogo histórico."
        inPreparation={false}
      />
      <NewEphemerisForm
        categories={categories}
        regions={regions}
        provinces={provinces}
        municipalities={municipalities}
      />
    </AdminShell>
  );
}
