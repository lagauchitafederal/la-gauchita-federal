import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import ImportEphemeridesForm from '../../../../components/admin/content/ImportEphemeridesForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Previsualizar Importación | La Gauchita Federal',
  description: 'Herramienta de previsualización y validación de carga masiva de efemérides.',
};

export default async function ImportarEfemeridesPage() {
  return (
    <AdminShell>
      {/* Module Header */}
      <div className="flex flex-col mb-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-mono">
            Carga editorial
          </span>
          <Link
            href="/admin/efemerides/importaciones"
            className="text-xs font-mono font-bold text-stone-500 hover:text-earth-red transition-colors duration-150"
          >
            VER VALIDACIONES GUARDADAS →
          </Link>
        </div>
      </div>
      <AdminSectionHeader
        title="Previsualizar importación de efemérides"
        description="Validá el archivo CSV antes de incorporar registros al circuito editorial."
        inPreparation={false}
      />
      
      {/* Dynamic validation and preview form */}
      <ImportEphemeridesForm />
    </AdminShell>
  );
}
