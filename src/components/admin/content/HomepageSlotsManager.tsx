'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  assignHomepageSlotAction,
  deactivateHomepageSlotAction,
  searchEligibleContentsAction
} from '../../../app/admin/portada/actions';

interface Province {
  id: string;
  name: string;
  code: string;
}

interface HomepageSlot {
  id: string;
  slot_code: 'lead_story' | 'featured_1' | 'featured_2' | 'featured_3' | 'featured_4';
  content_id: string;
  province_id: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  assigned_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
  content_title?: string;
  content_slug?: string;
  content_status?: string;
  content_visibility?: string;
  content_publish_date?: string | null;
  content_province_id?: string | null;
  content_municipality_id?: string | null;
  content_type_code?: string;
  content_type_name?: string;
  assigned_by_name?: string;
  province_name?: string;
}

interface HomepageSlotsManagerProps {
  initialSlots: HomepageSlot[];
  provinces: Province[];
}

const SLOT_CONFIGS = [
  { code: 'lead_story', label: 'Nota principal', description: 'Historia destacada que encabeza la portada.' },
  { code: 'featured_1', label: 'Destacada 1', description: 'Primer bloque destacado secundario.' },
  { code: 'featured_2', label: 'Destacada 2', description: 'Segundo bloque destacado secundario.' },
  { code: 'featured_3', label: 'Destacada 3', description: 'Tercer bloque destacado secundario.' },
  { code: 'featured_4', label: 'Destacada 4', description: 'Cuarto bloque destacado secundario.' }
] as const;

export default function HomepageSlotsManager({
  initialSlots,
  provinces
}: HomepageSlotsManagerProps) {
  const router = useRouter();

  // State
  const [slots, setSlots] = useState<HomepageSlot[]>(initialSlots);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

  // Form / Modal State for Assignment
  const [assigningSlotCode, setAssigningSlotCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // Status Alerts
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync slots when initialSlots prop changes (due to router.refresh)
  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  // Search content trigger
  useEffect(() => {
    if (!assigningSlotCode) return;
    
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const results = await searchEligibleContentsAction(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching contents:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, assigningSlotCode]);

  const handleDeactivateSlot = async (slotId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deactivateHomepageSlotAction(slotId);
      if (res.success) {
        setSuccessMsg('Posición quitada correctamente. Volverá a la selección automática.');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al quitar la asignación.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssignModal = (slotCode: string) => {
    setAssigningSlotCode(slotCode);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedContent(null);
    setStartsAt('');
    setEndsAt('');
    setShowReplaceConfirm(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCloseAssignModal = () => {
    setAssigningSlotCode(null);
  };

  const handleSelectContent = (content: any) => {
    setSelectedContent(content);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContent || !assigningSlotCode) return;

    // Check if slot has an active assignment to trigger replacement confirmation
    const activeSlot = slots.find(
      s => s.slot_code === assigningSlotCode && 
      s.is_active && 
      (selectedProvinceId ? s.province_id === selectedProvinceId : s.province_id === null)
    );

    if (activeSlot && !showReplaceConfirm) {
      setShowReplaceConfirm(true);
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await assignHomepageSlotAction({
        slot_code: assigningSlotCode as any,
        content_id: selectedContent.id,
        province_id: selectedProvinceId,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null
      });

      if (res.success) {
        setSuccessMsg(`Posición "${SLOT_CONFIGS.find(s => s.code === assigningSlotCode)?.label}" asignada correctamente.`);
        handleCloseAssignModal();
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Error al asignar contenido a la posición.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setActionLoading(false);
      setShowReplaceConfirm(false);
    }
  };

  // Resolve scope label
  const currentScopeName = selectedProvinceId 
    ? provinces.find(p => p.id === selectedProvinceId)?.name || 'Provincial'
    : 'Federal';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            {successMsg}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-250 p-4 rounded-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            Error: {errorMsg}
          </p>
        </div>
      )}

      {/* Scope Selector Control Bar */}
      <div className="bg-white border border-stone-beige rounded-lg p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 font-mono">
            Ámbito Territorial Seleccionado
          </span>
          <h3 className="text-sm font-serif font-black text-charcoal flex items-center gap-1.5">
            📍 Alcance actual: <span className="text-earth-red font-sans font-bold">{currentScopeName}</span>
          </h3>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-mono text-stone-600 uppercase shrink-0">Cambiar ámbito:</span>
          <select
            value={selectedProvinceId || ''}
            onChange={(e) => setSelectedProvinceId(e.target.value ? e.target.value : null)}
            className="w-full md:w-64 px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono bg-white"
          >
            <option value="">Nacional / Federal</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                Provincia: {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slots Layout Grid List */}
      <div className="flex flex-col gap-6">
        {SLOT_CONFIGS.map((slotConfig) => {
          // Find if there is an active slot for the current scope
          const activeSlot = slots.find(
            s => s.slot_code === slotConfig.code && 
            s.is_active && 
            (selectedProvinceId ? s.province_id === selectedProvinceId : s.province_id === null)
          );

          return (
            <div
              key={slotConfig.code}
              className={`p-6 bg-white border rounded-lg shadow-sm flex flex-col md:flex-row gap-6 justify-between items-stretch transition-all duration-200 ${
                activeSlot 
                  ? 'border-muted-amber/60 bg-warm-white/10' 
                  : 'border-stone-beige/80 bg-white'
              }`}
            >
              {/* Left Slot info */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-stone-beige/40 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif font-black text-base text-charcoal">
                      {slotConfig.label}
                    </h4>
                    {activeSlot ? (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-earth-red/5 text-earth-red border border-earth-red/15 font-mono">
                        Asignación vigente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 border border-stone-200 font-mono">
                        Selección automática
                      </span>
                    )}
                  </div>
                  
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                    {slotConfig.code}
                  </span>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  {slotConfig.description}
                </p>

                {/* Display Current Selection */}
                {activeSlot ? (
                  <div className="mt-2 p-4 bg-[#fcf8f2] border border-stone-beige/80 rounded-md flex flex-col gap-2">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-earth-red">
                        Prioridad editorial ({currentScopeName})
                      </span>
                      <span className="text-[9px] text-stone-450 font-mono">
                        Por: {activeSlot.assigned_by_name}
                      </span>
                    </div>

                    <h5 className="font-serif font-bold text-sm text-charcoal leading-snug">
                      {activeSlot.content_title}
                    </h5>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-stone-500 mt-1">
                      {activeSlot.content_publish_date && (
                        <span>Publicado el: {new Date(activeSlot.content_publish_date).toLocaleDateString('es-AR')}</span>
                      )}
                      <span>Tipo: {activeSlot.content_type_name || 'Contenido'}</span>
                    </div>

                    {/* Programmed dates display */}
                    {(activeSlot.starts_at || activeSlot.ends_at) && (
                      <div className="border-t border-stone-beige/40 pt-2 mt-1 flex flex-col gap-0.5 text-[9px] font-mono text-stone-500">
                        {activeSlot.starts_at && (
                          <span>Inicio de visibilidad: <strong>{new Date(activeSlot.starts_at).toLocaleString('es-AR')}</strong></span>
                        )}
                        {activeSlot.ends_at && (
                          <span>Fin de visibilidad: <strong>{new Date(activeSlot.ends_at).toLocaleString('es-AR')}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-stone-50 border border-stone-200/50 border-dashed rounded-md text-center">
                    <p className="text-[11px] italic font-serif text-stone-500">
                      Esta posición volverá a la selección automática si no hay una asignación activa.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Slot actions */}
              <div className="flex flex-col justify-center items-start md:items-end gap-2.5 shrink-0">
                {activeSlot ? (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleDeactivateSlot(activeSlot.id)}
                      className="w-full md:w-auto px-4 py-2 border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-200"
                    >
                      Quitar posición
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleOpenAssignModal(slotConfig.code)}
                      className="w-full md:w-auto px-4 py-2 bg-charcoal hover:bg-charcoal/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-200"
                    >
                      Reemplazar...
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleOpenAssignModal(slotConfig.code)}
                    className="w-full md:w-auto px-4 py-2.5 bg-earth-red hover:bg-earth-red/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-200"
                  >
                    Asignar contenido...
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment Modal Dialog */}
      {assigningSlotCode && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-beige rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-beige flex justify-between items-center shrink-0">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-serif font-black text-charcoal">
                  Asignar a: {SLOT_CONFIGS.find(s => s.code === assigningSlotCode)?.label}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider text-earth-red font-mono">
                  Ámbito: {currentScopeName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="text-stone-400 hover:text-charcoal font-sans text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-5">
              
              {/* Replacement confirmation alert */}
              {showReplaceConfirm && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex flex-col gap-2 shrink-0">
                  <span className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
                    Confirmación de Reemplazo
                  </span>
                  <p className="text-[11px] text-stone-700 leading-relaxed font-serif">
                    Ya existe una asignación activa en esta posición para el ámbito territorial actual. Al proceder, la asignación anterior será desactivada automáticamente y guardada en el historial. ¿Desea confirmar el reemplazo?
                  </p>
                  <div className="flex gap-3 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setShowReplaceConfirm(false)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold text-stone-500 hover:underline"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-mono font-bold transition-colors"
                    >
                      Sí, reemplazar
                    </button>
                  </div>
                </div>
              )}

              {!showReplaceConfirm && (
                <>
                  {/* Step 1: Content search */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="searchQuery" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                      Buscar contenido publicado
                    </label>
                    <input
                      id="searchQuery"
                      type="text"
                      placeholder="Ingrese parte del título para buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono"
                    />
                    <span className="text-[9px] text-stone-400 italic">
                      Se muestran contenidos públicos con publish_date menor o igual a hoy.
                    </span>
                  </div>

                  {/* Search Results list box */}
                  <div className="flex flex-col gap-2 flex-grow max-h-[160px] overflow-y-auto border border-stone-200 rounded p-2.5 bg-stone-50">
                    {searchLoading ? (
                      <p className="text-xs text-stone-500 italic font-mono p-4 text-center">Buscando contenidos...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-xs text-stone-400 italic font-mono p-4 text-center">
                        {searchQuery.trim().length >= 2 
                          ? 'No se encontraron contenidos elegibles.' 
                          : 'Escriba al menos 2 caracteres para buscar...'}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {searchResults.map((content) => {
                          const isSelected = selectedContent?.id === content.id;
                          return (
                            <button
                              key={content.id}
                              type="button"
                              onClick={() => handleSelectContent(content)}
                              className={`w-full text-left p-2.5 rounded border text-xs flex flex-col gap-1.5 transition-all ${
                                isSelected 
                                  ? 'border-earth-red bg-earth-red/5 font-bold' 
                                  : 'border-stone-200 hover:border-stone-400 bg-white'
                              }`}
                            >
                              <span className="font-semibold text-charcoal">{content.title}</span>
                              <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
                                <span>📍 Ámbito: {content.province_name}</span>
                                <span>Publicación: {new Date(content.publish_date).toLocaleDateString('es-AR')}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Content details confirmation */}
                  {selectedContent && (
                    <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-md text-xs flex flex-col gap-1 shrink-0">
                      <span className="font-bold text-emerald-800">Contenido seleccionado:</span>
                      <p className="font-serif font-bold text-stone-800">{selectedContent.title}</p>
                    </div>
                  )}

                  {/* Step 2: Temporal scheduling options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-beige/40 shrink-0">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="startsAt" className="text-[9px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                        Inicio programado (Opcional)
                      </label>
                      <input
                        id="startsAt"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red bg-white font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="endsAt" className="text-[9px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                        Final programado (Opcional)
                      </label>
                      <input
                        id="endsAt"
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Modal Footer buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-beige mt-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleCloseAssignModal}
                      className="px-4 py-2 border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !selectedContent}
                      className="px-5 py-2 bg-charcoal hover:bg-charcoal/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Procesando...' : 'Asignar Tarea'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
