'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminContentDetail } from '../../../lib/admin/admin-content';
import { updateContentAction, restoreContentVersionAction } from '../../../app/admin/contenidos/actions';

interface EditContentFormProps {
  content: AdminContentDetail;
  versions: any[];
}

export default function EditContentForm({ content, versions }: EditContentFormProps) {
  const router = useRouter();
  
  // Helper to format date into YYYY-MM-DD
  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Helper to format ISO date-time into YYYY-MM-DDTHH:MM for datetime-local input
  const formatDateTimeForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  // Form states
  const [title, setTitle] = useState(content.title);
  const [subtitle, setSubtitle] = useState(content.subtitle || '');
  const [summary, setSummary] = useState(content.summary || '');
  const [body, setBody] = useState(content.body || '');
  const [eventDate, setEventDate] = useState(formatDateForInput(content.event_date));
  const [sourceReference, setSourceReference] = useState(content.source_reference || '');
  const [status, setStatus] = useState(content.status);
  const [visibility, setVisibility] = useState(content.visibility);
  const [publishDate, setPublishDate] = useState(formatDateTimeForInput(content.publish_date));
  const [isFeatured, setIsFeatured] = useState(content.is_featured);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restoration states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedVersionToRestore, setSelectedVersionToRestore] = useState<any | null>(null);

  // Derive status
  const isScheduled = status === 'published' && publishDate && new Date(publishDate).getTime() > Date.now();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('El título es obligatorio y no puede consistir solo de espacios vacíos.');
      return;
    }
    if (cleanTitle.length > 180) {
      setErrorMsg('El título supera el límite de 180 caracteres.');
      return;
    }
    if (subtitle.trim().length > 240) {
      setErrorMsg('El subtítulo supera el límite de 240 caracteres.');
      return;
    }
    if (summary.trim().length > 1000) {
      setErrorMsg('El resumen supera el límite de 1.000 caracteres.');
      return;
    }

    setLoading(true);

    const updatedData = {
      title: cleanTitle,
      subtitle: subtitle.trim() || null,
      summary: summary.trim() || null,
      body: body.trim() || null,
      event_date: eventDate || null,
      source_reference: sourceReference.trim() || null,
      status,
      visibility,
      publish_date: publishDate ? new Date(publishDate).toISOString() : null,
      is_featured: isFeatured,
    };

    try {
      const res = await updateContentAction(content.id, updatedData);
      if (res.success) {
        window.location.assign('/admin/contenidos?guardado=1');
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al intentar guardar los cambios.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
      setLoading(false);
    }
  };

  const handleConfirmRestore = (version: any) => {
    setSelectedVersionToRestore(version);
    setShowRestoreModal(true);
  };

  const executeRestore = async () => {
    if (!selectedVersionToRestore) return;
    setLoading(true);
    setShowRestoreModal(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await restoreContentVersionAction(selectedVersionToRestore.id, content.id);
      if (res.success) {
        window.location.assign(`/admin/contenidos/${content.id}/editar?guardado=1`);
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al restaurar la versión.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al restaurar la versión.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Alert Banner for Admin Info */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md flex flex-col gap-2">
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
          Gestión Editorial Avanzada
        </p>
        <p className="text-[11px] text-amber-850 font-serif">
          El versionado de cambios y la programación horaria de publicación están activos. Antes de cada guardado o restauración se guardará un snapshot automático.
        </p>
      </div>

      {/* Success and Error Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            {successMsg}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            Error: {errorMsg}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        
        {/* Status Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-beige/65">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Estado actual:
            </span>
            {isScheduled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                🕒 Programada
              </span>
            ) : status === 'published' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                🟢 Publicado
              </span>
            ) : status === 'review' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                🟡 En revisión
              </span>
            ) : status === 'rejected' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 font-mono">
                🔴 Rechazado
              </span>
            ) : status === 'archived' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                ⚫ Archivado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200 font-mono">
                📝 Borrador
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Title input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="title" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Título
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Subtitle input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="subtitle" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Subtítulo
            </label>
            <input
              id="subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Slug (Read Only) */}
          <div className="flex flex-col gap-1.5 font-mono">
            <label htmlFor="slug" className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Slug (Bloqueado)
            </label>
            <input
              id="slug"
              type="text"
              disabled
              value={content.slug}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-stone-400 rounded-md text-sm cursor-not-allowed"
            />
          </div>

          {/* Event Date input */}
          <div className="flex flex-col gap-1.5 font-mono">
            <label htmlFor="eventDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fecha del Hito (Efeméride)
            </label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Status select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Estado
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          {/* Visibility select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visibility" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Visibilidad
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              <option value="public">Público</option>
              <option value="subscribers">Suscriptores</option>
              <option value="institutional">Institucional</option>
              <option value="private">Privado</option>
            </select>
          </div>

          {/* Programmed Publication Date input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="publishDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Programar publicación (Fecha y hora)
            </label>
            <input
              id="publishDate"
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            />
            <span className="text-[10px] text-stone-400 font-mono">
              Deje en blanco para publicación inmediata al marcar como 'Publicado'. Si define una fecha futura, permanecerá programado.
            </span>
          </div>

          {/* Warning for Scheduled Publication */}
          {isScheduled && (
            <div className="md:col-span-2 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md mt-1 flex flex-col gap-1">
              <h5 className="text-xs font-bold text-blue-800 font-mono uppercase tracking-wider">
                Publicación programada
              </h5>
              <p className="text-xs text-blue-750 font-serif leading-relaxed">
                La nota será visible públicamente en la fecha indicada.
              </p>
            </div>
          )}

          {/* Featured checkbox */}
          <div className="flex items-center gap-2 md:col-span-2 pt-2">
            <input
              id="isFeatured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 text-earth-red focus:ring-earth-red border-stone-300 rounded cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-stone-700 select-none cursor-pointer">
              Destacar este contenido en la portada principal
            </label>
          </div>

          {/* Source Reference input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="sourceReference" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Referencia de la Fuente (Libro, Edición, etc.)
            </label>
            <input
              id="sourceReference"
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              disabled={loading}
              placeholder="Ej. Libro: Conozca Salta a través de sus Efemérides"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Summary textarea */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="summary" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Resumen
            </label>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 resize-y"
            />
          </div>

          {/* Body textarea */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="body" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Cuerpo del Contenido
            </label>
            <textarea
              id="body"
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono resize-y"
            />
          </div>

        </div>

        {/* Buttons Action Group */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-beige/80">
          
          <Link
            href="/admin/contenidos"
            className="inline-flex items-center justify-center px-5 py-3 border border-stone-300 text-stone-700 text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-50 transition-colors duration-200 font-mono"
          >
            &larr; Volver al listado
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200 font-mono"
          >
            {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>

        </div>

      </form>

      {/* Historial Editorial Section */}
      <div className="bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <div className="border-b border-stone-beige pb-3">
          <h3 className="text-lg font-serif font-black text-charcoal">
            Historial editorial
          </h3>
          <p className="text-xs text-stone-500 font-mono mt-0.5">
            Registro de versiones guardadas y copias de seguridad de este contenido.
          </p>
        </div>

        {versions.length === 0 ? (
          <p className="text-xs text-stone-500 italic font-serif">
            No hay versiones registradas para este contenido todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {versions.map((ver, idx) => (
              <div
                key={ver.id}
                className={`p-4 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                  idx === 0
                    ? 'bg-stone-50 border-stone-beige'
                    : 'bg-warm-white/40 border-stone-beige/50 hover:border-stone-beige'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-earth-red">
                      Versión {ver.version_number}
                    </span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-600 bg-stone-beige/50 px-2 py-0.5 rounded border border-stone-beige font-mono">
                        Versión actual
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400 font-mono">
                      • Guardado por: <strong>{ver.created_by}</strong>
                    </span>
                  </div>

                  {ver.change_summary && (
                    <p className="text-xs font-serif text-stone-700 italic">
                      "{ver.change_summary}"
                    </p>
                  )}

                  <div className="text-[10px] text-stone-500 font-mono">
                    Fecha: {new Date(ver.created_at).toLocaleString('es-AR')} • Estado:{' '}
                    <span className="uppercase font-bold">{ver.status}</span> • Visibilidad:{' '}
                    <span className="uppercase">{ver.visibility}</span>
                  </div>
                </div>

                {idx !== 0 && (
                  <div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleConfirmRestore(ver)}
                      className="px-4 py-2 border border-stone-300 hover:border-earth-red hover:text-earth-red text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                    >
                      Restaurar esta versión
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog / Modal for Restoration */}
      {showRestoreModal && selectedVersionToRestore && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-beige rounded-lg shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
            <h4 className="text-base font-serif font-black text-charcoal">
              ¿Confirmar restauración de versión?
            </h4>
            <div className="text-xs text-stone-600 leading-relaxed font-serif flex flex-col gap-2.5">
              <p>
                Está a punto de restaurar la <strong>Versión {selectedVersionToRestore.version_number}</strong> de este contenido:
              </p>
              <ul className="list-disc pl-5 font-sans text-[11px] text-stone-500 flex flex-col gap-1">
                <li>Título: "{selectedVersionToRestore.title}"</li>
                <li>Estado: {selectedVersionToRestore.status}</li>
                <li>Visibilidad: {selectedVersionToRestore.visibility}</li>
              </ul>
              <p className="bg-amber-50 text-amber-800 border-l-2 border-amber-500 p-2.5 rounded-sm text-[11px] font-mono">
                <strong>Importante:</strong> Se conservará una copia de la versión actual antes de restaurar.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-stone-beige/65">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedVersionToRestore(null);
                }}
                className="px-4 py-2 border border-stone-300 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded font-mono hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRestore}
                className="px-4 py-2 bg-earth-red text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono hover:bg-earth-red/90"
              >
                Confirmar restauración
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
