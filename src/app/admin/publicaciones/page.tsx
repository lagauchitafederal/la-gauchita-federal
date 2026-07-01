import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminPublicationsList, AdminPublication } from '../../../lib/admin/admin-publications';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Publicaciones Culturales',
  description: 'Gestión de libros, discos y obras especiales del Instituto Cultural Andino.',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  published: { text: 'Publicada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  archived: { text: 'Archivada', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazada', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Público',
  subscribers: 'Suscriptores',
  institutional: 'Institucional',
  private: 'Privado',
};

const TYPE_LABELS: Record<string, string> = {
  book: 'Libro',
  album: 'Disco/Álbum',
  special_work: 'Obra Especial',
};

interface AdminPublicationsPageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; tipo?: string; q?: string; orden?: string }>;
}

export default async function AdminPublicationsPage({ searchParams }: AdminPublicationsPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  const selectedStatus = params.estado || 'todos';
  const selectedType = params.tipo || 'todos';
  const searchQuery = params.q || '';
  const allowedOrders = ['title_asc', 'title_desc', 'year_desc', 'year_asc', 'created_desc', 'featured_first'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'created_desc';

  let publications: AdminPublication[] = [];
  let isError = false;

  try {
    const rawPublications = await getAdminPublicationsList();
    let filtered = rawPublications;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // 2. Filter by Type
    if (selectedType !== 'todos') {
      filtered = filtered.filter((p) => p.publication_type === selectedType);
    }

    // 3. Filter by Search Query (title, author_text, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const titleMatch = p.title?.toLowerCase().includes(query);
        const authorMatch = p.author_text?.toLowerCase().includes(query);
        const descriptionMatch = p.short_description?.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query);
        return titleMatch || authorMatch || descriptionMatch;
      });
    }

    // 4. Sort
    filtered = [...filtered].sort((a, b) => {
      if (selectedOrder === 'title_asc') {
        return a.title.localeCompare(b.title);
      } else if (selectedOrder === 'title_desc') {
        return b.title.localeCompare(a.title);
      } else if (selectedOrder === 'year_desc') {
        return (b.publication_year || 0) - (a.publication_year || 0);
      } else if (selectedOrder === 'year_asc') {
        return (a.publication_year || 0) - (b.publication_year || 0);
      } else if (selectedOrder === 'featured_first') {
        if (a.is_featured !== b.is_featured) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        return a.sort_order - b.sort_order;
      }
      // default: created_desc
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });

    publications = filtered;
  } catch (error) {
    console.error('Error loading admin publications list:', error);
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Catálogo de Publicaciones Culturales"
          description="Gestión de libros, discos y obras especiales editadas por el Instituto Cultural Andino u otras entidades."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/publicaciones/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVA PUBLICACIÓN
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Success messages */}
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
              La publicación fue creada correctamente.
            </p>
          </div>
        )}

        {/* Search, Filter, and Sort Form */}
        <form method="GET" action="/admin/publicaciones" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
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
                placeholder="Escriba título, autor, descripción..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono"
              />
            </div>

            {/* Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tipo" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Tipo:
              </label>
              <select
                id="tipo"
                name="tipo"
                defaultValue={selectedType}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-700 bg-white"
              >
                <option value="todos">Todos</option>
                <option value="book">Libros</option>
                <option value="album">Discos/Álbumes</option>
                <option value="special_work">Obras Especiales</option>
              </select>
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
                <option value="created_desc">Fecha de creación (Reciente)</option>
                <option value="title_asc">Título (A-Z)</option>
                <option value="title_desc">Título (Z-A)</option>
                <option value="year_desc">Año (Reciente)</option>
                <option value="year_asc">Año (Antiguo)</option>
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
              {['todos', 'draft', 'review', 'published', 'archived', 'rejected'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/publicaciones?estado=${st}&tipo=${selectedType}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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
              Mostrando {publications.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedType !== 'todos' || selectedOrder !== 'created_desc') && (
                <Link
                  href="/admin/publicaciones"
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
            No se pudieron cargar las publicaciones del catálogo.
          </p>
        </div>
      ) : publications.length === 0 ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center shadow-sm">
          <p className="text-stone-500 text-sm italic font-mono">
            No hay publicaciones que coincidan con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-beige rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Autor / Creador</th>
                  <th className="p-4">Año</th>
                  <th className="p-4">Visibilidad</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {publications.map((pub) => {
                  const statusInfo = STATUS_LABELS[pub.status] || {
                    text: pub.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };

                  return (
                    <tr key={pub.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {pub.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono mt-0.5">
                            Slug: {pub.slug}
                          </span>
                          {pub.institutions?.name && (
                            <span className="text-[10px] text-stone-500 font-mono mt-0.5">
                              Editorial: {pub.institutions.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="p-4 font-mono text-stone-600">
                        {TYPE_LABELS[pub.publication_type] || pub.publication_type}
                      </td>

                      {/* Autor */}
                      <td className="p-4 font-serif text-stone-700">
                        {pub.author_text || <span className="text-stone-400 italic">Desconocido</span>}
                      </td>

                      {/* Año */}
                      <td className="p-4 font-mono text-stone-600">
                        {pub.publication_year || <span className="text-stone-400">-</span>}
                      </td>

                      {/* Visibilidad */}
                      <td className="p-4 font-mono text-stone-650">
                        {VISIBILITY_LABELS[pub.visibility] || pub.visibility}
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
                            href={`/admin/publicaciones/${pub.id}/editar`}
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
