import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import { getImportBatchesList, ImportBatch } from '../../../../lib/admin/admin-import-batches';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Validaciones de Importación',
  description: 'Consulta de lotes de validación de efemérides de La Gauchita Federal',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  draft_validation: { text: 'Prevalidación', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  validated: { text: 'Validado', classes: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  importing: { text: 'Importando', classes: 'bg-amber-50 text-amber-800 border-amber-200/60' },
  imported: { text: 'Importado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  failed: { text: 'Fallido', classes: 'bg-red-50 text-red-700 border-red-200/60' },
  reverted: { text: 'Revertido', classes: 'bg-purple-50 text-purple-700 border-purple-200/60' },
};

interface ImportPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ImportBatchesPage({ searchParams }: ImportPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 15;

  let batchesData: { data: ImportBatch[]; count: number } = { data: [], count: 0 };
  let isError = false;

  try {
    batchesData = await getImportBatchesList(page, pageSize);
  } catch (error) {
    console.error('Error loading import batches:', error);
    isError = true;
  }

  const { data: batches, count } = batchesData;
  const totalPages = Math.ceil(count / pageSize);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminShell>
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Validaciones guardadas"
          description="Estos lotes conservan el resultado de la revisión CSV. Todavía no incorporan efemérides al catálogo público."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/efemerides/importar"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVA IMPORTACIÓN (CSV)
          </Link>
        </div>
      </div>

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            No se pudieron cargar los lotes de validación.
          </p>
        </div>
      ) : count === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm flex flex-col items-center gap-3">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay lotes de validación guardados.
          </p>
          <Link
            href="/admin/efemerides/importar"
            className="text-xs font-mono font-bold text-earth-red hover:text-earth-red/80 border-b border-earth-red"
          >
            Subir un archivo CSV ahora
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 border-collapse font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nombre del Lote</th>
                    <th className="p-4">Archivo de Origen</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Fecha de Validación</th>
                    <th className="p-4 text-center">Total Filas</th>
                    <th className="p-4 text-center">Válidas</th>
                    <th className="p-4 text-center">Obs.</th>
                    <th className="p-4 text-center">Duplicados</th>
                    <th className="p-4 text-center">Errores</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {batches.map((b: any) => {
                    const statusInfo = STATUS_LABELS[b.status] || {
                      text: b.status,
                      classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                    };

                    return (
                      <tr key={b.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                        <td className="p-4">
                          <Link
                            href={`/admin/efemerides/importaciones/${b.id}`}
                            className="font-serif font-bold text-sm text-charcoal hover:text-earth-red transition-colors duration-150 leading-snug"
                          >
                            {b.batch_name}
                          </Link>
                        </td>
                        <td className="p-4 font-mono text-stone-600 truncate max-w-[150px]" title={b.source_file_name || ''}>
                          {b.source_file_name || 'Sin archivo'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${statusInfo.classes}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-stone-500">
                          {formatDate(b.validated_at || b.created_at)}
                        </td>
                        <td className="p-4 text-center font-mono font-medium text-stone-600">
                          {b.total_rows}
                        </td>
                        <td className="p-4 text-center font-mono text-emerald-600 font-bold">
                          {b.valid_rows}
                        </td>
                        <td className="p-4 text-center font-mono text-amber-600 font-bold">
                          {b.warning_rows}
                        </td>
                        <td className="p-4 text-center font-mono text-stone-500">
                          {b.duplicate_rows}
                        </td>
                        <td className="p-4 text-center font-mono text-red-600 font-bold">
                          {b.error_rows}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/efemerides/importaciones/${b.id}`}
                            className="font-mono text-[11px] font-bold text-stone-700 hover:text-earth-red transition-colors duration-150 border-b border-transparent hover:border-earth-red"
                          >
                            VER DETALLE
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border border-stone-beige rounded-lg p-4 shadow-sm font-mono text-xs">
              <span className="text-stone-500">
                Página {page} de {totalPages} ({count} registros en total)
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={`/admin/efemerides/importaciones?page=${page - 1}`}
                    className="px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-50 font-bold text-stone-700"
                  >
                    ANTERIOR
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 border border-stone-200 text-stone-300 rounded cursor-not-allowed">
                    ANTERIOR
                  </span>
                )}
                {page < totalPages ? (
                  <Link
                    href={`/admin/efemerides/importaciones?page=${page + 1}`}
                    className="px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-50 font-bold text-stone-700"
                  >
                    SIGUIENTE
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 border border-stone-200 text-stone-300 rounded cursor-not-allowed">
                    SIGUIENTE
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
