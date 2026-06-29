'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { executeEphemeridesImportAction } from '../../../app/admin/efemerides/importar/actions';

interface ExecuteImportBatchPanelProps {
  batchId: string;
  status: string;
  validRows: number;
  warningRows: number;
  duplicateRows: number;
  errorRows: number;
  importedRows: number;
  skippedRows: number;
}

export default function ExecuteImportBatchPanel({
  batchId,
  status,
  validRows,
  warningRows,
  duplicateRows,
  errorRows,
  importedRows,
  skippedRows
}: ExecuteImportBatchPanelProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    imported: number;
    skipped: number;
    status: string;
  } | null>(null);

  // Checks if the status is eligible for execution (only 'validated' is allowed)
  const isEligible = status === 'validated';
  
  // Total counts
  const totalEligible = validRows + warningRows;
  const totalExcluded = duplicateRows + errorRows;

  const handleExecute = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await executeEphemeridesImportAction(batchId);
      if (res.success && res.data) {
        setSuccessResult({
          imported: res.data.imported_rows,
          skipped: res.data.skipped_rows,
          status: res.data.status
        });
        setShowConfirm(false);
        // Refresh server component state
        router.refresh();
      } else {
        setError(res.error || 'Ocurrió un error inesperado al procesar el lote.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render executed batch details if completed or success result is available
  if (status === 'completed' || status === 'completed_with_observations' || successResult) {
    const finalImported = successResult ? successResult.imported : importedRows;
    const finalSkipped = successResult ? successResult.skipped : skippedRows;
    const finalStatus = successResult ? successResult.status : status;

    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-serif font-bold text-sm text-emerald-950">
            Lote Ejecutado con Éxito
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/40 border border-emerald-100 p-3.5 rounded font-mono text-xs text-emerald-900">
          <div>
            <span className="block text-[10px] text-emerald-700 uppercase font-bold">Estado Final:</span>
            <span className="font-bold">{finalStatus === 'completed' ? 'Completado' : 'Completado con Observaciones'}</span>
          </div>
          <div>
            <span className="block text-[10px] text-emerald-700 uppercase font-bold">Efemérides Importadas:</span>
            <span className="font-bold">{finalImported} filas</span>
          </div>
          <div>
            <span className="block text-[10px] text-emerald-700 uppercase font-bold">Filas Omitidas:</span>
            <span className="font-bold">{finalSkipped} filas</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/admin/efemerides?estado=draft"
            className="inline-flex items-center px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-mono font-bold tracking-wider uppercase transition-colors duration-150 shadow-xs"
          >
            Ver efemérides en borrador
          </Link>
          <span className="text-[10px] text-emerald-700 font-mono">
            * Los contenidos se guardaron como borradores para revisión editorial.
          </span>
        </div>
      </div>
    );
  }

  // Render nothing if batch is not eligible for execution (failed, reverting, etc.)
  if (!isEligible) {
    return null;
  }

  return (
    <div className="bg-white border border-stone-250 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-earth-red animate-pulse shrink-0" />
            <h3 className="font-serif font-bold text-sm text-charcoal">
              Ejecución de Lote Pendiente
            </h3>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed font-mono">
            Este lote se encuentra validado y listo para ser persistido. Se importarán <strong className="text-stone-700">{totalEligible} filas</strong> y se omitirán <strong className="text-stone-700">{totalExcluded} filas</strong> (duplicados y errores).
          </p>
        </div>
        
        {!showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-earth-red hover:bg-earth-red/90 text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-150 shadow-sm"
          >
            Ejecutar importación
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="border-t border-stone-200 pt-4 flex flex-col gap-4 bg-stone-50/50 -mx-5 -mb-5 p-5 rounded-b-lg">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded flex flex-col gap-2">
            <h4 className="font-serif font-bold text-xs text-amber-950 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Confirmación de Importación Masiva
            </h4>
            <ul className="list-disc pl-4 text-xs text-amber-900 leading-relaxed font-mono flex flex-col gap-1">
              <li>Se crearán exactamente <strong>{totalEligible}</strong> efemérides en la base de datos.</li>
              <li>Se omitirán <strong>{totalExcluded}</strong> filas que poseen observaciones graves o duplicados probables.</li>
              <li>Los contenidos se guardarán en estado <strong>Borrador (Draft)</strong> y visibilidad <strong>Pública</strong>.</li>
              <li><strong>No habrá publicación automática</strong>; un editor debe aprobarlas y publicarlas posteriormente.</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded flex gap-2.5">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-700 font-mono">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="px-4 py-2 bg-earth-red hover:bg-earth-red/90 disabled:bg-stone-300 text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </>
              ) : (
                'Confirmar ejecución'
              )}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setError(null);
              }}
              disabled={isLoading}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 disabled:opacity-50 text-stone-700 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
