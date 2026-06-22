'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateMediaAssetAction } from '../../../app/admin/archivo/actions';
import { getPublicMediaUrl } from '../../../lib/utils/media-url';

interface EditMediaAssetFormProps {
  asset: {
    id: string;
    title: string;
    description: string | null;
    alt_text: string | null;
    credit: string | null;
    source_reference: string | null;
    asset_type: string;
    rights_status: string;
    visibility: string;
    status: string;
    bucket_name: string;
    storage_path: string;
    mime_type: string | null;
    file_size_bytes: number | null;
    original_filename: string | null;
    content_id: string | null;
    institution_id: string | null;
  };
  contents: { id: string; title: string }[];
  institutions: { id: string; name: string }[];
}

const ASSET_TYPES: Record<string, string> = {
  archive_material: 'Material de Archivo',
  audio: 'Audio / Grabación',
  book_pdf: 'PDF de Libro',
  content_image: 'Imagen de Contenido',
  cover_image: 'Imagen de Portada',
  gallery_image: 'Imagen de Galería',
  historical_photo: 'Foto Histórica',
  institutional_document: 'Doc. Institucional',
  magazine_pdf: 'PDF de Revista',
  other: 'Otro',
  pdf_document: 'Documento PDF',
  recognition_document: 'Doc. de Reconocimiento',
  teacher_resource: 'Recurso Docente',
};

const RIGHTS_STATUSES: Record<string, string> = {
  authorized: 'Autorizado',
  licensed: 'Licenciado',
  owned: 'Propio',
  pending_review: 'Pendiente de Revisión',
  public_domain: 'Dominio Público',
  restricted: 'Restringido',
  unknown: 'Desconocido',
};

const VISIBILITY_OPTIONS: Record<string, string> = {
  public: 'Público',
  institutional: 'Institucional',
  private: 'Privado',
  subscribers: 'Suscriptores',
};

const STATUS_OPTIONS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
};

export default function EditMediaAssetForm({ asset, contents, institutions }: EditMediaAssetFormProps) {
  // Form states initialized with existing values
  const [title, setTitle] = useState(asset.title || '');
  const [description, setDescription] = useState(asset.description || '');
  const [altText, setAltText] = useState(asset.alt_text || '');
  const [credit, setCredit] = useState(asset.credit || '');
  const [sourceReference, setSourceReference] = useState(asset.source_reference || '');
  const [contentId, setContentId] = useState(asset.content_id || '');
  const [institutionId, setInstitutionId] = useState(asset.institution_id || '');
  const [assetType, setAssetType] = useState(asset.asset_type || 'archive_material');
  const [rightsStatus, setRightsStatus] = useState(asset.rights_status || 'pending_review');
  const [visibility, setVisibility] = useState(asset.visibility || 'public');
  const [status, setStatus] = useState(asset.status || 'draft');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título es requerido.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        alt_text: altText.trim() || null,
        credit: credit.trim() || null,
        source_reference: sourceReference.trim() || null,
        asset_type: assetType,
        rights_status: rightsStatus,
        visibility: visibility,
        status: status,
        content_id: contentId || null,
        institution_id: institutionId || null,
      };

      const res = await updateMediaAssetAction(asset.id, payload);

      if (res.success) {
        window.location.href = '/admin/archivo?guardado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al actualizar los cambios en la base de datos.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la actualización.');
      setLoading(false);
    }
  };

  const publicUrl = getPublicMediaUrl(asset.bucket_name, asset.storage_path);
  const isImage = asset.mime_type?.startsWith('image/') || ['cover_image', 'content_image', 'gallery_image', 'historical_photo'].includes(asset.asset_type);
  const formattedSize = asset.file_size_bytes 
    ? `${(asset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
    : 'Desconocido';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md flex flex-col gap-1">
          <p className="text-xs text-red-800 font-bold font-mono">
            Error: {errorMsg}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: File Preview & Read-Only Specs */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-stone-500 font-mono">
              Vista Previa & Detalles del Archivo
            </h3>
            
            {/* Visual Preview */}
            <div className="relative w-full aspect-video bg-white border border-stone-200 rounded overflow-hidden flex items-center justify-center">
              {isImage && publicUrl ? (
                <img
                  src={publicUrl}
                  alt={asset.alt_text || asset.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400 font-mono">
                  <span className="text-xs font-bold uppercase tracking-wider">Documento / Audio</span>
                  <span className="text-[10px]">{asset.mime_type || 'No mime type'}</span>
                </div>
              )}
            </div>

            {/* Read-Only metadata fields */}
            <div className="flex flex-col gap-3 text-xs font-mono border-t border-stone-200/80 pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold">ID del Registro</span>
                <span className="text-stone-700 select-all font-mono break-all">{asset.id}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Nombre de archivo original</span>
                <span className="text-stone-700 break-all">{asset.original_filename || 'No registrado'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Storage Path (Bucket: {asset.bucket_name})</span>
                <span className="text-stone-700 break-all">{asset.storage_path}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Tamaño del archivo</span>
                <span className="text-stone-700">{formattedSize}</span>
              </div>
              
              {publicUrl && (
                <div className="pt-2">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded hover:bg-white transition-colors duration-150 text-center"
                  >
                    Abrir archivo original &nearr;
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right column: Edit Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-stone-beige rounded-lg shadow-sm p-6 sm:p-8 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title input */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="title" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Título del Archivo
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

            {/* Asset Type select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="assetType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Tipo de Recurso
              </label>
              <select
                id="assetType"
                required
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-700"
              >
                {Object.entries(ASSET_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rights Status select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rightsStatus" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Estado de Derechos
              </label>
              <select
                id="rightsStatus"
                required
                value={rightsStatus}
                onChange={(e) => setRightsStatus(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-700"
              >
                {Object.entries(RIGHTS_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="visibility" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Visibilidad
              </label>
              <select
                id="visibility"
                required
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-700"
              >
                {Object.entries(VISIBILITY_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Estado
              </label>
              <select
                id="status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-700"
              >
                {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Alt Text input */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="altText" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Texto Alternativo (Alt Text)
              </label>
              <input
                id="altText"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                disabled={loading}
                placeholder="Descripción para lectores de pantalla"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
              />
            </div>

            {/* Content select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contentId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Asociar a Contenido
              </label>
              <select
                id="contentId"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-700"
              >
                <option value="">-- Opcional (Ninguno) --</option>
                {contents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="institutionId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Asociar a Institución
              </label>
              <select
                id="institutionId"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-700"
              >
                <option value="">-- Opcional (Ninguno) --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Credit input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="credit" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Crédito / Autoría
              </label>
              <input
                id="credit"
                type="text"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                disabled={loading}
                placeholder="Ej. Fotografía de Juan Pérez"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
              />
            </div>

            {/* Source Reference input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sourceReference" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Referencia de Fuente
              </label>
              <input
                id="sourceReference"
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                disabled={loading}
                placeholder="Ej. Tomado del Archivo de la Provincia"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
              />
            </div>

            {/* Description textarea */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="description" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                Descripción
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 resize-y text-stone-700"
              />
            </div>

          </div>

          {/* Buttons Action Group */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-beige/80">
            
            <Link
              href="/admin/archivo"
              className="inline-flex items-center justify-center px-5 py-3 border border-stone-300 text-stone-700 text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-50 transition-colors duration-200 font-mono"
            >
              Volver al listado
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Guardando cambios...' : 'Guardar cambios'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
