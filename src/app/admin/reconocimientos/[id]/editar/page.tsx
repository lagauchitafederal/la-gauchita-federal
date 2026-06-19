import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditRecognitionForm from '../../../../../components/admin/recognition/EditRecognitionForm';
import { getAdminRecognitionById } from '../../../../../lib/admin/admin-recognitions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Reconocimiento',
  description: 'Edición administrativa de reconocimientos en La Gauchita Federal',
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecognitionPage({ params }: EditPageProps) {
  const { id } = await params;
  
  let recognition = null;
  let isError = false;

  try {
    recognition = await getAdminRecognitionById(id);
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Editar reconocimiento"
        description="Modifique los detalles del reconocimiento seleccionado."
        inPreparation={false}
      />

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            Ocurrió un error al intentar cargar el reconocimiento.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/reconocimientos"
              className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      ) : !recognition ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center flex flex-col gap-4 items-center">
          <p className="text-stone-500 text-sm italic font-mono">
            El reconocimiento con el identificador provisto no existe o no tiene privilegios para acceder a él.
          </p>
          <Link
            href="/admin/reconocimientos"
            className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
          >
            Volver al listado
          </Link>
        </div>
      ) : (
        <EditRecognitionForm recognition={recognition} />
      )}

    </AdminShell>
  );
}
