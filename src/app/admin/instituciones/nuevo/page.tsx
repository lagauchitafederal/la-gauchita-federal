import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewInstitutionForm from '../../../../components/admin/institution/NewInstitutionForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nueva Institución',
  description: 'Creación administrativa de instituciones en La Gauchita Federal',
};

export default async function NewInstitutionPage() {
  return (
    <AdminShell>
      {/* Module Header */}
      <AdminSectionHeader
        title="Nueva institución"
        description="Agregue una nueva institución a la red cultural."
        inPreparation={false}
      />

      <NewInstitutionForm />
    </AdminShell>
  );
}
