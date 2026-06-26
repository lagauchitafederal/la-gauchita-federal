import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import ImportEphemeridesForm from '../../../../components/admin/content/ImportEphemeridesForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Previsualizar Importaci\u00f3n | La Gauchita Federal',
  description: 'Herramienta de previsualizaci\u00f3n y validaci\u00f3n de carga masiva de efem\u00e9rides.',
};

export default async function ImportarEfemeridesPage() {
  return (
    <AdminShell>
      {/* Module Header */}
      <div className="flex flex-col mb-2">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-mono">
          Carga editorial
        </span>
      </div>
      <AdminSectionHeader
        title="Previsualizar importaci\u00f3n de efem\u00e9rides"
        description="Valid\u00e1 el archivo CSV antes de incorporar registros al circuito editorial."
        inPreparation={false}
      />
      
      {/* Dynamic validation and preview form */}
      <ImportEphemeridesForm />
    </AdminShell>
  );
}
