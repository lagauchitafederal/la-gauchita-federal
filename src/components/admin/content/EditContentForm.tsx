'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminContentDetail } from '../../../lib/admin/admin-content';
import { updateContentAction } from '../../../app/admin/contenidos/actions';

interface EditContentFormProps {
  content: AdminContentDetail;
}

export default function EditContentForm({ content }: EditContentFormProps) {
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

  // Form states
  const [title, setTitle] = useState(content.title);
  const [subtitle, setSubtitle] = useState(content.subtitle || '');
  const [summary, setSummary] = useState(content.summary || '');
  const [body, setBody] = useState(content.body || '');
  const [eventDate, setEventDate] = useState(formatDateForInput(content.event_date));
  const [sourceReference, setSourceReference] = useState(content.source_reference || '');
  const [status, setStatus] = useState(content.status);
  const [visibility, setVisibility] = useState(content.visibility);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const updatedData = {
      title,
      subtitle: subtitle.trim() || null,
      summary: summary.trim() || null,
      body: body.trim() || null,
      event_date: eventDate || null,
      source_reference: sourceReference.trim() || null,
      status,
      visibility,
    };

    try {
      const res = await updateContentAction(content.id, updatedData);
      if (res.success) {
        // Redirigir al listado con el parámetro de éxito
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

  return (
    <div className="flex flex-col gap-6">
      
      {/* Alert Banner for Admin Info */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
          Edición inicial. Las relaciones, el slug y los archivos asociados se administrarán en una etapa posterior.
        </p>
      </div>

      {/* Success and Error Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md flex flex-col gap-1">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            {successMsg}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md flex flex-col gap-1">
          <p className="text-xs text-red-800 font-bold font-mono">
            Error: {errorMsg}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Slug (Bloqueado)
            </label>
            <input
              id="slug"
              type="text"
              disabled
              value={content.slug}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-stone-400 rounded-md text-sm cursor-not-allowed font-mono"
            />
          </div>

          {/* Event Date input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="eventDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fecha del Hito (Efeméride)
            </label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
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
            <span className="text-[10px] text-stone-400 font-mono">
              El estado editorial determina si el contenido se encuentra en preparación, revisión o publicación.
            </span>
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
            className="inline-flex items-center justify-center px-6 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>

        </div>

      </form>
    </div>
  );
}
