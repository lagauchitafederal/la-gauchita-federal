import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminMagazinesList, AdminMagazine } from '../../../lib/admin/admin-magazines';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Revista Digital',
  description: 'Gestión de ejemplares, números y tomos de Revista La Gauchita.',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  published: { text: 'Publicada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  archived: { text: 'Archivada', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Público',
  subscribers: 'Suscriptores',
  institutional: 'Institucional',
  private: 'Privado',
};

interface AdminRevistaPageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminRevistaPage({ searchParams }: AdminRevistaPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  const allowedOrders = ['number_desc', 'number_asc', 'year_desc', 'year_asc', 'date_desc', 'featured_first'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'number_desc';

  let editions: AdminMagazine[] = [];
  let isError = false;

  try {
    const rawEditions = await getAdminMagazinesList();
    let filtered = rawEditions;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((e) => e.status === selectedStatus);
    }

    // 2. Filter by Search Query (title, edition_number, volume)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((e) => {
        const titleMatch = e.title?.toLowerCase().includes(query);
        const numberMatch = e.edition_number.toString().includes(query);
        const volumeMatch = e.volume?.toLowerCase().includes(query);
        return titleMatch || numberMatch || volumeMatch;
      });
    }

    // 3. Sort
    filtered = [...filtered].sort((a, b) => {
      if (selectedOrder === 'number_asc') {
        return a.edition_number - b.edition_number;
      } else if (selectedOrder === 'number_desc') {
        return b.edition_number - a.edition_number;
      } else if (selectedOrder === 'year_desc') {
        return b.publication_year - a.publication_year;
      } else if (selectedOrder === 'year_asc') {
        return a.publication_year - b.publication_year;
      } else if (selectedOrder === 'date_desc') {
        const da = a.publication_date ? new Date(a.publication_date).getTime() : 0;
        const db = b.publication_date ? new Date(b.publication_date).getTime() : 0;
        return db - da;
      } else if (selectedOrder === 'featured_first') {
        if (a.is_featured !== b.is_featured) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        return b.edition_number - a.edition_number; // tie breaker
      }
      return b.edition_number - a.edition_number;
    });

    editions = filtered;
  } catch (error) {
    console.error('Error loading admin magazines list:', error);
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Revista Digital"
          description="Administración de ediciones históricas y números de Revista La Gauchita."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/revista/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVA EDICIÓN
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Success message after saving */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              Los cambios fueron guardados correctamente.
            </p>
          </div>
        )}

        {/* Success message after creating */}
        {isCreated && (
          <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              La edición de la revista fue creada correctamente.
            </p>
          </div>
        )}

        {/* Editorial warning badge */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
            Edición inicial habilitada. La carga y descarga directa de archivos PDF se realiza a través de la selección de medios existentes.
          </p>
        </div>

        {/* Search, Filter, and Sort Form */}
        <form method="GET" action="/admin/revista" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="q" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Buscar por texto:
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={searchQuery}
                placeholder="Escriba título, número de edición o tomo..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono"
              />
            </div>
            
            {/* Sort Selector */}
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
                <option value="number_desc">Número (Descendente)</option>
                <option value="number_asc">Número (Ascendente)</option>
                <option value="year_desc">Año (Reciente)</option>
                <option value="year_asc">Año (Antiguo)</option>
                <option value="date_desc">Fecha de publicación</option>
                <option value="featured_first">Destacadas primero</option>
              </select>
            </div>

          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
              Filtrar por estado:
            </span>
            <input type="hidden" name="estado" value={selectedStatus} />
            <div className="flex flex-wrap gap-1.5">
              {['todos', 'draft', 'review', 'published', 'archived'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/revista?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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

          {/* Summary and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <span className="text-[11px] font-mono font-bold text-stone-650">
              Mostrando {editions.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'number_desc') && (
                <Link
                  href="/admin/revista"
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
            No se pudieron cargar las ediciones de la revista.
          </p>
        </div>
      ) : editions.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay ediciones que coincidan con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Número</th>
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4">Tomo / Volumen</th>
                  <th className="p-4">Año</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Visibilidad</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {editions.map((ed) => {
                  const statusInfo = STATUS_LABELS[ed.status] || {
                    text: ed.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };

                  return (
                    <tr key={ed.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Número de Edición */}
                      <td className="p-4 font-mono font-bold text-charcoal text-sm">
                        Nº {ed.edition_number}
                        {ed.is_featured && (
                          <span className="ml-2 inline-block text-[8px] bg-amber-100 text-amber-800 border border-amber-250 px-1 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            ★
                          </span>
                        )}
                      </td>

                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {ed.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono mt-0.5">
                            Slug: {ed.slug}
                          </span>
                          {ed.institutions?.name && (
                            <span className="text-[10px] text-stone-500 font-mono mt-0.5">
                              Editor: {ed.institutions.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tomo */}
                      <td className="p-4 font-serif text-stone-700">
                        {ed.volume || <span className="text-stone-450 italic">Sin tomo</span>}
                      </td>

                      {/* Año */}
                      <td className="p-4 font-mono text-stone-600">
                        {ed.publication_year}
                      </td>

                      {/* Fecha */}
                      <td className="p-4 font-mono text-stone-500">
                        {ed.publication_date ? (
                          new Date(ed.publication_date + 'T00:00:00').toLocaleDateString()
                        ) : (
                          <span className="text-stone-450 italic">-</span>
                        )}
                      </td>

                      {/* Visibilidad */}
                      <td className="p-4 font-mono text-stone-600">
                        {VISIBILITY_LABELS[ed.visibility] || ed.visibility}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col gap-2 justify-center items-end">
                          <Link
                            href={`/admin/revista/${ed.id}/editar`}
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
