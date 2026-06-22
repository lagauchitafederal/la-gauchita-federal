import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminInstitutionsList, AdminInstitution } from '../../../lib/admin/admin-institutions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Instituciones - Búsqueda y Filtros',
  description: 'Gestión de la red cultural e institucional de La Gauchita Federal',
};

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

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  active: { text: 'Activo', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  inactive: { text: 'Inactivo', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
};

interface AdminInstitucionesPageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminInstitucionesPage({ searchParams }: AdminInstitucionesPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  // Extract and validate parameters
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  const allowedOrders = ['newest', 'oldest', 'name_asc', 'name_desc', 'featured_first', 'sort_order'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'newest';

  let institutions: AdminInstitution[] = [];
  let isError = false;

  try {
    const rawInstitutions = await getAdminInstitutionsList();
    let filtered = rawInstitutions;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((i) => i.status === selectedStatus);
    }

    // 2. Filter by Search Query (name, slug, institution_type, website_url)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((i) => {
        const nameMatch = i.name?.toLowerCase().includes(query);
        const slugMatch = i.slug?.toLowerCase().includes(query);
        const typeLabel = TYPE_LABELS[i.institution_type] || i.institution_type;
        const typeMatch = typeLabel.toLowerCase().includes(query) || i.institution_type?.toLowerCase().includes(query);
        const websiteMatch = i.website_url?.toLowerCase().includes(query);
        return nameMatch || slugMatch || typeMatch || websiteMatch;
      });
    }

    // 3. Sort (Database is newest first by default)
    if (selectedOrder === 'oldest') {
      filtered = [...filtered].reverse();
    } else if (selectedOrder === 'name_asc') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedOrder === 'name_desc') {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    } else if (selectedOrder === 'featured_first') {
      filtered = [...filtered].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    } else if (selectedOrder === 'sort_order') {
      filtered = [...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    institutions = filtered;
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Instituciones"
          description="Administración de instituciones participantes o vinculadas al archivo documental."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/instituciones/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVA INSTITUCIÓN
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Aviso de éxito tras guardar */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              Los cambios fueron guardados correctamente.
            </p>
          </div>
        )}

        {/* Aviso de éxito tras crear */}
        {isCreated && (
          <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              La institución fue creada correctamente.
            </p>
          </div>
        )}

        {/* Aviso de edición habilitada */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
            Edición inicial habilitada. El slug, la ubicación territorial y las relaciones se administrarán en una etapa posterior.
          </p>
        </div>

        {/* Formulario de Búsqueda, Filtros y Ordenamiento */}
        <form method="GET" action="/admin/instituciones" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Campo de Búsqueda */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="q" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Buscar por texto:
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={searchQuery}
                placeholder="Escriba nombre, tipo, slug o sitio web..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono"
              />
            </div>
            
            {/* Selector de Orden */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="orden" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Ordenar por:
              </label>
              <select
                id="orden"
                name="orden"
                defaultValue={selectedOrder}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
              >
                <option value="newest">Más recientes primero</option>
                <option value="oldest">Más antiguos primero</option>
                <option value="name_asc">Nombre A–Z</option>
                <option value="name_desc">Nombre Z–A</option>
                <option value="featured_first">Destacadas primero</option>
                <option value="sort_order">Orden de prioridad</option>
              </select>
            </div>

          </div>

          {/* Filtro de Estado (Botones) */}
          <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
              Filtrar por estado:
            </span>
            <input type="hidden" name="estado" value={selectedStatus} />
            <div className="flex flex-wrap gap-1.5">
              {['todos', 'draft', 'active', 'inactive', 'archived'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/instituciones?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
                return (
                  <Link
                    key={st}
                    href={href}
                    className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider font-mono border transition-all duration-250 ${
                      isActive
                        ? 'bg-earth-red text-white border-earth-red shadow-sm'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Resumen, Limpiar y Envío */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <span className="text-[11px] font-mono font-bold text-stone-650">
              Mostrando {institutions.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'newest') && (
                <Link
                  href="/admin/instituciones"
                  className="text-[11px] font-mono font-bold text-stone-500 hover:text-earth-red border-b border-stone-300 hover:border-earth-red transition-all duration-150"
                >
                  Limpiar filtros
                </Link>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-charcoal hover:bg-charcoal/90 text-white text-[10px] uppercase font-bold tracking-wider rounded font-mono transition-colors duration-150"
              >
                Buscar / Aplicar
              </button>
            </div>
          </div>
        </form>

      </div>

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            No se pudieron cargar las instituciones.
          </p>
        </div>
      ) : institutions.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay registros que coincidan con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Nombre</th>
                  <th className="p-4 hidden md:table-cell">Slug</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 hidden sm:table-cell">Ubicación</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 hidden sm:table-cell">Destacada</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {institutions.map((inst) => {
                  const statusInfo = STATUS_LABELS[inst.status] || {
                    text: inst.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };
                  const typeLabel = TYPE_LABELS[inst.institution_type] || inst.institution_type;

                  return (
                    <tr key={inst.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Nombre */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {inst.name}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono md:hidden mt-0.5">
                            Slug: {inst.slug}
                          </span>
                        </div>
                      </td>

                      {/* Slug (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500 max-w-[150px] truncate">
                        {inst.slug}
                      </td>

                      {/* Tipo */}
                      <td className="p-4 font-medium">
                        <span className="bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide font-mono text-stone-600">
                          {typeLabel}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-500">
                        {inst.municipality?.name || inst.province?.name ? (
                          <div className="flex flex-col gap-0.5">
                            {inst.municipality?.name && (
                              <span className="font-medium text-stone-700">{inst.municipality.name}</span>
                            )}
                            {inst.province?.name && (
                              <span className="text-[10px] font-bold text-earth-red uppercase tracking-wider">{inst.province.name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">No especificada</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Destacada */}
                      <td className="p-4 hidden sm:table-cell font-mono">
                        {inst.is_featured ? (
                          <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-250 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Sí
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">No</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col gap-2 justify-center items-end">
                          <a
                            href={`/instituciones/${inst.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-28 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150 text-center"
                          >
                            VER PÚBLICO
                          </a>
                          <Link
                            href={`/admin/instituciones/${inst.id}/editar`}
                            className="inline-flex items-center justify-center w-28 py-1.5 bg-earth-red text-white rounded-md text-[10px] uppercase tracking-wider font-bold hover:bg-earth-red/90 transition-colors duration-150 text-center"
                          >
                            EDITAR
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </AdminShell>
  );
}
