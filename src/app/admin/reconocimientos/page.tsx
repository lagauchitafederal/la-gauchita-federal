import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminRecognitionsList, AdminRecognition } from '../../../lib/admin/admin-recognitions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Reconocimientos',
  description: 'Gestión de trayectoria, premios y avales de La Gauchita Federal',
};

const RECOGNITION_TYPES: Record<string, string> = {
  award: 'Premio',
  mention: 'Mención',
  declaration: 'Declaración',
  endorsement: 'Aval',
  distinction: 'Distinción',
  homage: 'Homenaje',
  certification: 'Certificación',
  press: 'Prensa',
  participation: 'Participación',
  other: 'Otro',
};

const ENTITY_TYPES: Record<string, string> = {
  person: 'Persona',
  magazine: 'Revista',
  institute: 'Instituto',
  project: 'Proyecto',
  book: 'Libro',
  music_album: 'Álbum',
  institution: 'Institución',
  content: 'Contenido',
  event: 'Evento',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  active: { text: 'Activo', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazado', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

export default async function AdminReconocimientosPage() {
  let recognitions: AdminRecognition[] = [];
  let isError = false;

  try {
    recognitions = await getAdminRecognitionsList();
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Reconocimientos"
        description="Administración de premios, menciones, homenajes, certificados y distinciones oficiales."
        inPreparation={false}
      />

      {/* Aviso prudente solo lectura */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
          Modo solo lectura. La creación y edición de reconocimientos será incorporada en una próxima etapa.
        </p>
      </div>

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            No se pudieron cargar los reconocimientos.
          </p>
        </div>
      ) : recognitions.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay reconocimientos cargados.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 hidden sm:table-cell">Entidad Reconocida</th>
                  <th className="p-4 hidden md:table-cell">Otorgante</th>
                  <th className="p-4 hidden sm:table-cell">Fecha</th>
                  <th className="p-4 hidden md:table-cell">Localidad</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {recognitions.map((rec) => {
                  const statusInfo = STATUS_LABELS[rec.status] || {
                    text: rec.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };
                  const typeLabel = RECOGNITION_TYPES[rec.recognition_type] || rec.recognition_type;
                  const entityLabel = ENTITY_TYPES[rec.recognized_entity_type] || rec.recognized_entity_type;

                  return (
                    <tr key={rec.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {rec.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono md:hidden mt-0.5">
                            Slug: {rec.slug}
                          </span>
                          {rec.location && (
                            <span className="text-[10px] text-stone-500 md:hidden font-mono mt-0.5">
                              Localidad: {rec.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="p-4">
                        <span className="bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide font-mono text-stone-600">
                          {typeLabel}
                        </span>
                      </td>

                      {/* Entidad Reconocida */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-600">
                        <span className="text-[10px] bg-earth-red/5 text-earth-red border border-earth-red/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {entityLabel}
                        </span>
                      </td>

                      {/* Otorgante */}
                      <td className="p-4 hidden md:table-cell font-medium text-stone-700">
                        {rec.granting_institution_name || <span className="text-stone-400 italic">No especificada</span>}
                      </td>

                      {/* Fecha */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-500">
                        {rec.recognition_date ? (
                          new Date(rec.recognition_date).toLocaleDateString()
                        ) : (
                          <span className="text-stone-400 italic">-</span>
                        )}
                      </td>

                      {/* Localidad (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500">
                        {rec.location || <span className="text-stone-400 italic">No especificada</span>}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Link
                            href={`/reconocimientos/${rec.slug}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150"
                          >
                            Ver público
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
