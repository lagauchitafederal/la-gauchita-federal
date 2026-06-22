'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminInstitutionDetail } from '../../../lib/admin/admin-institutions';
import { updateInstitutionAction } from '../../../app/admin/instituciones/actions';

interface EditInstitutionFormProps {
  institution: AdminInstitutionDetail;
}

const TYPE_LABELS: Record<string, string> = {
  cultural_institute: 'Instituto Cultural',
  municipality: 'Municipio',
  province: 'Provincia',
  government_agency: 'Org. Gubernamental',
  school: 'Escuela',
  library: 'Biblioteca',
  museum: 'Museo',
  association: 'Asociación',
  pena: 'Peña',
  gastronomic_place: 'Lugar Gastronómico',
  cultural_center: 'Centro Cultural',
  media: 'Medio',
  other: 'Otro',
};

export default function EditInstitutionForm({ institution }: EditInstitutionFormProps) {
  // Form states
  const [name, setName] = useState(institution.name);
  const [institutionType, setInstitutionType] = useState(institution.institution_type);
  const [description, setDescription] = useState(institution.description || '');
  const [websiteUrl, setWebsiteUrl] = useState(institution.website_url || '');
  const [isFeatured, setIsFeatured] = useState(institution.is_featured);
  const [sortOrder, setSortOrder] = useState(institution.sort_order.toString());
  const [status, setStatus] = useState(institution.status || 'draft');

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const updatedData = {
      name,
      institution_type: institutionType,
      description: description.trim() || null,
      website_url: websiteUrl.trim() || null,
      is_featured: isFeatured,
      sort_order: parseInt(sortOrder, 10) || 0,
      status,
    };

    try {
      const res = await updateInstitutionAction(institution.id, updatedData);
      if (res.success) {
        window.location.href = '/admin/instituciones?guardado=1';
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
          Edición inicial habilitada. El slug, la ubicación territorial y las relaciones se administrarán en una etapa posterior.
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
          
          {/* Name input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="name" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Institution Type select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="institutionType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Tipo de Institución
            </label>
            <select
              id="institutionType"
              required
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Website URL input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="websiteUrl" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Sitio Web
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={loading}
              placeholder="https://ejemplo.org"
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
              value={institution.slug}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-stone-400 rounded-md text-sm cursor-not-allowed font-mono"
            />
          </div>

          {/* Is Featured select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="isFeatured" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Destacada
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

          {/* Sort Order input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sortOrder" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Orden de Prioridad
            </label>
            <input
              id="sortOrder"
              type="number"
              required
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono text-stone-750"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="archived">Archivado</option>
            </select>
            <span className="text-[10px] text-stone-400 font-mono">
              Una institución activa puede ser visible en los espacios públicos correspondientes.
            </span>
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
            href="/admin/instituciones"
            className="inline-flex items-center justify-center px-5 py-3 border border-stone-300 text-stone-700 text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-50 transition-colors duration-200 font-mono"
          >
            &larr; Volver al listado
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
  );
}
