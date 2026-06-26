import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminEphemeridesList, AdminEphemeris } from '../../../lib/admin/admin-ephemerides';
import { formatHistoricalDate } from '../../../lib/utils/date';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Efemérides',
  description: 'Gestión editorial de efemérides de La Gauchita Federal',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  published: { text: 'Publicado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazado', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Público',
  private: 'Privado',
};

interface AdminEphemeridesPageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminEphemeridesPage({ searchParams }: AdminEphemeridesPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  
  const allowedOrders = ['event_date_asc', 'event_date_desc', 'updated_at_desc', 'title_asc'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'event_date_asc';

  let ephemerides: AdminEphemeris[] = [];
  let isError = false;

  try {
    const rawEphemerides = await getAdminEphemeridesList();
    let filtered = rawEphemerides;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((e) => e.status === selectedStatus);
    }

    // 2. Filter by Search Query (title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((e) => e.title?.toLowerCase().includes(query));
    }

    // 3. Sort
    if (selectedOrder === 'event_date_asc') {
      filtered = [...filtered].sort((a, b) => a.event_date.localeCompare(b.event_date));
    } else if (selectedOrder === 'event_date_desc') {
      filtered = [...filtered].sort((a, b) => b.event_date.localeCompare(a.event_date));
    } else if (selectedOrder === 'updated_at_desc') {
      filtered = [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (selectedOrder === 'title_asc') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    ephemerides = filtered;
  } catch (error) {
    console.error('Error loading ephemerides:', error);
    isError = true;
  }

  // Helper to format territory label
  const getTerritoryLabel = (e: AdminEphemeris) => {
    if (e.municipality?.name) return `${e.municipality.name}, ${e.province?.name || ''}`;
    if (e.province?.name) return e.province.name;
    if (e.region?.name) return e.region.name;
    return 'Nacional';
  };

  return (
    <AdminShell>
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Efemérides"
          description="Gestión de hitos históricos, efemérides y tradiciones vinculadas a fechas y territorios."
          inPreparation={false}
        />
        <div className="flex justify-start gap-3">
          <Link
            href="/admin/efemerides/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVA EFEM\u00c9RIDE
          </Link>
          <Link
            href="/admin/efemerides/importar"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md transition-colors duration-200 font-mono shadow-sm"
          >
            IMPORTAR CSV
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Success alerts */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              Los cambios fueron guardados correctamente.
            </p>
          </div>
        )}

        {isCreated && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              La efeméride fue creada correctamente.
            </p>
          </div>
        )}

        {/* Filter and Search Form */}
        <form method="GET" action="/admin/efemerides" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="q" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Buscar por título:
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={searchQuery}
                placeholder="Escribí el título de la efeméride..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono"
              />
            </div>
            
            {/* Order Select */}
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
                <option value="event_date_asc">Fecha histórica (más antigua primero)</option>
                <option value="event_date_desc">Fecha histórica (más reciente primero)</option>
                <option value="updated_at_desc">Última actualización</option>
                <option value="title_asc">Título A–Z</option>
              </select>
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
              Filtrar por estado editorial:
            </span>
            <input type="hidden" name="estado" value={selectedStatus} />
            <div className="flex flex-wrap gap-1.5">
              {['todos', 'draft', 'review', 'published', 'archived'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/efemerides?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <span className="text-[11px] font-mono font-bold text-stone-650">
              Mostrando {ephemerides.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'event_date_asc') && (
                <Link
                  href="/admin/efemerides"
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
            No se pudieron cargar las efemérides.
          </p>
        </div>
      ) : ephemerides.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay efemérides que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 border-collapse font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4">Fecha Histórica</th>
                  <th className="p-4">Territorio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Visibilidad</th>
                  <th className="p-4 text-center">Destacado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {ephemerides.map((e) => {
                  const statusInfo = STATUS_LABELS[e.status] || {
                    text: e.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };

                  return (
                    <tr key={e.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/efemerides/${e.id}/editar`}
                            className="font-serif font-bold text-sm text-charcoal hover:text-earth-red transition-colors duration-150 leading-snug"
                          >
                            {e.title}
                          </Link>
                          <span className="text-[10px] text-stone-400 font-mono select-all">
                            {e.slug}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-stone-650">
                        {formatHistoricalDate(e.event_date)}
                      </td>
                      <td className="p-4 font-mono text-stone-600">
                        {getTerritoryLabel(e)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-stone-500">
                        {VISIBILITY_LABELS[e.visibility] || e.visibility}
                      </td>
                      <td className="p-4 text-center font-mono font-bold">
                        {e.is_featured ? (
                          <span className="text-earth-red">SÍ</span>
                        ) : (
                          <span className="text-stone-400">NO</span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-3 font-mono text-[11px] font-bold">
                          <Link
                            href={`/admin/efemerides/${e.id}/editar`}
                            className="text-stone-700 hover:text-earth-red transition-colors duration-150 border-b border-transparent hover:border-earth-red"
                          >
                            EDITAR
                          </Link>
                          {e.status === 'published' && e.visibility === 'public' && (
                            <Link
                              href={`/contenidos/${e.slug}`}
                              target="_blank"
                              className="text-earth-red hover:text-earth-red/80 transition-colors duration-150 border-b border-transparent hover:border-earth-red"
                            >
                              VER PÚBLICO
                            </Link>
                          )}
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
