'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createRecognitionAction } from '../../../app/admin/reconocimientos/actions';

const RECOGNITION_TYPES: Record<string, string> = {
  award: 'Premio',
  certification: 'Certificación',
  declaration: 'Declaración',
  distinction: 'Distinción',
  endorsement: 'Aval',
  homage: 'Homenaje',
  mention: 'Mención',
  other: 'Otro',
  participation: 'Participación',
  press: 'Prensa',
};

const ENTITY_TYPES: Record<string, string> = {
  book: 'Libro',
  content: 'Contenido',
  event: 'Evento',
  institute: 'Instituto',
  institution: 'Institución',
  magazine: 'Revista',
  music_album: 'Álbum',
  other: 'Otro',
  person: 'Persona',
  project: 'Proyecto',
};

export default function NewRecognitionForm() {
  // Form states
  const [title, setTitle] = useState('');
  const [recognitionType, setRecognitionType] = useState('award');
  const [recognizedEntityType, setRecognizedEntityType] = useState('person');
  const [description, setDescription] = useState('');
  const [grantingInstitutionName, setGrantingInstitutionName] = useState('');
  const [recognitionDate, setRecognitionDate] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('El título es obligatorio y no puede consistir solo de espacios vacíos.');
      return;
    }
    if (cleanTitle.length > 220) {
      setErrorMsg('El título supera el límite de 220 caracteres.');
      return;
    }
    if (!recognitionType) {
      setErrorMsg('El tipo de reconocimiento es obligatorio.');
      return;
    }
    if (!recognizedEntityType) {
      setErrorMsg('La entidad reconocida es obligatoria.');
      return;
    }
    if (recognitionDate) {
      const d = new Date(recognitionDate);
      if (isNaN(d.getTime())) {
        setErrorMsg('La fecha de otorgamiento debe ser una fecha válida.');
        return;
      }
    }
    if (grantingInstitutionName.trim().length > 220) {
      setErrorMsg('La institución otorgante supera el límite de 220 caracteres.');
      return;
    }
    if (sourceReference.trim().length > 500) {
      setErrorMsg('La referencia de la fuente supera el límite de 500 caracteres.');
      return;
    }

    setLoading(true);

    const newRecognitionData = {
      title: cleanTitle,
      recognition_type: recognitionType,
      recognized_entity_type: recognizedEntityType,
      description: description.trim() || null,
      granting_institution_name: grantingInstitutionName.trim() || null,
      recognition_date: recognitionDate || null,
      source_reference: sourceReference.trim() || null,
      is_featured: isFeatured,
    };

    try {
      const res = await createRecognitionAction(newRecognitionData);
      if (res.success) {
        window.location.href = '/admin/reconocimientos?creado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al intentar crear el reconocimiento.');
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
          El slug se generará automáticamente a partir del título. Los archivos asociados y las relaciones UUID se administrarán en una etapa posterior.
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

          {/* Recognition Type select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recognitionType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Tipo de Reconocimiento
            </label>
            <select
              id="recognitionType"
              required
              value={recognitionType}
              onChange={(e) => setRecognitionType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              {Object.entries(RECOGNITION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Recognized Entity Type select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recognizedEntityType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Entidad Reconocida
            </label>
            <select
              id="recognizedEntityType"
              required
              value={recognizedEntityType}
              onChange={(e) => setRecognizedEntityType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              {Object.entries(ENTITY_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Granting Institution Name input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grantingInstitutionName" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Institución Otorgante
            </label>
            <input
              id="grantingInstitutionName"
              type="text"
              value={grantingInstitutionName}
              onChange={(e) => setGrantingInstitutionName(e.target.value)}
              disabled={loading}
              placeholder="Ej. Congreso de la Nación"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Recognition Date input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recognitionDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fecha de Otorgamiento
            </label>
            <input
              id="recognitionDate"
              type="date"
              value={recognitionDate}
              onChange={(e) => setRecognitionDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
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
              placeholder="Ej. Boletín Oficial Nº 34212"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
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

          {/* Description textarea */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="description" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Descripción
            </label>
            <textarea
              id="description"
              rows={6}
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
            href="/admin/reconocimientos"
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
