import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminInstitutionsList, AdminInstitution } from '../../../lib/admin/admin-institutions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Instituciones',
  description: 'Gestión de la red cultural e institucional de La Gauchita Federal',
};

const TYPE_LABELS: Record<string, string> = {
  cultural_institute: 'Instituto Cultural',
  municipality: 'Municipio',
  province: 'Provincia',
  government_agency: 'Org. Gubernamental',
  school: 'Escuela',
  library: 'Biblioteca',
  museum: 'Museo',
  association: 'Asociación',
  pena: 'Peña',
  gastronomic_place: 'Lugar Gastronómico',
  cultural_center: 'Centro Cultural',
  media: 'Medio',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  active: { text: 'Activo', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  inactive: { text: 'Inactivo', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
};

interface AdminInstitucionesPageProps {
  searchParams: Promise<{ guardado?: string }>;
}

export default async function AdminInstitucionesPage({ searchParams }: AdminInstitucionesPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';

  let institutions: AdminInstitution[] = [];
  let isError = false;

  try {
    institutions = await getAdminInstitutionsList();
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Instituciones"
        description="Administración de instituciones participantes o vinculadas al archivo documental."
        inPreparation={false}
      />

      {/* Aviso de éxito tras guardar */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            Los cambios fueron guardados correctamente.
          </p>
        </div>
      )}

      {/* Aviso de edición habilitada */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
          Edición inicial habilitada. El slug, la ubicación territorial y las relaciones se administrarán en una etapa posterior.
        </p>
      </div>

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            No se pudieron cargar las instituciones.
          </p>
        </div>
      ) : institutions.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay instituciones cargadas.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Nombre</th>
                  <th className="p-4 hidden md:table-cell">Slug</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 hidden sm:table-cell">Ubicación</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 hidden sm:table-cell">Destacada</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {institutions.map((inst) => {
                  const statusInfo = STATUS_LABELS[inst.status] || {
                    text: inst.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };
                  const typeLabel = TYPE_LABELS[inst.institution_type] || inst.institution_type;

                  return (
                    <tr key={inst.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Nombre */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {inst.name}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono md:hidden mt-0.5">
                            Slug: {inst.slug}
                          </span>
                        </div>
                      </td>

                      {/* Slug (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500 max-w-[150px] truncate">
                        {inst.slug}
                      </td>

                      {/* Tipo */}
                      <td className="p-4 font-medium">
                        <span className="bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide font-mono text-stone-600">
                          {typeLabel}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-500">
                        {inst.municipality?.name || inst.province?.name ? (
                          <div className="flex flex-col gap-0.5">
                            {inst.municipality?.name && (
                              <span className="font-medium text-stone-700">{inst.municipality.name}</span>
                            )}
                            {inst.province?.name && (
                              <span className="text-[10px] font-bold text-earth-red uppercase tracking-wider">{inst.province.name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">No especificada</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Destacada */}
                      <td className="p-4 hidden sm:table-cell font-mono">
                        {inst.is_featured ? (
                          <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-250 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Sí
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">No</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col gap-2 justify-center items-end">
                          <Link
                            href={`/instituciones/${inst.slug}`}
                            className="inline-flex items-center justify-center w-28 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150 text-center"
                          >
                            VER PÚBLICO
                          </Link>
                          <Link
                            href={`/admin/instituciones/${inst.id}/editar`}
                            className="inline-flex items-center justify-center w-28 py-1.5 bg-earth-red text-white rounded-md text-[10px] uppercase tracking-wider font-bold hover:bg-earth-red/90 transition-colors duration-150 text-center"
                          >
                            EDITAR
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </AdminShell>
  );
}
