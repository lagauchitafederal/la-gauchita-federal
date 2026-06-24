'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateMagazineAction } from '../../../app/admin/revista/actions';
import { AdminMagazine } from '../../../lib/admin/admin-magazines';

interface EditMagazineFormProps {
  magazine: AdminMagazine;
  institutions: Array<{ id: string; name: string; slug: string }>;
  covers: Array<{ id: string; title: string; original_filename: string }>;
  pdfs: Array<{ id: string; title: string; original_filename: string }>;
}

interface IndexEntry {
  title: string;
  page: string;
  related_slug: string;
}

export default function EditMagazineForm({
  magazine,
  institutions,
  covers,
  pdfs,
}: EditMagazineFormProps) {
  // Form states
  const [editionNumber, setEditionNumber] = useState<number | ''>(magazine.edition_number);
  const [volume, setVolume] = useState(magazine.volume || '');
  const [publicationYear, setPublicationYear] = useState<number | ''>(magazine.publication_year);
  const [publicationDate, setPublicationDate] = useState(magazine.publication_date || '');
  const [title, setTitle] = useState(magazine.title);
  const [description, setDescription] = useState(magazine.description || '');
  const [publisherInstitutionId, setPublisherInstitutionId] = useState(magazine.publisher_institution_id);
  const [coverImageAssetId, setCoverImageAssetId] = useState(magazine.cover_image_asset_id || '');
  const [pdfAssetId, setPdfAssetId] = useState(magazine.pdf_asset_id || '');
  const [status, setStatus] = useState(magazine.status);
  const [visibility, setVisibility] = useState(magazine.visibility);
  const [isFeatured, setIsFeatured] = useState(magazine.is_featured);
  const [sortOrder, setSortOrder] = useState<number>(magazine.sort_order);

  // Table of Contents state
  const [toc, setToc] = useState<IndexEntry[]>((magazine.table_of_contents || []) as IndexEntry[]);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // TOC Entry Form states
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryPage, setNewEntryPage] = useState('');
  const [newEntrySlug, setNewEntrySlug] = useState('');

  const handleAddTocEntry = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newEntryTitle.trim()) {
      alert('El título de la entrada del índice es obligatorio.');
      return;
    }
    setToc([...toc, {
      title: newEntryTitle.trim(),
      page: newEntryPage.trim(),
      related_slug: newEntrySlug.trim()
    }]);
    setNewEntryTitle('');
    setNewEntryPage('');
    setNewEntrySlug('');
  };

  const handleRemoveTocEntry = (index: number) => {
    setToc(toc.filter((_, i) => i !== index));
  };

  const handleMoveTocEntry = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === toc.length - 1) return;

    const newToc = [...toc];
    const temp = newToc[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    newToc[index] = newToc[swapIndex];
    newToc[swapIndex] = temp;
    setToc(newToc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('El título es obligatorio.');
      return;
    }
    if (editionNumber === '' || editionNumber <= 0) {
      setErrorMsg('El número de edición es obligatorio y debe ser mayor a cero.');
      return;
    }
    if (publicationYear === '' || publicationYear < 1900 || publicationYear > 2100) {
      setErrorMsg('El año de publicación es obligatorio y debe estar entre 1900 y 2100.');
      return;
    }
    if (!publisherInstitutionId) {
      setErrorMsg('La institución editora es obligatoria.');
      return;
    }

    // Compatibility validation between date and year
    if (publicationDate) {
      const yearFromDate = parseInt(publicationDate.split('-')[0], 10);
      if (yearFromDate !== publicationYear) {
        setErrorMsg('El año de la fecha de publicación no coincide con el año de la edición.');
        return;
      }
    }

    // Show warning if publishing (and previously it wasn't published)
    if (status === 'published' && magazine.status !== 'published') {
      const confirmPublish = window.confirm(
        'Advertencia editorial al publicar:\n\n' +
        'La edición quedará disponible según su visibilidad y los activos documentales asociados.\n\n' +
        '¿Desea continuar?'
      );
      if (!confirmPublish) return;
    }

    setLoading(true);

    const updatedData = {
      edition_number: Number(editionNumber),
      volume: volume.trim() || null,
      publication_year: Number(publicationYear),
      publication_date: publicationDate || null,
      title: cleanTitle,
      description: description.trim() || null,
      table_of_contents: toc,
      publisher_institution_id: publisherInstitutionId,
      cover_image_asset_id: coverImageAssetId || null,
      pdf_asset_id: pdfAssetId || null,
      status,
      visibility,
      is_featured: isFeatured,
      sort_order: Number(sortOrder)
    };

    try {
      const res = await updateMagazineAction(magazine.id, updatedData);
      if (res.success) {
        window.location.href = '/admin/revista?guardado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al intentar guardar la edición.');
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
          El slug actual ({magazine.slug}) es inmutable en esta etapa. Modifique los campos del formulario y verifique la procedencia de los activos.
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
              Título de la Edición *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="Ej: Revista La Gauchita Edición Aniversario"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Publisher Institution */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publisher" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Institución Editora *
            </label>
            <select
              id="publisher"
              required
              value={publisherInstitutionId}
              onChange={(e) => setPublisherInstitutionId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="">Seleccione una institución...</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Edition Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="editionNumber" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Número de Edición *
            </label>
            <input
              id="editionNumber"
              type="number"
              min="1"
              required
              value={editionNumber}
              onChange={(e) => setEditionNumber(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loading}
              placeholder="Ej: 274"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Volume / Tomo */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="volume" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Tomo / Volumen
            </label>
            <input
              id="volume"
              type="text"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              disabled={loading}
              placeholder="Ej: Tomo III o Edición Especial"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Publication Year */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publicationYear" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Año de Publicación *
            </label>
            <input
              id="publicationYear"
              type="number"
              min="1900"
              max="2100"
              required
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loading}
              placeholder="Ej: 2001"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700"
            />
          </div>

          {/* Publication Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publicationDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Fecha de Publicación
            </label>
            <input
              id="publicationDate"
              type="date"
              value={publicationDate}
              onChange={(e) => setPublicationDate(e.target.value)}
              disabled={loading}
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

          {/* PDF asset selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pdfAsset" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Archivo PDF de Edición (Existente)
            </label>
            <select
              id="pdfAsset"
              value={pdfAssetId}
              onChange={(e) => setPdfAssetId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="">Seleccione un archivo PDF...</option>
              {pdfs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.original_filename})
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sortOrder" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Orden Editorial
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

          {/* Description */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="description" className="text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
              Descripción o Resumen Editorial
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Escriba una introducción sobre los contenidos de este ejemplar..."
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-serif text-stone-700"
            />
          </div>

        </div>

        {/* Index Editorial (Table of Contents) Section */}
        <div className="border-t border-stone-200 pt-6 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-charcoal">
              Índice Editorial (Tabla de Contenidos)
            </h3>
            <p className="text-xs text-stone-500 font-sans">
              Organice los artículos e hitos incluidos en esta edición. Agregue entradas indicando título, número de página y el slug del contenido publicado (opcional).
            </p>
          </div>

          {/* TOC Form Inputs */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="newEntryTitle" className="text-[9px] uppercase font-bold text-stone-500 font-mono">
                Título del Artículo
              </label>
              <input
                id="newEntryTitle"
                type="text"
                value={newEntryTitle}
                onChange={(e) => setNewEntryTitle(e.target.value)}
                placeholder="Ej: Las Marcadas tradicionales"
                className="px-2.5 py-1.5 border border-stone-300 rounded bg-white text-xs font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="newEntryPage" className="text-[9px] uppercase font-bold text-stone-500 font-mono">
                Página (Opcional)
              </label>
              <input
                id="newEntryPage"
                type="text"
                value={newEntryPage}
                onChange={(e) => setNewEntryPage(e.target.value)}
                placeholder="Ej: 14 o Portada"
                className="px-2.5 py-1.5 border border-stone-300 rounded bg-white text-xs font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="newEntrySlug" className="text-[9px] uppercase font-bold text-stone-500 font-mono">
                Slug de Contenido Relacionado (Opcional)
              </label>
              <input
                id="newEntrySlug"
                type="text"
                value={newEntrySlug}
                onChange={(e) => setNewEntrySlug(e.target.value)}
                placeholder="Ej: las-marcadas"
                className="px-2.5 py-1.5 border border-stone-300 rounded bg-white text-xs font-mono"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={handleAddTocEntry}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-850 text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
              >
                Agregar al Índice
              </button>
            </div>
          </div>

          {/* TOC Entries List */}
          {toc.length === 0 ? (
            <p className="text-xs text-stone-400 italic font-mono text-center py-4 bg-[#faf9f6] rounded border border-stone-beige/40">
              Aún no se han agregado entradas al índice.
            </p>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Orden</th>
                    <th className="p-3">Título</th>
                    <th className="p-3">Pág.</th>
                    <th className="p-3">Contenido Vinculado (Slug)</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {toc.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="p-3 text-stone-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-charcoal">{entry.title}</td>
                      <td className="p-3 text-stone-600">{entry.page || <span className="text-stone-300 italic">-</span>}</td>
                      <td className="p-3 text-stone-500">{entry.related_slug || <span className="text-stone-300 italic">-</span>}</td>
                      <td className="p-3 text-right flex justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveTocEntry(idx, 'up')}
                          className="p-1 border border-stone-300 rounded text-stone-500 hover:text-earth-red disabled:opacity-30 disabled:hover:text-stone-500"
                          title="Subir"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === toc.length - 1}
                          onClick={() => handleMoveTocEntry(idx, 'down')}
                          className="p-1 border border-stone-300 rounded text-stone-500 hover:text-earth-red disabled:opacity-30 disabled:hover:text-stone-500"
                          title="Bajar"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTocEntry(idx)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-150 border border-red-200 rounded text-[9px] uppercase font-bold text-red-600"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
            >
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="published">Publicada</option>
              <option value="archived">Archivada</option>
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
              onChange={(e) => setVisibility(e.target.value)}
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
              Destacar en Portada (★)
            </label>
          </div>

        </div>

        {/* Submit Actions */}
        <div className="border-t border-stone-200 pt-6 flex justify-end gap-3 font-mono">
          <Link
            href="/admin/revista"
            className="px-4 py-2.5 border border-stone-300 rounded-md text-xs uppercase tracking-wider font-bold text-stone-500 hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 disabled:opacity-50 transition-colors duration-200 shadow-sm"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  );
}
