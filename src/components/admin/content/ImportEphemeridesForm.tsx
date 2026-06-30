'use client';

import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { validateEphemeridesCsvAction, saveEphemeridesImportBatchAction, ValidateCsvResponse } from '../../../app/admin/efemerides/importar/actions';
import { RowValidationResult } from '../../../lib/admin/ephemerides-import/import-validator';

export default function ImportEphemeridesForm() {
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateCsvResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch saving state
  const [batchName, setBatchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null);

  // Table filter state
  const [activeFilter, setActiveFilter] = useState<'todas' | 'valida' | 'observaciones' | 'duplicados' | 'errores'>('todas');
  
  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setValidationResult(null);
    setErrorMsg(null);
    setCurrentPage(1);

    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setErrorMsg('El archivo seleccionado debe ser un archivo CSV.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('El archivo supera el límite de 5 MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0] || null;
    setValidationResult(null);
    setErrorMsg(null);
    setCurrentPage(1);

    if (droppedFile) {
      if (!droppedFile.name.toLowerCase().endsWith('.csv')) {
        setErrorMsg('El archivo seleccionado debe ser un archivo CSV.');
        setFile(null);
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('El archivo supera el límite de 5 MB.');
        setFile(null);
        return;
      }
      setFile(droppedFile);
    }
  };

  // Trigger validation via Server Action
  const handleValidate = () => {
    if (!file) {
      setErrorMsg('No se ha seleccionado ningún archivo.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      startTransition(async () => {
        try {
          const res = await validateEphemeridesCsvAction(text);
          if (res.success) {
            setValidationResult(res);
            if (file) {
              const baseName = file.name.replace(/\.[^/.]+$/, "");
              const dateStr = new Date().toLocaleDateString('es-AR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }).replace(/\//g, '-').replace(',', '');
              setBatchName(`${baseName} (${dateStr})`);
            }
            setSaveSuccess(false);
            setSaveError(null);
            setSavedBatchId(null);
          } else {
            setErrorMsg(res.error || 'Ocurrió un error en la validación.');
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Error de conexión al validar el archivo.');
        }
      });
    };

    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo local.');
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Reset form state
  const handleClear = () => {
    setFile(null);
    setErrorMsg(null);
    setValidationResult(null);
    setCurrentPage(1);
    setSaveSuccess(false);
    setSaveError(null);
    setSavedBatchId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle batch persistence
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult || !validationResult.results) return;

    if (!batchName.trim()) {
      setSaveError('Debe ingresar un nombre para el lote.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await saveEphemeridesImportBatchAction(
        batchName,
        file ? file.name : null,
        validationResult.results
      );

      if (response.success) {
        setSaveSuccess(true);
        setSavedBatchId(response.batchId || null);
      } else {
        setSaveError(response.error || 'Ocurrió un error al guardar el lote.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error de conexión al guardar el lote.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download headers-only CSV template
  const handleDownloadTemplate = () => {
    const headers = 'titulo,fecha_historica,alcance_territorial,resumen,cuerpo,categoria,region,provincia,municipio,fuente,destacado,observaciones';
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_efemerides.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter rows based on active filter state
  const getFilteredRows = (): RowValidationResult[] => {
    if (!validationResult || !validationResult.results) return [];
    
    return validationResult.results.filter((row) => {
      if (activeFilter === 'todas') return true;
      if (activeFilter === 'valida') return row.status === 'valida';
      if (activeFilter === 'observaciones') return row.status === 'valida_con_observaciones';
      if (activeFilter === 'duplicados') return row.status === 'duplicado_probable';
      if (activeFilter === 'errores') return row.status === 'error';
      return true;
    });
  };

  const filteredRows = getFilteredRows();

  // Pagination calculations
  const totalRowsCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRowsCount / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: RowValidationResult['status']) => {
    switch (status) {
      case 'valida':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-250 font-mono">
            Válida
          </span>
        );
      case 'valida_con_observaciones':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-250 font-mono">
            Observaciones
          </span>
        );
      case 'duplicado_probable':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border bg-indigo-50 text-indigo-700 border-indigo-250 font-mono">
            Duplicado
          </span>
        );
      case 'error':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border bg-red-50 text-red-700 border-red-250 font-mono">
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* CSV File Selector Block */}
      <div className="bg-white border border-stone-beige rounded-lg p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
              file ? 'border-emerald-350 bg-emerald-50/10' : 'border-stone-300 hover:border-earth-red bg-stone-50/50'
            }`}
          >
            <svg
              className={`w-10 h-10 ${file ? 'text-emerald-600' : 'text-stone-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>

            {file ? (
              <div className="text-center">
                <p className="text-sm font-bold text-charcoal font-serif">{file.name}</p>
                <p className="text-[11px] text-stone-500 font-mono mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="text-center flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-earth-red hover:underline uppercase tracking-wider font-mono"
                >
                  Arrastrá tu archivo CSV aquí o hacé clic para seleccionar
                </button>
                <p className="text-[10px] text-stone-400 font-mono">
                  Soporta archivos CSV de hasta 5 MB y 1.000 filas.
                </p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-stone-600 hover:text-earth-red border-b border-stone-300 hover:border-earth-red transition-all duration-150 py-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar plantilla CSV
            </button>

            <div className="flex gap-2">
              {file && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isPending}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150 disabled:opacity-50"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={handleValidate}
                disabled={!file || isPending}
                className="px-5 py-2.5 bg-earth-red hover:bg-earth-red/90 disabled:bg-stone-300 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150 shadow-sm disabled:text-stone-500 disabled:shadow-none"
              >
                {isPending ? 'Procesando...' : 'Procesar y validar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex gap-3 shadow-sm">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-red-800 font-mono">Error de validación:</span>
            <p className="text-xs text-red-700 font-mono leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Validation Summary Metrics */}
      {validationResult && validationResult.summary && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs uppercase font-bold tracking-widest text-stone-500 font-mono">
              Resumen de Validación
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white border border-stone-beige p-4 rounded-lg shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Total Filas</span>
                <span className="text-2xl font-serif font-black text-charcoal">{validationResult.summary.totalRows}</span>
              </div>
              <div className="bg-white border border-stone-beige p-4 rounded-lg shadow-sm border-l-4 border-l-emerald-500 flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Válidas</span>
                <span className="text-2xl font-serif font-black text-emerald-700">{validationResult.summary.validRows}</span>
              </div>
              <div className="bg-white border border-stone-beige p-4 rounded-lg shadow-sm border-l-4 border-l-amber-500 flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Observaciones</span>
                <span className="text-2xl font-serif font-black text-amber-700">{validationResult.summary.warningRows}</span>
              </div>
              <div className="bg-white border border-stone-beige p-4 rounded-lg shadow-sm border-l-4 border-l-indigo-500 flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Duplicados</span>
                <span className="text-2xl font-serif font-black text-indigo-700">{validationResult.summary.duplicateRows}</span>
              </div>
              <div className="bg-white border border-stone-beige p-4 rounded-lg shadow-sm border-l-4 border-l-red-500 flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Errores</span>
                <span className="text-2xl font-serif font-black text-red-700">{validationResult.summary.errorRows}</span>
              </div>
            </div>
          </div>

          {/* Batch Saving Block */}
          <div className="bg-white border border-stone-beige rounded-lg p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 border-b border-stone-100 pb-3">
              <h3 className="text-sm font-serif font-black text-charcoal">
                Guardar validación de lote
              </h3>
              <p className="text-xs text-stone-500 font-mono leading-relaxed">
                Podés persistir este análisis de validación como un lote de importación auditable en la base de datos para su posterior ejecución o revisión.
              </p>
            </div>

            {saveSuccess ? (
              <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex gap-2.5 items-start">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-emerald-800 font-mono">¡Validación guardada con éxito!</span>
                    <p className="text-xs text-emerald-750 font-mono leading-relaxed">
                      El lote de importación se registró correctamente con el estado <strong className="font-black font-mono">validated</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-emerald-200/50 pt-3">
                  <p className="text-[11px] text-stone-600 font-mono leading-relaxed">
                    Este lote conserva la validación editorial del archivo CSV. Todavía no incorpora efemérides al catálogo público.
                  </p>
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    {savedBatchId && (
                      <Link
                        href={`/admin/efemerides/importaciones/${savedBatchId}`}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150 shadow-sm"
                      >
                        Ver lote guardado
                      </Link>
                    )}
                    <Link
                      href="/admin/efemerides/importaciones"
                      className="px-4 py-2 border border-emerald-350 hover:bg-emerald-100/30 text-emerald-800 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150"
                    >
                      Validaciones guardadas
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBatch} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="batchNameInput" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                    Nombre lógico del lote:
                  </label>
                  <input
                    id="batchNameInput"
                    type="text"
                    required
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    disabled={isSaving}
                    placeholder="Ej. Importación efemérides Mayo 1810"
                    className="w-full max-w-lg px-3 py-2 text-xs border border-stone-300 rounded font-serif text-charcoal focus:outline-none focus:border-earth-red disabled:opacity-60"
                  />
                </div>

                {saveError && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2.5">
                    <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-red-700 font-mono leading-relaxed">{saveError}</p>
                  </div>
                )}

                {/* Validation summary list */}
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">Resumen de registros a persistir:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wide">Total</span>
                      <span className="text-sm font-serif font-black text-charcoal">{validationResult.summary.totalRows}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wide">Válidas</span>
                      <span className="text-sm font-serif font-black text-emerald-700">{validationResult.summary.validRows}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wide">Observaciones</span>
                      <span className="text-sm font-serif font-black text-amber-700">{validationResult.summary.warningRows}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wide">Duplicados</span>
                      <span className="text-sm font-serif font-black text-indigo-700">{validationResult.summary.duplicateRows}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wide">Errores</span>
                      <span className="text-sm font-serif font-black text-red-700">{validationResult.summary.errorRows}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-stone-100 pt-4 mt-1">
                  <div className="flex items-start gap-2 max-w-xl">
                    <svg className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[11px] text-stone-600 font-mono leading-relaxed font-bold">
                      Este paso guarda la validación editorial del archivo. No incorpora efemérides al catálogo público.
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150 shadow-sm shrink-0 disabled:text-stone-500 disabled:shadow-none"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar validación como lote'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Table Filters and Preview Grid */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Filtrar por estado:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['todas', 'valida', 'observaciones', 'duplicados', 'errores'] as const).map((filter) => {
                  const isActive = activeFilter === filter;
                  let label = 'Todas';
                  let count = validationResult.summary!.totalRows;
                  let activeClasses = 'bg-charcoal text-white border-charcoal';

                  if (filter === 'valida') {
                    label = 'Válidas';
                    count = validationResult.summary!.validRows;
                    activeClasses = 'bg-emerald-700 text-white border-emerald-700';
                  } else if (filter === 'observaciones') {
                    label = 'Observaciones';
                    count = validationResult.summary!.warningRows;
                    activeClasses = 'bg-amber-700 text-white border-amber-700';
                  } else if (filter === 'duplicados') {
                    label = 'Duplicados';
                    count = validationResult.summary!.duplicateRows;
                    activeClasses = 'bg-indigo-700 text-white border-indigo-700';
                  } else if (filter === 'errores') {
                    label = 'Errores';
                    count = validationResult.summary!.errorRows;
                    activeClasses = 'bg-red-700 text-white border-red-700';
                  }

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setActiveFilter(filter);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider font-mono border transition-all duration-150 ${
                        isActive
                          ? `${activeClasses} shadow-sm`
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-16 text-center">Fila</th>
                      <th className="p-3 min-w-[150px]">Título</th>
                      <th className="p-3 w-28">Fecha</th>
                      <th className="p-3 w-32">Territorio</th>
                      <th className="p-3 w-28">Categoría</th>
                      <th className="p-3 w-40">Slug Propuesto</th>
                      <th className="p-3 w-28">Estado</th>
                      <th className="p-3 min-w-[200px]">Detalle de observaciones / errores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-750">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-stone-500 italic font-mono">
                          No se encontraron filas que coincidan con el filtro.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => {
                        const titleText = row.rawData.title || row.normalizedData?.title || '(Sin título)';
                        const truncatedTitle = titleText.length > 60 ? `${titleText.substring(0, 57)}...` : titleText;
                        const dateText = row.rawData.date || row.normalizedData?.event_date || '-';
                        const scopeText = row.rawData.scope || row.normalizedData?.province_id || row.normalizedData?.region_id || 'Nacional';
                        const categoryText = row.rawData.category || '-';
                        const slugText = row.proposedSlug || '-';

                        return (
                          <tr key={row.rowNumber} className="hover:bg-stone-50/40 transition-colors duration-150">
                            <td className="p-3 text-center font-mono font-bold text-stone-500">
                              {row.rowNumber}
                            </td>
                            <td className="p-3 font-serif font-bold text-sm text-charcoal">
                              <span title={titleText}>{truncatedTitle}</span>
                            </td>
                            <td className="p-3 font-mono text-stone-600">
                              {dateText}
                            </td>
                            <td className="p-3 font-mono text-stone-600 uppercase text-[10px]">
                              {scopeText}
                            </td>
                            <td className="p-3 font-mono text-stone-600">
                              {categoryText}
                            </td>
                            <td className="p-3 font-mono text-stone-400 select-all break-all text-[10px]">
                              {slugText}
                            </td>
                            <td className="p-3">
                              {renderStatusBadge(row.status)}
                            </td>
                            <td className="p-3 font-mono text-[11px] leading-normal">
                              {row.errors.length > 0 && (
                                <ul className="list-disc pl-4 text-red-600 flex flex-col gap-0.5">
                                  {row.errors.map((e, idx) => (
                                    <li key={idx}>{e}</li>
                                  ))}
                                </ul>
                              )}
                              {row.warnings.length > 0 && (
                                <ul className="list-disc pl-4 text-amber-700 flex flex-col gap-0.5 mt-0.5">
                                  {row.warnings.map((w, idx) => (
                                    <li key={idx}>{w}</li>
                                  ))}
                                </ul>
                              )}
                              {row.errors.length === 0 && row.warnings.length === 0 && (
                                <span className="text-emerald-700 font-bold">✓ Válida</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-[11px] font-mono font-bold text-stone-500">
                    Página {currentPage} de {totalPages} ({totalRowsCount} filas filtradas)
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Editorial Validation / Import Disclaimer Message */}
            <div className="bg-stone-50 border border-stone-250 p-4 rounded-lg flex gap-3 shadow-sm mt-2">
              <svg className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-stone-600 font-mono leading-relaxed font-bold">
                La importación definitiva se habilitará luego de confirmar esta validación editorial.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
