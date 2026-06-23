import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminPeopleList, AdminPersonListItem } from '../../../lib/admin/admin-people';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Personajes',
  description: 'Gestión editorial de personajes históricos y referentes culturales de La Gauchita Federal',
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
  subscribers: 'Suscriptores',
  institutional: 'Institucional',
  private: 'Privado',
};

const PERSON_TYPE_LABELS: Record<string, string> = {
  historical_figure: 'Prócer / Fig. Histórica',
  writer: 'Escritor/a',
  poet: 'Poeta/Poetisa',
  historian: 'Historiador/a',
  musician: 'Músico/a',
  singer: 'Cantante',
  artist: 'Artista',
  artisan: 'Artesano/a',
  educator: 'Educador/a',
  researcher: 'Investigador/a',
  public_figure: 'Figura Pública',
  cultural_referent: 'Ref. Cultural',
  other: 'Otro / Popular'
};

interface AdminPeoplePageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminPeoplePage({ searchParams }: AdminPeoplePageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  
  const allowedOrders = ['name_asc', 'name_desc', 'created_desc', 'featured_desc'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'name_asc';

  let people: AdminPersonListItem[] = [];
  let isError = false;

  try {
    const rawPeople = await getAdminPeopleList();
    let filtered = rawPeople;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // 2. Filter by Search Query (name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => p.full_name?.toLowerCase().includes(query));
    }

    // 3. Sort
    if (selectedOrder === 'name_asc') {
      filtered = [...filtered].sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (selectedOrder === 'name_desc') {
      filtered = [...filtered].sort((a, b) => b.full_name.localeCompare(a.full_name));
    } else if (selectedOrder === 'created_desc') {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (selectedOrder === 'featured_desc') {
      filtered = [...filtered].sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        return a.full_name.localeCompare(b.full_name);
      });
    }

    people = filtered;
  } catch (error) {
    console.error('Error loading people:', error);
    isError = true;
  }

  // Helper to format territory label
  const getTerritoryLabel = (p: AdminPersonListItem) => {
    if (p.municipalities?.name) return `${p.municipalities.name}, ${p.provinces?.name || ''}`;
    if (p.provinces?.name) return p.provinces.name;
    if (p.regions?.name) return p.regions.name;
    return 'Nacional';
  };

  // Helper to format dates nicely
  const getLifeSpanLabel = (p: AdminPersonListItem) => {
    if (!p.birth_date && !p.death_date) return 'Sin fecha';
    const birth = p.birth_date ? p.birth_date.split('-')[0] : '¿?';
    const death = p.death_date ? p.death_date.split('-')[0] : 'Presente';
    return `${birth} – ${death}`;
  };

  return (
    <AdminShell>
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Personajes"
          description="Gestión de figuras históricas, escritores, artistas, educadores y referentes populares de Argentina."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/personajes/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVO PERSONAJE
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
              El personaje fue creado correctamente.
            </p>
          </div>
        )}

        {/* Filter and Search Form */}
        <form method="GET" action="/admin/personajes" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="q" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Buscar por nombre:
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={searchQuery}
                placeholder="Escribí el nombre del personaje..."
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
                <option value="name_asc">Nombre (A–Z)</option>
                <option value="name_desc">Nombre (Z–A)</option>
                <option value="created_desc">Fecha de creación</option>
                <option value="featured_desc">Destacados primero</option>
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
                const href = `/admin/personajes?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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
              Mostrando {people.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'name_asc') && (
                <Link
                  href="/admin/personajes"
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
            No se pudieron cargar los personajes.
          </p>
        </div>
      ) : people.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay personajes que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 border-collapse font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Nombre Completo</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Fechas</th>
                  <th className="p-4">Territorio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Visibilidad</th>
                  <th className="p-4 text-center">Destacado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {people.map((p) => {
                  const statusInfo = STATUS_LABELS[p.status] || {
                    text: p.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/personajes/${p.id}/editar`}
                            className="font-serif font-bold text-sm text-charcoal hover:text-earth-red transition-colors duration-150 leading-snug"
                          >
                            {p.full_name}
                          </Link>
                          <span className="text-[10px] text-stone-400 font-mono select-all">
                            {p.slug}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-stone-650">
                        {PERSON_TYPE_LABELS[p.person_type] || p.person_type}
                      </td>
                      <td className="p-4 font-mono text-stone-600 whitespace-nowrap">
                        {getLifeSpanLabel(p)}
                      </td>
                      <td className="p-4 font-mono text-stone-600">
                        {getTerritoryLabel(p)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-stone-500">
                        {VISIBILITY_LABELS[p.visibility] || p.visibility}
                      </td>
                      <td className="p-4 text-center font-mono font-bold">
                        {p.is_featured ? (
                          <span className="text-earth-red">SÍ</span>
                        ) : (
                          <span className="text-stone-400">NO</span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-3 font-mono text-[11px] font-bold">
                          <Link
                            href={`/admin/personajes/${p.id}/editar`}
                            className="text-stone-700 hover:text-earth-red transition-colors duration-150 border-b border-transparent hover:border-earth-red"
                          >
                            EDITAR
                          </Link>
                          {p.status === 'published' && p.visibility === 'public' && (
                            <Link
                              href={`/personajes/${p.slug}`}
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
