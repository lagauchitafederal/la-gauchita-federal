'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  searchAvailableEntitiesAction,
  createEditorialRelationAction,
  updateEditorialRelationAction,
  deleteEditorialRelationAction
} from '../../../app/admin/editorial-relations/actions';
import { EditorialRelationWithDetail } from '../../../lib/admin/admin-editorial-relations';

interface EditorialRelationsManagerProps {
  entityType: string; // 'person' | 'content'
  entityId: string;   // UUID
  initialRelations: EditorialRelationWithDetail[];
}

const RELATION_TYPE_LABELS: Record<string, string> = {
  protagonista_de: 'Protagonista de',
  relacionado_con: 'Relacionado con',
  autor_de: 'Autor de',
  mencionado_en: 'Mencionado en',
  vinculado_a_institucion: 'Vinculado a institución',
  reconocimiento_de: 'Reconocimiento de',
  parte_de_coleccion: 'Parte de colección',
  lectura_recomendada: 'Lectura recomendada'
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  content: 'Contenido',
  person: 'Personaje',
  institution: 'Institución',
  recognition: 'Reconocimiento',
  media_asset: 'Archivo'
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  active: { text: 'Activa', classes: 'bg-emerald-50 text-emerald-700 border-emerald-250/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  archived: { text: 'Archivada', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' }
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Público',
  private: 'Privado'
};

export default function EditorialRelationsManager({
  entityType,
  entityId,
  initialRelations
}: EditorialRelationsManagerProps) {
  const [relations, setRelations] = useState<EditorialRelationWithDetail[]>(initialRelations);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Relation Form State
  const [targetType, setTargetType] = useState('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; label: string; slug?: string; contentTypeCode?: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<{ id: string; label: string; slug?: string; contentTypeCode?: string } | null>(null);
  const [relationType, setRelationType] = useState('relacionado_con');
  const [sortOrder, setSortOrder] = useState('0');
  const [status, setStatus] = useState('active');
  const [visibility, setVisibility] = useState('public');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRelationType, setEditRelationType] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editStatus, setEditStatus] = useState('active');
  const [editVisibility, setEditVisibility] = useState('public');

  // Load / Reload relations list
  const reloadRelations = async () => {
    try {
      // Import dynamically or fetch from a client endpoint if needed.
      // But since we want to keep it simple, we can call a Server Action or window.location.reload()
      // or simply maintain local state. We choose to maintain state and sync with Server Actions.
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger search on query change
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      const results = await searchAvailableEntitiesAction(targetType, searchQuery);
      // Filter out self if applicable
      const filtered = results.filter(r => !(targetType === entityType && r.id === entityId));
      setSearchResults(filtered);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, targetType, entityType, entityId]);

  // Adjust recommended relationship type based on entity pairings
  useEffect(() => {
    if (entityType === 'person' && targetType === 'content') {
      if (selectedTarget && selectedTarget.contentTypeCode === 'ephemeris') {
        setRelationType('protagonista_de');
      } else if (selectedTarget && selectedTarget.contentTypeCode && selectedTarget.contentTypeCode !== 'ephemeris') {
        setRelationType('autor_de');
      } else {
        setRelationType('protagonista_de');
      }
    } else if (entityType === 'person' && targetType === 'media_asset') {
      setRelationType('mencionado_en');
    } else if (entityType === 'content' && targetType === 'person') {
      setRelationType('protagonista_de');
    } else if (entityType === 'content' && targetType === 'media_asset') {
      setRelationType('mencionado_en');
    } else if (entityType === 'institution' && targetType === 'recognition') {
      setRelationType('reconocimiento_de');
    } else {
      setRelationType('relacionado_con');
    }
  }, [targetType, entityType, selectedTarget]);

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedTarget) {
      setErrorMsg('Debés seleccionar una entidad relacionada.');
      return;
    }

    setLoading(true);

    const newRelation = {
      source_entity_type: entityType,
      source_entity_id: entityId,
      target_entity_type: targetType,
      target_entity_id: selectedTarget.id,
      relation_type: relationType,
      sort_order: parseInt(sortOrder, 10) || 0,
      status,
      visibility
    };

    try {
      const res = await createEditorialRelationAction(entityType, entityId, newRelation);
      if (res.success) {
        setSuccessMsg('Relación agregada con éxito.');
        // Reset form
        setSelectedTarget(null);
        setSearchQuery('');
        setSortOrder('0');
        setShowAddForm(false);
        
        // Refresh local state by reloading page component or appending locally (quick feedback)
        // Since server cache is revalidated, a reload ensures database consistency
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'Error al agregar la relación.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (rel: EditorialRelationWithDetail) => {
    setEditingId(rel.id);
    setEditRelationType(rel.relation_type);
    setEditSortOrder(rel.sort_order.toString());
    setEditStatus(rel.status);
    setEditVisibility(rel.visibility);
  };

  const handleSaveEdit = async (rel: EditorialRelationWithDetail) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await updateEditorialRelationAction(rel.id, entityType, entityId, {
        relation_type: editRelationType,
        sort_order: parseInt(editSortOrder, 10) || 0,
        status: editStatus,
        visibility: editVisibility,
        target_entity_type: rel.target_entity_type,
        target_entity_id: rel.target_entity_id,
      });

      if (res.success) {
        setSuccessMsg('Relación actualizada con éxito.');
        setEditingId(null);
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'Error al actualizar la relación.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rel: EditorialRelationWithDetail) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar esta relación editorial?')) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await deleteEditorialRelationAction(
        rel.id,
        entityType,
        entityId,
        rel.related_type,
        rel.related_id
      );

      if (res.success) {
        setSuccessMsg('Relación eliminada.');
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'Error al eliminar la relación.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render type icons
  const renderIcon = (type: string) => {
    switch (type) {
      case 'content':
        return (
          <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-blue-200" title="Contenido">
            📖
          </span>
        );
      case 'person':
        return (
          <span className="w-5 h-5 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-red-200" title="Personaje">
            👤
          </span>
        );
      case 'institution':
        return (
          <span className="w-5 h-5 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-amber-200" title="Institución">
            🏛️
          </span>
        );
      case 'recognition':
        return (
          <span className="w-5 h-5 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-purple-200" title="Reconocimiento">
            ⭐
          </span>
        );
      case 'media_asset':
        return (
          <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-emerald-200" title="Archivo">
            🖼️
          </span>
        );
      default:
        return <span>🔗</span>;
    }
  };

  return (
    <div className="bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 flex flex-col gap-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-stone-beige/85 pb-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-lg font-serif font-black text-charcoal">
            Lecturas y referencias vinculadas
          </h3>
          <p className="text-xs text-stone-500 font-mono">
            Vincular este perfil con efemérides, otros personajes, archivos o reconocimientos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setErrorMsg(null);
            setSuccessMsg(null);
            setSelectedTarget(null);
            setSearchQuery('');
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-md hover:bg-stone-850 transition-colors"
        >
          {showAddForm ? 'Cerrar formulario' : 'Vincular contenido'}
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-md text-xs font-mono text-red-800">
          Error: {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 p-3.5 rounded-md text-xs font-mono text-green-800">
          {successMsg}
        </div>
      )}

      {/* Add relationship form */}
      {showAddForm && (
        <form onSubmit={handleAddRelation} className="bg-[#fcf8f2] border border-stone-beige/80 rounded-lg p-5 flex flex-col gap-5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-stone-600 font-mono border-b border-stone-beige/50 pb-2">
            Agregar relación
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Entity Type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="targetType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Tipo de entidad relacionada
              </label>
              <select
                id="targetType"
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setSelectedTarget(null);
                  setSearchQuery('');
                }}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white font-mono"
              >
                <option value="content">Contenido / Efeméride</option>
                <option value="person">Personaje</option>
                <option value="institution">Institución</option>
                <option value="recognition">Reconocimiento</option>
                <option value="media_asset">Archivo Visual</option>
              </select>
            </div>

            {/* Target Entity Search & Selector */}
            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="search" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Buscar entidad por nombre o título
              </label>
              
              {selectedTarget ? (
                <div className="flex items-center justify-between p-2 border border-stone-300 bg-white rounded-md text-sm font-semibold text-charcoal">
                  <span>{selectedTarget.label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="text-xs text-red-600 font-bold hover:underline font-mono"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Escribí al menos dos letras..."
                    disabled={loading}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white"
                  />
                  {/* Results Popover */}
                  {searchResults.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-300 rounded-md shadow-lg z-25 max-h-48 overflow-y-auto divide-y divide-stone-100">
                      {searchResults.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTarget(r);
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 font-medium font-serif"
                          >
                            {r.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Relation Type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="relationType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Tipo de vínculo
              </label>
              <select
                id="relationType"
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white font-mono"
              >
                {Object.entries(RELATION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sortOrder" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Orden editorial
              </label>
              <input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white font-mono"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Estado
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white font-mono"
              >
                <option value="active">Relación activa</option>
                <option value="draft">Borrador</option>
                <option value="archived">Archivada</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="visibility" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Visibilidad
              </label>
              <select
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white font-mono"
              >
                <option value="public">Visible públicamente</option>
                <option value="private">Privado / Interno</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end gap-3 border-t border-stone-beige/40 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-stone-300 text-stone-600 text-xs font-bold font-mono rounded hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-earth-red text-white text-xs font-bold font-mono uppercase tracking-wider rounded hover:bg-earth-red/90 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Relación'}
            </button>
          </div>
        </form>
      )}

      {/* Relations List */}
      {relations.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200/60 rounded-md p-6 text-center">
          <p className="text-xs text-stone-500 italic font-mono">
            No hay relaciones creadas para este perfil / efeméride.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {relations.map((rel) => {
            const isEditing = editingId === rel.id;
            const statusInfo = STATUS_LABELS[rel.status] || { text: rel.status, classes: '' };

            return (
              <div
                key={rel.id}
                className="bg-stone-50 border border-stone-200/80 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Related Entity Block Info */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {renderIcon(rel.related_type)}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                        {ENTITY_TYPE_LABELS[rel.related_type] || rel.related_type}
                      </span>
                      {!isEditing && (
                        <>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border font-mono ${statusInfo.classes}`}>
                            {statusInfo.text}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-stone-200 text-stone-600 border border-stone-300/40 font-mono">
                            {VISIBILITY_LABELS[rel.visibility] || rel.visibility}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="font-serif text-sm font-black text-charcoal">
                      {rel.edit_url ? (
                        <a
                          href={rel.edit_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-earth-red hover:underline"
                        >
                          {rel.related_label}
                        </a>
                      ) : (
                        <span>{rel.related_label}</span>
                      )}
                    </div>

                    {/* Vínculo tipo / sentido */}
                    {!isEditing && (
                      <div className="text-[10px] font-mono text-stone-600">
                        Relación: <strong className="text-earth-red">{RELATION_TYPE_LABELS[rel.relation_type] || rel.relation_type}</strong> | Orden: <strong>{rel.sort_order}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Editing Form */}
                {isEditing ? (
                  <div className="bg-white border border-stone-200 rounded-md p-4 flex flex-wrap gap-4 items-end flex-1 md:flex-initial">
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase text-stone-500 font-mono">Tipo Vínculo</span>
                      <select
                        value={editRelationType}
                        onChange={(e) => setEditRelationType(e.target.value)}
                        className="px-2 py-1 border border-stone-300 rounded text-xs"
                      >
                        {Object.entries(RELATION_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase text-stone-500 font-mono">Orden</span>
                      <input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(e.target.value)}
                        className="w-16 px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase text-stone-500 font-mono">Estado</span>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="px-2 py-1 border border-stone-300 rounded text-xs"
                      >
                        <option value="active">Activa</option>
                        <option value="draft">Borrador</option>
                        <option value="archived">Archivada</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase text-stone-500 font-mono">Visibilidad</span>
                      <select
                        value={editVisibility}
                        onChange={(e) => setEditVisibility(e.target.value)}
                        className="px-2 py-1 border border-stone-300 rounded text-xs"
                      >
                        <option value="public">Público</option>
                        <option value="private">Privado</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 border border-stone-300 text-stone-600 rounded text-xs font-bold font-mono"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(rel)}
                        disabled={loading}
                        className="px-3 py-1 bg-stone-900 text-white rounded text-xs font-bold font-mono"
                      >
                        Guardar
                      </button>
                    </div>

                  </div>
                ) : (
                  // Normal View Buttons Action Group
                  <div className="flex items-center gap-3 font-mono text-[10px] font-bold justify-end whitespace-nowrap self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rel)}
                      className="text-stone-600 hover:text-earth-red border-b border-transparent hover:border-earth-red transition-all"
                    >
                      EDITAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rel)}
                      className="text-red-650 hover:text-red-700 border-b border-transparent hover:border-red-700 transition-all font-bold"
                    >
                      ELIMINAR
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
