'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { revertEphemeridesImportAction } from '../../../app/admin/efemerides/importar/actions';

interface RevertImportBatchPanelProps {
  batchId: string;
  status: string;
  importedRows: number;
  skippedRows: number;
  summaryReport?: any;
}

export default function RevertImportBatchPanel({
  batchId,
  status,
  importedRows,
  skippedRows,
  summaryReport
}: RevertImportBatchPanelProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    revertedRows: number;
    manualReviewRows: number;
    status: string;
  } | null>(null);

  // Reversion is allowed only if batch was executed and finished as completed or completed_with_observations
  const isEligible = status === 'completed' || status === 'completed_with_observations';

  const handleRevert = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await revertEphemeridesImportAction(batchId);
      if (res.success && res.data) {
        setSuccessResult({
          revertedRows: res.data.reverted_rows,
          manualReviewRows: res.data.manual_review_rows,
          status: res.data.status
        });
        setShowConfirm(false);
        // Refresh server component state
        router.refresh();
      } else {
        setError(res.error || 'Ocurrió un error inesperado al revertir el lote.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render results if already reverted or partially reverted
  if (status === 'reverted' || status === 'partially_reverted' || successResult) {
    const finalReverted = successResult 
      ? successResult.revertedRows 
      : (summaryReport?.reverted_rows ?? importedRows);
    
    const finalManual = successResult 
      ? successResult.manualReviewRows 
      : (summaryReport?.manual_review_rows ?? 0);
      
    const finalStatus = successResult ? successResult.status : status;

    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 flex flex-col gap-3 shadow-xs font-mono">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-purple-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="font-serif font-bold text-sm text-purple-950">
            Lote Revertido
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/40 border border-purple-100 p-3.5 rounded text-xs text-purple-900">
          <div>
            <span className="block text-[10px] text-purple-700 uppercase font-bold">Estado de Reversión:</span>
            <span className="font-bold">
              {finalStatus === 'reverted' ? 'Revertido Completo' : 'Revertido Parcial (Requiere Revisión)'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-purple-700 uppercase font-bold">Filas Archivadas:</span>
            <span className="font-bold">{finalReverted} filas</span>
          </div>
          {finalStatus === 'partially_reverted' && (
            <div>
              <span className="block text-[10px] text-purple-700 uppercase font-bold">Revisión Manual:</span>
              <span className="font-bold text-earth-red">{finalManual} filas</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/admin/efemerides"
            className="inline-flex items-center px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-bold tracking-wider uppercase transition-colors duration-150 shadow-xs"
          >
            Volver a efemérides
          </Link>
          <span className="text-[10px] text-purple-700">
            {finalStatus === 'partially_reverted' 
              ? '* Las filas marcadas en revisión manual conservan sus contenidos debido a modificaciones posteriores.' 
              : '* Todos los contenidos elegibles se archivaron de manera lógica y segura.'}
          </span>
        </div>
      </div>
    );
  }

  // Render nothing if batch status is not completed/completed_with_observations (validated, reverting, etc.)
  if (!isEligible) {
    return null;
  }

  return (
    <div className="bg-white border border-stone-250 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="font-serif font-bold text-sm text-charcoal">
              Reversión de Lote Importado
            </h3>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed font-mono">
            Este lote fue ejecutado anteriormente. Puede archivar lógicamente las efemérides creadas siempre que no hayan tenido modificaciones editoriales posteriores, asignaciones o vínculos multimedia.
          </p>
        </div>

        {!showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-150 shadow-sm"
          >
            Revertir importación
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
              Advertencia de Reversión Conservadora
            </h4>
            <ul className="list-disc pl-4 text-xs text-amber-900 leading-relaxed font-mono flex flex-col gap-1">
              <li>Se evaluarán las <strong>{importedRows} filas</strong> importadas del lote.</li>
              <li>La reversión archivará únicamente aquellos contenidos que sigan en estado borrador y no posean intervención editorial posterior (sin cambios, sin asignaciones y sin archivos adjuntos).</li>
              <li>Los contenidos editados, asignados o con relaciones multimedia <strong>no serán eliminados ni modificados</strong>, y se marcarán como <strong>Revisión Manual</strong> para resguardo de la labor editorial.</li>
              <li><strong>No se realizará borrado físico</strong>; los contenidos seguros pasarán al estado <strong>Archivado</strong> y se creará una versión de auditoría.</li>
              <li>El lote finalizará en estado <strong>reverted</strong> o <strong>partially_reverted</strong> (si posee ítems en revisión manual).</li>
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

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={handleRevert}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-stone-300 text-white rounded text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Revirtiendo...
                </>
              ) : (
                'Confirmar reversión'
              )}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setError(null);
              }}
              disabled={isLoading}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 disabled:opacity-50 text-stone-700 rounded text-xs font-bold uppercase tracking-wider transition-all duration-150"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
