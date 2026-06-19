import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditInstitutionForm from '../../../../../components/admin/institution/EditInstitutionForm';
import { getAdminInstitutionById } from '../../../../../lib/admin/admin-institutions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Institución',
  description: 'Edición administrativa de instituciones en La Gauchita Federal',
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInstitutionPage({ params }: EditPageProps) {
  const { id } = await params;
  
  let institution = null;
  let isError = false;

  try {
    institution = await getAdminInstitutionById(id);
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Editar institución"
        description="Modifique los detalles de la institución seleccionada."
        inPreparation={false}
      />

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            Ocurrió un error al intentar cargar la institución.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/instituciones"
              className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      ) : !institution ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center flex flex-col gap-4 items-center">
          <p className="text-stone-500 text-sm italic font-mono">
            La institución con el identificador provisto no existe o no tiene privilegios para acceder a ella.
          </p>
          <Link
            href="/admin/instituciones"
            className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
          >
            Volver al listado
          </Link>
        </div>
      ) : (
        <EditInstitutionForm institution={institution} />
      )}

    </AdminShell>
  );
}
