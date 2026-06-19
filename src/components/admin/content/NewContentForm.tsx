'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createContentAction } from '../../../app/admin/contenidos/actions';

interface NewContentFormProps {
  contentTypes: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export default function NewContentForm({ contentTypes, categories }: NewContentFormProps) {
  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [contentTypeId, setContentTypeId] = useState(contentTypes[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const newContentData = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      summary: summary.trim() || null,
      body: body.trim() || null,
      content_type_id: contentTypeId,
      category_id: categoryId || null,
      is_featured: isFeatured,
    };

    try {
      const res = await createContentAction(newContentData);
      if (res.success) {
        window.location.href = '/admin/contenidos?creado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al intentar crear el contenido.');
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
          El slug se generará automáticamente a partir del título. Los autores, relaciones territoriales y archivos asociados se administrarán en una etapa posterior.
        </p>
      </div>

      {/* Error Banner */}
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

          {/* Content Type Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contentTypeId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Tipo de Contenido
            </label>
            <select
              id="contentTypeId"
              required
              value={contentTypeId}
              onChange={(e) => setContentTypeId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              {contentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoryId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Categoría
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Is Featured select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="isFeatured" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Destacado
            </label>
            <select
              id="isFeatured"
              value={isFeatured ? 'true' : 'false'}
              onChange={(e) => setIsFeatured(e.target.value === 'true')}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          {/* Spacer to keep layout balanced */}
          <div className="hidden md:block"></div>

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
            {loading ? 'Creando...' : 'Crear'}
          </button>

        </div>

      </form>
    </div>
  );
}
