'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createPublicationAction } from '../../../app/admin/publicaciones/actions';

interface NewPublicationFormProps {
  institutions: Array<{ id: string; name: string; slug: string }>;
  covers: Array<{ id: string; title: string; original_filename: string }>;
  defaultPublisherId: string;
}

export default function NewPublicationForm({
  institutions,
  covers,
  defaultPublisherId,
}: NewPublicationFormProps) {
  // Form states
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [publicationType, setPublicationType] = useState<'book' | 'album' | 'special_work'>('book');
  const [authorText, setAuthorText] = useState('');
  const [publicationYear, setPublicationYear] = useState<number | ''>('');
  const [publisherInstitutionId, setPublisherInstitutionId] = useState(defaultPublisherId);
  const [coverImageAssetId, setCoverImageAssetId] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [status, setStatus] = useState<'draft' | 'review' | 'published' | 'archived' | 'rejected'>('draft');
  const [visibility, setVisibility] = useState<'public' | 'subscribers' | 'institutional' | 'private'>('public');
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('El título es obligatorio.');
      return;
    }
    if (!publicationType) {
      setErrorMsg('El tipo de publicación es obligatorio.');
      return;
    }

    if (publicationYear !== '' && (publicationYear < 1800 || publicationYear > new Date().getFullYear() + 1)) {
      setErrorMsg(`El año de publicación debe estar entre 1800 y ${new Date().getFullYear() + 1}.`);
      return;
    }

    // Show warning if publishing
    if (status === 'published') {
      const confirmPublish = window.confirm(
        'Advertencia editorial al publicar:\n\n' +
        'La publicación quedará disponible según su visibilidad en el catálogo público.\n\n' +
        '¿Desea continuar?'
      );
      if (!confirmPublish) return;
    }

    setLoading(true);

    const newPublicationData = {
      title: cleanTitle,
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      publication_type: publicationType,
      author_text: authorText.trim() || null,
      publication_year: publicationYear === '' ? null : Number(publicationYear),
      publisher_institution_id: publisherInstitutionId || null,
      cover_image_asset_id: coverImageAssetId || null,
      source_reference: sourceReference.trim() || null,
      status,
      visibility,
      is_featured: isFeatured,
      sort_order: Number(sortOrder)
    };

    try {
      const res = await createPublicationAction(newPublicationData);
      if (res.success) {
        window.location.href = '/admin/publicaciones?creado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al intentar crear la publicación.');
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
          El slug único de la publicación se generará automáticamente a partir del título principal. Las imágenes de portada asociadas deben pertenecer a la biblioteca de medios.
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            Error: {errorMsg}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Title */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="title" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Título de la Publicación *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="Ej: Antología de la Copla Andina"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Publication Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publicationType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Tipo de Publicación *
            </label>
            <select
              id="publicationType"
              required
              value={publicationType}
              onChange={(e) => setPublicationType(e.target.value as any)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="book">Libro</option>
              <option value="album">Disco/Álbum musical</option>
              <option value="special_work">Obra Especial</option>
            </select>
          </div>

          {/* Author/Creator text */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="authorText" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Autor / Creador
            </label>
            <input
              id="authorText"
              type="text"
              value={authorText}
              onChange={(e) => setAuthorText(e.target.value)}
              disabled={loading}
              placeholder="Ej: Eduardo Ceballos"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Publisher Institution */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publisher" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Institución Editora
            </label>
            <select
              id="publisher"
              value={publisherInstitutionId}
              onChange={(e) => setPublisherInstitutionId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="">Ninguna / Independiente</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Publication Year */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publicationYear" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Año de Publicación
            </label>
            <input
              id="publicationYear"
              type="number"
              min="1800"
              max={new Date().getFullYear() + 1}
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loading}
              placeholder="Ej: 1998"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Cover image asset selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="coverImage" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Imagen de Tapa (Existente)
            </label>
            <select
              id="coverImage"
              value={coverImageAssetId}
              onChange={(e) => setCoverImageAssetId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="">Seleccione una imagen de tapa...</option>
              {covers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.original_filename})
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sortOrder" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Orden del catálogo
            </label>
            <input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Source Reference */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="sourceReference" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Referencia / Enlace de Compra o Descarga Externa
            </label>
            <input
              id="sourceReference"
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              disabled={loading}
              placeholder="Ej: https://bibliotecadigital.org/obra-antologia"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="shortDescription" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Descripción Breve
            </label>
            <input
              id="shortDescription"
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={loading}
              placeholder="Ej: Obra literaria que compila coplas andinas tradicionales de la provincia de Salta."
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-serif text-stone-700"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="description" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Descripción Detallada u Reseña de la Obra
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Escriba la reseña histórica, contenido u detalles de publicación de la obra..."
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-serif text-stone-700"
            />
          </div>

        </div>

        {/* Status, Visibility, and Featured Settings */}
        <div className="border-t border-stone-200 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Status select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Estado de Publicación
            </label>
            <select
              id="status"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="published">Publicada</option>
              <option value="archived">Archivada</option>
              <option value="rejected">Rechazada</option>
            </select>
          </div>

          {/* Visibility select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visibility" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Visibilidad Pública
            </label>
            <select
              id="visibility"
              required
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="public">Público (Abierto)</option>
              <option value="subscribers">Suscriptores (Premium)</option>
              <option value="institutional">Institucional</option>
              <option value="private">Privado (Solo editores)</option>
            </select>
          </div>

          {/* Featured checkbox */}
          <div className="flex items-center gap-2 h-full md:pt-6">
            <input
              id="isFeatured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 text-earth-red focus:ring-earth-red border-stone-300 rounded"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
              Destacar en Catálogo (★)
            </label>
          </div>

        </div>

        {/* Submit Actions */}
        <div className="border-t border-stone-200 pt-6 flex justify-end gap-3 font-mono">
          <Link
            href="/admin/publicaciones"
            className="px-4 py-2.5 border border-stone-300 rounded-md text-xs uppercase tracking-wider font-bold text-stone-500 hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 disabled:opacity-50 transition-colors duration-200 shadow-sm"
          >
            {loading ? 'Guardando...' : 'Crear Publicación'}
          </button>
        </div>

      </form>
    </div>
  );
}
