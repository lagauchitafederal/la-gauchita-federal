'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createPersonAction } from '../../../app/admin/personajes/actions';

interface NewPersonFormProps {
  regions: { id: string; name: string; code: string }[];
  provinces: { id: string; name: string; region_id: string }[];
  municipalities: { id: string; name: string; province_id: string }[];
  mediaAssets: { id: string; title: string; storage_path: string }[];
}

const PERSON_TYPES = [
  { value: 'historical_figure', label: 'Prócer / Figura Histórica' },
  { value: 'writer', label: 'Escritor/a' },
  { value: 'poet', label: 'Poeta / Poetisa' },
  { value: 'historian', label: 'Historiador/a' },
  { value: 'musician', label: 'Músico/a' },
  { value: 'singer', label: 'Cantante' },
  { value: 'artist', label: 'Artista' },
  { value: 'artisan', label: 'Artesano/a' },
  { value: 'educator', label: 'Educador/a' },
  { value: 'researcher', label: 'Investigador/a' },
  { value: 'public_figure', label: 'Figura Pública' },
  { value: 'cultural_referent', label: 'Referente Cultural' },
  { value: 'other', label: 'Otro / Popular' }
];

export default function NewPersonForm({
  regions,
  provinces,
  municipalities,
  mediaAssets
}: NewPersonFormProps) {
  // Form states
  const [fullName, setFullName] = useState('');
  const [personType, setPersonType] = useState('historical_figure');
  const [shortBio, setShortBio] = useState('');
  const [biography, setBiography] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  
  // Territorial hierarchy states
  const [regionId, setRegionId] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  
  const [mainImageAssetId, setMainImageAssetId] = useState('');
  const [status, setStatus] = useState('draft');
  const [visibility, setVisibility] = useState('public');
  const [isFeatured, setIsFeatured] = useState(false);

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

    const cleanFullName = fullName.trim();
    if (!cleanFullName || cleanFullName.length < 3) {
      setErrorMsg('El nombre completo es obligatorio y debe tener al menos 3 caracteres.');
      return;
    }
    if (cleanFullName.length > 180) {
      setErrorMsg('El nombre completo supera el límite de 180 caracteres.');
      return;
    }
    if (shortBio.trim().length > 500) {
      setErrorMsg('La biografía breve supera el límite de 500 caracteres.');
      return;
    }
    if (biography.trim().length > 15000) {
      setErrorMsg('La biografía supera el límite de 15.000 caracteres.');
      return;
    }
    if (sourceReference.trim().length > 500) {
      setErrorMsg('La fuente o referencia supera el límite de 500 caracteres.');
      return;
    }
    if (birthDate && deathDate && new Date(deathDate) < new Date(birthDate)) {
      setErrorMsg('La fecha de fallecimiento no puede ser anterior a la de nacimiento.');
      return;
    }

    setLoading(true);

    const newPersonData = {
      full_name: cleanFullName,
      short_bio: shortBio.trim() || null,
      biography: biography.trim() || null,
      person_type: personType,
      birth_date: birthDate || null,
      death_date: deathDate || null,
      region_id: regionId || null,
      province_id: provinceId || null,
      municipality_id: municipalityId || null,
      main_image_asset_id: mainImageAssetId || null,
      source_reference: sourceReference.trim() || null,
      status,
      visibility,
      is_featured: isFeatured
    };

    try {
      const res = await createPersonAction(newPersonData);
      if (res.success) {
        window.location.href = '/admin/personajes?creado=1';
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al intentar crear el personaje.');
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
            Advertencia: Este perfil quedará disponible según su visibilidad y estado editorial.
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
          
          {/* Full Name */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="fullName" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Nombre Completo *
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          {/* Person Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="personType" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Tipo de Personaje *
            </label>
            <select
              id="personType"
              required
              value={personType}
              onChange={(e) => setPersonType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white"
            >
              {PERSON_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Main Image Asset */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mainImageAssetId" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Imagen Principal
            </label>
            <select
              id="mainImageAssetId"
              value={mainImageAssetId}
              onChange={(e) => setMainImageAssetId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono"
            >
              <option value="">Sin imagen principal</option>
              {mediaAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.title || asset.storage_path}
                </option>
              ))}
            </select>
          </div>

          {/* Birth Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="birthDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fecha de Nacimiento
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            />
          </div>

          {/* Death Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="deathDate" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Fecha de Fallecimiento
            </label>
            <input
              id="deathDate"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            />
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono"
            >
              <option value="">Nacional / Federal</option>
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono"
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono disabled:opacity-50"
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono"
            >
              <option value="public">Público</option>
              <option value="subscribers">Suscriptores</option>
              <option value="institutional">Institucional</option>
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
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono"
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
              Destacado
            </label>
            <select
              id="isFeatured"
              value={isFeatured ? 'true' : 'false'}
              onChange={(e) => setIsFeatured(e.target.value === 'true')}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 bg-white font-mono"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          <div className="hidden md:block"></div>

          {/* Short Bio */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="shortBio" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Biografía Breve (Resumen)
            </label>
            <textarea
              id="shortBio"
              rows={3}
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 resize-y"
            />
          </div>

          {/* Biography */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="biography" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Biografía Completa
            </label>
            <textarea
              id="biography"
              rows={12}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 resize-y"
            />
          </div>

        </div>

        {/* Buttons Action Group */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-beige/80">
          
          <Link
            href="/admin/personajes"
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
