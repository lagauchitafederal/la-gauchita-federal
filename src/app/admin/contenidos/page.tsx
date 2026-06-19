import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminContentsList, AdminContent } from '../../../lib/admin/admin-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Contenidos',
  description: 'Gestión editorial y de artículos de La Gauchita Federal',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  published: { text: 'Publicado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazado', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

export default async function AdminContenidosPage() {
  let contents: AdminContent[] = [];
  let isError = false;

  try {
    contents = await getAdminContentsList();
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Contenidos"
        description="Administración de artículos, efemérides, notas culturales y materiales editoriales."
        inPreparation={false}
      />

      {/* Aviso de edición habilitada */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
          Edición inicial habilitada. El slug, las relaciones y los archivos asociados se administrarán en una etapa posterior.
        </p>
      </div>

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            No se pudieron cargar los contenidos.
          </p>
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay contenidos cargados.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4 hidden md:table-cell">Slug</th>
                  <th className="p-4 hidden sm:table-cell">Autor</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 hidden md:table-cell">Tipo / Categoría</th>
                  <th className="p-4 hidden sm:table-cell">Publicación</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {contents.map((c) => {
                  const statusInfo = STATUS_LABELS[c.status] || {
                    text: c.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono md:hidden mt-0.5">
                            Slug: {c.slug}
                          </span>
                        </div>
                      </td>

                      {/* Slug (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500 max-w-[150px] truncate">
                        {c.slug}
                      </td>

                      {/* Autor */}
                      <td className="p-4 hidden sm:table-cell">
                        <span className="font-medium">
                          {c.author?.display_name || <span className="text-stone-400 italic">Sin autor</span>}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Tipo / Categoría (Desktop only) */}
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          {c.content_type?.name && (
                            <span className="text-[10px] uppercase tracking-wide font-bold text-stone-500 font-mono">
                              {c.content_type.name}
                            </span>
                          )}
                          {c.category?.name && (
                            <span className="text-[10px] uppercase tracking-wide font-bold text-earth-red font-mono">
                              {c.category.name}
                            </span>
                          )}
                          {!c.content_type?.name && !c.category?.name && (
                            <span className="text-stone-400 italic font-mono">-</span>
                          )}
                        </div>
                      </td>

                      {/* Fecha de Publicación */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-500">
                        {c.publish_date ? (
                          new Date(c.publish_date).toLocaleDateString()
                        ) : (
                          <span className="text-stone-400 italic">No programada</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Link
                            href={`/contenidos/${c.slug}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150"
                          >
                            Ver público
                          </Link>
                          <Link
                            href={`/admin/contenidos/${c.id}/editar`}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-earth-red text-white rounded-md text-[10px] uppercase tracking-wider font-bold hover:bg-earth-red/90 transition-colors duration-150"
                          >
                            Editar
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

