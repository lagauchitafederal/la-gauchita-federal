import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditContentForm from '../../../../../components/admin/content/EditContentForm';
import { getAdminContentById } from '../../../../../lib/admin/admin-content';
import { getContentVersions } from '../../../../../lib/admin/admin-content-versions';
import { getAssignmentsByContent, getAdministrativeProfiles, checkUserIsAdminOrEditor } from '../../../../../lib/admin/admin-editorial-assignments';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Contenido',
  description: 'Edición administrativa de contenidos en La Gauchita Federal',
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContenidoPage({ params }: EditPageProps) {
  const { id } = await params;
  
  let content = null;
  let versions: any[] = [];
  let assignments: any[] = [];
  let adminProfiles: any[] = [];
  let isAdminOrEditor = false;
  let isError = false;

  try {
    content = await getAdminContentById(id);
    if (content) {
      const [versionsData, assignmentsData, profilesData, authorized] = await Promise.all([
        getContentVersions(id),
        getAssignmentsByContent(id),
        getAdministrativeProfiles(),
        checkUserIsAdminOrEditor(),
      ]);
      versions = versionsData;
      assignments = assignmentsData;
      adminProfiles = profilesData;
      isAdminOrEditor = authorized;
    }
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Editar contenido"
        description="Modifique los detalles del artículo o efeméride seleccionada."
        inPreparation={false}
      />

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            Ocurrió un error al intentar cargar el contenido.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/contenidos"
              className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      ) : !content ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center flex flex-col gap-4 items-center">
          <p className="text-stone-500 text-sm italic font-mono">
            El contenido con el identificador provisto no existe o no tiene privilegios para acceder a él.
          </p>
          <Link
            href="/admin/contenidos"
            className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
          >
            Volver al listado
          </Link>
        </div>
      ) : (
        <EditContentForm
          content={content}
          versions={versions}
          assignments={assignments}
          adminProfiles={adminProfiles}
          isAdminOrEditor={isAdminOrEditor}
        />
      )}

    </AdminShell>
  );
}
