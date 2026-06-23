'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../../lib/supabase/client';
import { createMediaAssetAction } from '../../../app/admin/archivo/actions';

interface NewMediaAssetFormProps {
  contents: { id: string; title: string }[];
  institutions: { id: string; name: string }[];
}

const ASSET_TYPES: Record<string, string> = {
  archive_material: 'Material de Archivo',
  audio: 'Audio / Grabación',
  book_pdf: 'PDF de Libro',
  content_image: 'Imagen de Contenido',
};

const RIGHTS_STATUSES: Record<string, string> = {
  pending_review: 'Pendiente de Revisión',
  owned: 'Propio',
  authorized: 'Autorizado',
  public_domain: 'Dominio Público',
  licensed: 'Licenciado',
  restricted: 'Restringido',
  unknown: 'Desconocido',
};

const VISIBILITY_OPTIONS: Record<string, string> = {
  public: 'Público',
  institutional: 'Institucional',
  private: 'Privado',
  subscribers: 'Suscriptores',
};

export default function NewMediaAssetForm({ contents, institutions }: NewMediaAssetFormProps) {
  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [altText, setAltText] = useState('');
  const [credit, setCredit] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [contentId, setContentId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [assetType, setAssetType] = useState('archive_material');
  const [rightsStatus, setRightsStatus] = useState('pending_review');
  const [visibility, setVisibility] = useState('public');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validation
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('El archivo supera el límite de 10 MB.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP, GIF), PDF y audio (MP3, WAV, OGG).');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setErrorMsg(null);
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!file) {
      setErrorMsg('Por favor seleccione un archivo para cargar.');
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('El título es obligatorio y no puede consistir solo de espacios vacíos.');
      return;
    }
    if (cleanTitle.length > 220) {
      setErrorMsg('El título supera el límite de 220 caracteres.');
      return;
    }
    if (credit.trim().length > 220) {
      setErrorMsg('El crédito supera el límite de 220 caracteres.');
      return;
    }
    if (altText.trim().length > 300) {
      setErrorMsg('El texto alternativo supera el límite de 300 caracteres.');
      return;
    }
    if (sourceReference.trim().length > 500) {
      setErrorMsg('La referencia de la fuente supera el límite de 500 caracteres.');
      return;
    }

    setLoading(true);

    // 1. Generate unique storage path
    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${Date.now()}_${cleanName}`;

    try {
      // 2. Upload file to public-media storage bucket
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('public-media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        setErrorMsg(`Error de carga de archivo: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // 3. Prepare metadata payload for table insert
      const metadata = {
        title: title.trim(),
        description: description.trim() || null,
        asset_type: assetType,
        bucket_name: 'public-media',
        storage_path: storagePath,
        mime_type: file.type || null,
        file_size_bytes: file.size || null,
        original_filename: file.name || null,
        alt_text: altText.trim() || null,
        credit: credit.trim() || null,
        source_reference: sourceReference.trim() || null,
        rights_status: rightsStatus,
        visibility: visibility,
        status: 'draft',
        content_id: contentId || null,
        institution_id: institutionId || null,
      };

      // 4. Save metadata to database public.media_assets using Server Action
      const res = await createMediaAssetAction(metadata);

      if (res.success) {
        window.location.href = '/admin/archivo?creado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar los metadatos en la base de datos.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado durante el proceso de carga.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Informative alert banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
          El archivo se almacenará en el bucket público y se registrará en estado borrador (draft). No se permite asociar a reconocimientos en esta versión.
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
          
          {/* File input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="file" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Archivo (Máximo 10 MB - JPEG, PNG, WEBP, GIF, PDF, MP3, WAV, OGG)
            </label>
            <input
              id="file"
              type="file"
              required
              onChange={handleFileChange}
              disabled={loading}
              className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200/80 transition-all duration-200"
            />
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4 relative w-32 h-32 bg-stone-50 border border-stone-200 rounded overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

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
              Tipo de Recurso (Control)
            </label>
            <select
              id="assetType"
              required
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              {Object.entries(VISIBILITY_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Alt Text input */}
          <div className="flex flex-col gap-1.5">
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
            {altText.trim() === '' && (assetType === 'content_image' || (file && file.type.startsWith('image/'))) && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border-l-2 border-amber-500 px-2 py-1 rounded-sm font-mono mt-1 block">
                Se recomienda incorporar texto alternativo para accesibilidad.
              </span>
            )}
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 resize-y"
            />
          </div>

        </div>

        {/* Buttons Action Group */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-beige/80">
          
          <Link
            href="/admin/archivo"
            className="inline-flex items-center justify-center px-5 py-3 border border-stone-300 text-stone-700 text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-50 transition-colors duration-200 font-mono"
          >
            &larr; Volver al listado
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Subiendo archivo...' : 'Subir archivo'}
          </button>

        </div>

      </form>
    </div>
  );
}
