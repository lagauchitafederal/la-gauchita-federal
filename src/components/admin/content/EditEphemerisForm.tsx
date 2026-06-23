'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateEphemerisAction } from '../../../app/admin/efemerides/actions';
import { AdminEphemerisDetail } from '../../../lib/admin/admin-ephemerides';

interface EditEphemerisFormProps {
  ephemeris: AdminEphemerisDetail;
  categories: { id: string; name: string }[];
  regions: { id: string; name: string; code: string }[];
  provinces: { id: string; name: string; region_id: string }[];
  municipalities: { id: string; name: string; province_id: string }[];
}

export default function EditEphemerisForm({
  ephemeris,
  categories,
  regions,
  provinces,
  municipalities
}: EditEphemerisFormProps) {
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
  const [title, setTitle] = useState(ephemeris.title);
  const [subtitle, setSubtitle] = useState(ephemeris.subtitle || '');
  const [summary, setSummary] = useState(ephemeris.summary || '');
  const [body, setBody] = useState(ephemeris.body || '');
  const [eventDate, setEventDate] = useState(formatDateForInput(ephemeris.event_date));
  const [categoryId, setCategoryId] = useState(ephemeris.category_id || '');
  
  // Territorial hierarchy states
  const [regionId, setRegionId] = useState(ephemeris.region_id || '');
  const [provinceId, setProvinceId] = useState(ephemeris.province_id || '');
  const [municipalityId, setMunicipalityId] = useState(ephemeris.municipality_id || '');
  
  const [sourceReference, setSourceReference] = useState(ephemeris.source_reference || '');
  const [status, setStatus] = useState(ephemeris.status);
  const [visibility, setVisibility] = useState(ephemeris.visibility);
  const [isFeatured, setIsFeatured] = useState(ephemeris.is_featured);

  // Status message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered lists for cascading selects
  const filteredProvinces = regionId
    ? provinces.filter((p) => p.region_id === regionId)
    : provinces;

  const filteredMunicipalities = provinceId
    ? municipalities.filter((m) => m.province_id === provinceId)
    : [];

  const handleRegionChange = (regId: string) => {
    setRegionId(regId);
    if (regId) {
      // Check if selected province is incompatible
      const currentProv = provinces.find((p) => p.id === provinceId);
      if (currentProv && currentProv.region_id !== regId) {
        setProvinceId('');
        setMunicipalityId('');
      }
    } else {
      setProvinceId('');
      setMunicipalityId('');
    }
  };

  const handleProvinceChange = (provId: string) => {
    setProvinceId(provId);
    if (provId) {
      const currentProv = provinces.find((p) => p.id === provId);
      if (currentProv) {
        // Auto-select parent region
        if (regionId !== currentProv.region_id) {
          setRegionId(currentProv.region_id);
        }
      }
      // Check if selected municipality is incompatible
      const currentMun = municipalities.find((m) => m.id === municipalityId);
      if (currentMun && currentMun.province_id !== provId) {
        setMunicipalityId('');
      }
    } else {
      setMunicipalityId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('El título es obligatorio.');
      return;
    }
    if (cleanTitle.length > 180) {
      setErrorMsg('El título supera el límite de 180 caracteres.');
      return;
    }
    if (subtitle.trim().length > 240) {
      setErrorMsg('La bajada supera el límite de 240 caracteres.');
      return;
    }
    if (summary.trim().length > 1000) {
      setErrorMsg('El resumen supera el límite de 1.000 caracteres.');
      return;
    }
    if (!eventDate) {
      setErrorMsg('La fecha histórica es obligatoria para una efeméride.');
      return;
    }

    setLoading(true);

    const updatedData = {
      title: cleanTitle,
      subtitle: subtitle.trim() || null,
      summary: summary.trim() || null,
      body: body.trim() || null,
      event_date: eventDate,
      category_id: categoryId || null,
      region_id: regionId || null,
      province_id: provinceId || null,
      municipality_id: municipalityId || null,
      source_reference: sourceReference.trim() || null,
      status,
      visibility,
      is_featured: isFeatured
    };

    try {
      const res = await updateEphemerisAction(ephemeris.id, updatedData);
      if (res.success) {
        window.location.href = '/admin/efemerides?guardado=1';
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
      
      {/* Warning Banner */}
      {status === 'published' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
            Advertencia: Esta efeméride podrá aparecer en el bloque &apos;Un día como hoy&apos; según su fecha, territorio y visibilidad.
          </p>
        </div>
      )}

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

          {/* Subtitle / Bajada */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="subtitle" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Bajada
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
              value={ephemeris.slug}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-stone-400 rounded-md text-sm cursor-not-allowed font-mono"
            />
          </div>

          {/* Event Date (Fecha Histórica) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="eventDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fecha Histórica
            </label>
            <input
              id="eventDate"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoryId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Categoría
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="regionId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Región
            </label>
            <select
              id="regionId"
              value={regionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white"
            >
              <option value="">Nacional / Todas las regiones</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.code})
                </option>
              ))}
            </select>
          </div>

          {/* Province */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="provinceId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Provincia
            </label>
            <select
              id="provinceId"
              value={provinceId}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white"
            >
              <option value="">Todas las provincias</option>
              {filteredProvinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="municipalityId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Municipio / Localidad
            </label>
            <select
              id="municipalityId"
              value={municipalityId}
              onChange={(e) => setMunicipalityId(e.target.value)}
              disabled={loading || !provinceId}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white disabled:opacity-50"
            >
              <option value="">
                {!provinceId ? 'Seleccioná una provincia primero' : 'Todas las localidades'}
              </option>
              {filteredMunicipalities.map((mun) => (
                <option key={mun.id} value={mun.id}>
                  {mun.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Reference */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sourceReference" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fuente o Referencia Documental
            </label>
            <input
              id="sourceReference"
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Visibility */}
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white"
            >
              <option value="public">Público</option>
              <option value="private">Privado / Interno</option>
            </select>
          </div>

          {/* Editorial Status */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Estado Editorial
            </label>
            <select
              id="status"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white"
            >
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="published">Publicado</option>
              <option value="rejected">Rechazado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          {/* Is Featured */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="isFeatured" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Destacada
            </label>
            <select
              id="isFeatured"
              value={isFeatured ? 'true' : 'false'}
              onChange={(e) => setIsFeatured(e.target.value === 'true')}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono bg-white"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          <div className="hidden md:block"></div>

          {/* Summary */}
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

          {/* Body */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="body" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Cuerpo de la Efeméride
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
            href="/admin/efemerides"
            className="inline-flex items-center justify-center px-5 py-3 border border-stone-300 text-stone-700 text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-50 transition-colors duration-200 font-mono"
          >
            &larr; Volver al listado
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>

        </div>

      </form>
    </div>
  );
}
