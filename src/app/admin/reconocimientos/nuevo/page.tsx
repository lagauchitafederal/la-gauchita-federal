import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewRecognitionForm from '../../../../components/admin/recognition/NewRecognitionForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nuevo Reconocimiento',
  description: 'Creación administrativa de reconocimientos en La Gauchita Federal',
};

export default async function NewRecognitionPage() {
  return (
    <AdminShell>
      {/* Module Header */}
      <AdminSectionHeader
        title="Nuevo reconocimiento"
        description="Agregue un nuevo reconocimiento, premio o aval oficial."
        inPreparation={false}
      />

      <NewRecognitionForm />
    </AdminShell>
  );
}
