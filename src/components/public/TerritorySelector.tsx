'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import {
  PublicTerritory,
  DEFAULT_TERRITORY,
  serializeTerritoryCookie,
  setCookie
} from '../../lib/utils/territory';

interface RegionData {
  id: string;
  name: string;
  code: string;
}

interface ProvinceData {
  id: string;
  name: string;
  code: string;
  region_id: string;
}

interface MunicipalityData {
  id: string;
  name: string;
  code: string;
  province_id: string;
}

interface TerritorySelectorProps {
  currentTerritory: PublicTerritory;
}

export default function TerritorySelector({ currentTerritory }: TerritorySelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lists loaded from database
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);

  // Loading states
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  // Temporary selection states
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(currentTerritory.regionId);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(currentTerritory.provinceId);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string | null>(currentTerritory.municipalityId);

  // Sync state if currentTerritory changes externally
  useEffect(() => {
    setSelectedRegionId(currentTerritory.regionId);
    setSelectedProvinceId(currentTerritory.provinceId);
    setSelectedMunicipalityId(currentTerritory.municipalityId);
  }, [currentTerritory]);

  // Load regions and provinces once on mount/open
  useEffect(() => {
    if (!isOpen) return;

    async function loadInitialCatalogs() {
      setLoadingCatalogs(true);
      try {
        const [regionsRes, provincesRes] = await Promise.all([
          supabaseClient
            .from('regions')
            .select('id, name, code')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }),
          supabaseClient
            .from('provinces')
            .select('id, name, code, region_id')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true })
        ]);

        if (regionsRes.error) throw regionsRes.error;
        if (provincesRes.error) throw provincesRes.error;

        setRegions(regionsRes.data || []);
        setProvinces(provincesRes.data || []);
      } catch (err) {
        console.error('Error loading territory catalogs:', err);
      } finally {
        setLoadingCatalogs(false);
      }
    }

    if (regions.length === 0) {
      loadInitialCatalogs();
    }
  }, [isOpen, regions.length]);

  // Load municipalities when selected province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setMunicipalities([]);
      return;
    }

    async function loadMunicipalities() {
      setLoadingMunicipalities(true);
      try {
        const { data, error } = await supabaseClient
          .from('municipalities')
          .select('id, name, code, province_id')
          .eq('province_id', selectedProvinceId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        setMunicipalities(data || []);
      } catch (err) {
        console.error('Error loading municipalities:', err);
      } finally {
        setLoadingMunicipalities(false);
      }
    }

    loadMunicipalities();
  }, [selectedProvinceId]);

  // Close panel on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered provinces based on selected region
  const filteredProvinces = selectedRegionId
    ? provinces.filter((p) => p.region_id === selectedRegionId)
    : provinces;

  // Handle Region Change (clean incompatible sub-fields)
  const handleRegionChange = (regionId: string | null) => {
    setSelectedRegionId(regionId);
    
    // Check if the current selected province belongs to the new region
    if (regionId && selectedProvinceId) {
      const prov = provinces.find(p => p.id === selectedProvinceId);
      if (prov && prov.region_id !== regionId) {
        setSelectedProvinceId(null);
        setSelectedMunicipalityId(null);
      }
    } else if (!regionId) {
      // Clearing region clears everything
      setSelectedProvinceId(null);
      setSelectedMunicipalityId(null);
    }
  };

  // Handle Province Change
  const handleProvinceChange = (provinceId: string | null) => {
    setSelectedProvinceId(provinceId);
    
    if (provinceId) {
      const prov = provinces.find(p => p.id === provinceId);
      if (prov) {
        // Auto-select corresponding region if not already matching
        if (selectedRegionId !== prov.region_id) {
          setSelectedRegionId(prov.region_id);
        }
      }
      
      // Clear municipality if it does not belong to the new province (since province changed)
      setSelectedMunicipalityId(null);
    } else {
      setSelectedMunicipalityId(null);
    }
  };

  // Save selection and update cookie
  const handleApply = () => {
    let label = 'Argentina';
    
    if (selectedMunicipalityId && selectedProvinceId && selectedRegionId) {
      const mun = municipalities.find(m => m.id === selectedMunicipalityId);
      const prov = provinces.find(p => p.id === selectedProvinceId);
      const reg = regions.find(r => r.id === selectedRegionId);
      if (mun && prov && reg) {
        label = `${mun.name}, ${prov.name} · ${reg.code}`;
      }
    } else if (selectedProvinceId && selectedRegionId) {
      const prov = provinces.find(p => p.id === selectedProvinceId);
      const reg = regions.find(r => r.id === selectedRegionId);
      if (prov && reg) {
        label = `${prov.name} · ${reg.code}`;
      }
    } else if (selectedRegionId) {
      const reg = regions.find(r => r.id === selectedRegionId);
      if (reg) {
        label = reg.name;
      }
    }

    const newTerritory: PublicTerritory = {
      regionId: selectedRegionId,
      provinceId: selectedProvinceId,
      municipalityId: selectedMunicipalityId,
      label
    };

    setCookie('lgf_territory', serializeTerritoryCookie(newTerritory));
    setIsOpen(false);
    
    // Full refresh to reload the route using server components
    window.location.reload();
  };

  // Reset to Argentina
  const handleReset = () => {
    setSelectedRegionId(null);
    setSelectedProvinceId(null);
    setSelectedMunicipalityId(null);
    
    setCookie('lgf_territory', serializeTerritoryCookie(DEFAULT_TERRITORY));
    setIsOpen(false);
    window.location.reload();
  };

  const isArgentina = !selectedRegionId && !selectedProvinceId && !selectedMunicipalityId;
  const activeLabel = currentTerritory.label || 'Argentina';

  return (
    <div className="relative flex flex-col items-center z-40" ref={panelRef}>
      {/* Active Scope Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-2 px-4 py-1.5 bg-[#fcf8f2] hover:bg-[#f6efe4] border border-stone-beige/80 hover:border-muted-amber rounded-full text-xs font-semibold text-stone-750 transition-all duration-300 shadow-xs cursor-pointer"
      >
        <span className="text-earth-red select-none text-sm group-hover:scale-110 transition-transform duration-300">📍</span>
        <span className="tracking-wide">
          Explorando: <strong className="text-charcoal font-bold">{activeLabel}</strong>
        </span>
        <svg
          className={`w-3.5 h-3.5 text-stone-400 group-hover:text-earth-red transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Interactive Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full max-w-sm sm:max-w-md bg-[#fdfbf9] border border-stone-beige rounded-lg shadow-xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center border-b border-stone-beige/60 pb-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-stone-500">
              Seleccionar Territorio
            </h3>
            {!isArgentina && (
              <button
                onClick={handleReset}
                className="text-[10px] uppercase font-bold text-earth-red hover:underline cursor-pointer"
              >
                Volver a Argentina
              </button>
            )}
          </div>

          {loadingCatalogs ? (
            <div className="text-center py-6 text-xs text-stone-500 italic">
              Cargando ubicaciones...
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Region Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Región
                </label>
                <select
                  value={selectedRegionId || ''}
                  onChange={(e) => handleRegionChange(e.target.value ? e.target.value : null)}
                  className="w-full text-xs bg-white border border-stone-beige rounded px-2.5 py-2 text-charcoal outline-none focus:border-earth-red"
                >
                  <option value="">Nacional / Todas las regiones</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} ({reg.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Province Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Provincia
                </label>
                <select
                  value={selectedProvinceId || ''}
                  onChange={(e) => handleProvinceChange(e.target.value ? e.target.value : null)}
                  className="w-full text-xs bg-white border border-stone-beige rounded px-2.5 py-2 text-charcoal outline-none focus:border-earth-red"
                >
                  <option value="">Todas las provincias</option>
                  {filteredProvinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Municipality Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Municipio / Localidad
                </label>
                <select
                  value={selectedMunicipalityId || ''}
                  onChange={(e) => setSelectedMunicipalityId(e.target.value ? e.target.value : null)}
                  disabled={!selectedProvinceId || loadingMunicipalities}
                  className="w-full text-xs bg-white border border-stone-beige rounded px-2.5 py-2 text-charcoal outline-none focus:border-earth-red disabled:opacity-50"
                >
                  <option value="">
                    {loadingMunicipalities
                      ? 'Cargando localidades...'
                      : !selectedProvinceId
                      ? 'Seleccioná una provincia primero'
                      : 'Todas las localidades'}
                  </option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.id}>
                      {mun.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply / Cancel Actions */}
              <div className="flex gap-2.5 mt-3 pt-3 border-t border-stone-beige/60">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-stone-beige text-[10px] uppercase font-bold tracking-wider rounded text-stone-600 bg-white hover:bg-stone-50 transition-colors duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-earth-red text-white text-[10px] uppercase font-bold tracking-wider rounded hover:bg-earth-red/90 transition-colors duration-200 shadow-xs cursor-pointer"
                >
                  Aplicar filtro
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
