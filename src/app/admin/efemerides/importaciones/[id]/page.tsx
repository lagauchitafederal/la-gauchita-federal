import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../../components/admin/AdminShell';
import { getImportBatchById, getBatchRows, ImportBatchRow } from '../../../../../lib/admin/admin-import-batches';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Detalle de Validación de Importación',
  description: 'Detalle de lote de validación de efemérides de La Gauchita Federal',
};

const BATCH_STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  draft_validation: { text: 'Prevalidación', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  validated: { text: 'Validado', classes: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  importing: { text: 'Importando', classes: 'bg-amber-50 text-amber-800 border-amber-200/60' },
  imported: { text: 'Importado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  failed: { text: 'Fallido', classes: 'bg-red-50 text-red-700 border-red-200/60' },
  reverted: { text: 'Revertido', classes: 'bg-purple-50 text-purple-700 border-purple-200/60' },
};

const ROW_STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  valida: { text: 'Válida', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  valida_con_observaciones: { text: 'Con Observaciones', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  duplicado_probable: { text: 'Duplicado Probable', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  error: { text: 'Error', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

const EXECUTION_STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  pending: { text: 'Pendiente', classes: 'bg-stone-50 text-stone-500 border-stone-200' },
  imported: { text: 'Importada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  skipped: { text: 'Omitida', classes: 'bg-slate-50 text-slate-500 border-slate-200' },
  failed: { text: 'Fallida', classes: 'bg-red-50 text-red-700 border-red-200' },
};

interface DetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; estado?: string }>;
}

export default async function ImportBatchDetailPage({ params, searchParams }: DetailPageProps) {
  const { id } = await params;
  const sparams = await searchParams;

  const page = parseInt(sparams.page || '1', 10);
  const selectedFilter = sparams.estado || 'todos';

  if (!['todos', 'valida', 'valida_con_observaciones', 'duplicado_probable', 'error'].includes(selectedFilter)) {
    return notFound();
  }

  // 1. Fetch Batch Header info
  const batch = await getImportBatchById(id);
  if (!batch) {
    return notFound();
  }

  // 2. Fetch Batch Rows
  const pageSize = 20;
  let rowsData: { data: ImportBatchRow[]; count: number } = { data: [], count: 0 };
  let isError = false;

  try {
    rowsData = await getBatchRows(id, page, pageSize, selectedFilter as any);
  } catch (err) {
    console.error('Error fetching batch rows:', err);
    isError = true;
  }

  const { data: rows, count } = rowsData;
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

  const getRowTitle = (row: any) => {
    const norm = row.normalized_data || {};
    const raw = row.raw_data || {};
    return norm.title || norm.titulo || raw.titulo || raw.title || 'Sin título';
  };

  const statusInfo = BATCH_STATUS_LABELS[batch.status] || {
    text: batch.status,
    classes: 'bg-stone-100 text-stone-650 border-stone-200/60',
  };

  const truncatedHash = batch.file_hash 
    ? `${batch.file_hash.slice(0, 8)}...${batch.file_hash.slice(-8)}`
    : 'Sin Hash';

  return (
    <AdminShell>
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Link
            href="/admin/efemerides/importaciones"
            className="inline-flex items-center text-xs font-mono font-bold text-stone-500 hover:text-earth-red transition-colors duration-150"
          >
            ← VOLVER A VALIDACIONES GUARDADAS
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-serif font-bold text-charcoal">
                {batch.batch_name}
              </h1>
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${statusInfo.classes}`}>
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono">
              Archivo: {batch.source_file_name || 'Desconocido'} • Creado el {formatDate(batch.created_at)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-stone-400 bg-stone-50 border border-stone-200 px-2 py-1 rounded" title={batch.file_hash || ''}>
              HASH: {truncatedHash}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
        <p className="text-xs text-amber-900 font-bold font-mono">
          Aviso: Este lote conserva una validación editorial. No se crearon ni publicaron efemérides a partir de estas filas.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {[
          { label: 'Total', value: batch.total_rows, color: 'text-stone-700 bg-stone-50 border-stone-200' },
          { label: 'Válidas', value: batch.valid_rows, color: 'text-emerald-700 bg-emerald-50/50 border-emerald-200' },
          { label: 'Observaciones', value: batch.warning_rows, color: 'text-amber-700 bg-amber-50/50 border-amber-200' },
          { label: 'Duplicados', value: batch.duplicate_rows, color: 'text-stone-700 bg-stone-50 border-stone-200' },
          { label: 'Errores', value: batch.error_rows, color: 'text-red-700 bg-red-50/50 border-red-200' },
          { label: 'Importadas', value: batch.imported_rows, color: 'text-emerald-700 bg-emerald-50/30 border-emerald-200' },
          { label: 'Omitidas', value: batch.skipped_rows, color: 'text-slate-600 bg-slate-50 border-slate-200' },
        ].map((c) => (
          <div key={c.label} className={`border rounded-lg p-3 text-center shadow-xs flex flex-col gap-0.5 ${c.color}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono opacity-80">{c.label}</span>
            <span className="text-xl font-bold font-mono leading-none">{c.value}</span>
          </div>
        ))}
      </div>

      {/* Rows filter buttons */}
      <div className="flex flex-col gap-2 border-t border-stone-200 pt-4 mt-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
          Filtrar filas por estado de validación:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { filter: 'todos', label: `Todos (${batch.total_rows})` },
            { filter: 'valida', label: `Válidas (${batch.valid_rows})` },
            { filter: 'valida_con_observaciones', label: `Con observaciones (${batch.warning_rows})` },
            { filter: 'duplicado_probable', label: `Duplicados (${batch.duplicate_rows})` },
            { filter: 'error', label: `Errores (${batch.error_rows})` },
          ].map((item) => {
            const isActive = selectedFilter === item.filter;
            const href = `/admin/efemerides/importaciones/${id}?estado=${item.filter}`;
            return (
              <Link
                key={item.filter}
                href={href}
                className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider font-mono border transition-all duration-200 ${
                  isActive
                    ? 'bg-earth-red text-white border-earth-red shadow-sm'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Rows list */}
      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            Error al consultar las filas de validación.
          </p>
        </div>
      ) : count === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay filas que coincidan con el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 border-collapse font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 text-center w-[70px]">Fila #</th>
                    <th className="p-4 w-[160px]">Validación</th>
                    <th className="p-4 w-[120px]">Ejecución</th>
                    <th className="p-4 min-w-[200px]">Título / Identificador</th>
                    <th className="p-4">Slug Propuesto</th>
                    <th className="p-4">Errores y Advertencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {rows.map((r: any) => {
                    const valLabel = ROW_STATUS_LABELS[r.validation_status] || {
                      text: r.validation_status,
                      classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                    };
                    const exeLabel = EXECUTION_STATUS_LABELS[r.execution_status] || {
                      text: r.execution_status,
                      classes: 'bg-stone-50 text-stone-500 border-stone-200',
                    };

                    const errors = r.validation_messages?.errors || [];
                    const warnings = r.validation_messages?.warnings || [];

                    return (
                      <tr key={r.id} className="hover:bg-stone-50/50 transition-colors duration-150 align-top">
                        <td className="p-4 text-center font-mono font-medium text-stone-500">
                          {r.row_number}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${valLabel.classes}`}>
                            {valLabel.text}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${exeLabel.classes}`}>
                            {exeLabel.text}
                          </span>
                        </td>
                        <td className="p-4 font-serif font-bold text-sm text-charcoal">
                          {getRowTitle(r)}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-stone-400 select-all">
                          {r.proposed_slug || '-'}
                        </td>
                        <td className="p-4 font-mono text-[10px]">
                          <div className="flex flex-col gap-1">
                            {errors.map((err: string, i: number) => (
                              <span key={`err-${i}`} className="text-red-600 font-bold block">
                                • [Error] {err}
                              </span>
                            ))}
                            {warnings.map((warn: string, i: number) => (
                              <span key={`warn-${i}`} className="text-amber-700 block">
                                • [Aviso] {warn}
                              </span>
                            ))}
                            {errors.length === 0 && warnings.length === 0 && (
                              <span className="text-emerald-700 italic block">Sin observaciones</span>
                            )}
                          </div>
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
                Página {page} de {totalPages} ({count} filas encontradas)
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={`/admin/efemerides/importaciones/${id}?estado=${selectedFilter}&page=${page - 1}`}
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
                    href={`/admin/efemerides/importaciones/${id}?estado=${selectedFilter}&page=${page + 1}`}
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
