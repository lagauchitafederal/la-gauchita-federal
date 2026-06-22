import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminContentsList, AdminContent } from '../../../lib/admin/admin-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Contenidos - Búsqueda y Filtros',
  description: 'Gestión editorial y de artículos de La Gauchita Federal',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  published: { text: 'Publicado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazado', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

interface AdminContenidosPageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminContenidosPage({ searchParams }: AdminContenidosPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  // Extract and validate parameters
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  const allowedOrders = ['newest', 'oldest', 'title_asc', 'title_desc'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'newest';

  let contents: AdminContent[] = [];
  let isError = false;

  try {
    const rawContents = await getAdminContentsList();
    let filtered = rawContents;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((c) => c.status === selectedStatus);
    }

    // 2. Filter by Search Query (title, subtitle, slug, summary, author display name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => {
        const titleMatch = c.title?.toLowerCase().includes(query);
        const subtitleMatch = c.subtitle?.toLowerCase().includes(query);
        const slugMatch = c.slug?.toLowerCase().includes(query);
        const summaryMatch = c.summary?.toLowerCase().includes(query);
        const authorMatch = c.author?.display_name?.toLowerCase().includes(query);
        return titleMatch || subtitleMatch || slugMatch || summaryMatch || authorMatch;
      });
    }

    // 3. Sort (Database is newest first by default)
    if (selectedOrder === 'oldest') {
      filtered = [...filtered].reverse();
    } else if (selectedOrder === 'title_asc') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    } else if (selectedOrder === 'title_desc') {
      filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
    }

    contents = filtered;
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Contenidos"
          description="Administración de artículos, efemérides, notas culturales y materiales editoriales."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/contenidos/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVO CONTENIDO
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
              El contenido fue creado correctamente.
            </p>
          </div>
        )}

        {/* Aviso de edición habilitada */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
            Edición inicial habilitada. El slug, las relaciones y los archivos asociados se administrarán en una etapa posterior.
          </p>
        </div>

        {/* Formulario de Búsqueda, Filtros y Ordenamiento */}
        <form method="GET" action="/admin/contenidos" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
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
                placeholder="Escriba título, subtítulo, autor o resumen..."
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
                <option value="title_asc">Título A–Z</option>
                <option value="title_desc">Título Z–A</option>
              </select>
            </div>

          </div>

          {/* Filtro de Estado (Botones) */}
          <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
              Filtrar por estado editorial:
            </span>
            <input type="hidden" name="estado" value={selectedStatus} />
            <div className="flex flex-wrap gap-1.5">
              {['todos', 'draft', 'review', 'published', 'rejected', 'archived'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/contenidos?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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
              Mostrando {contents.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'newest') && (
                <Link
                  href="/admin/contenidos"
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
            No se pudieron cargar los contenidos.
          </p>
        </div>
      ) : contents.length === 0 ? (
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
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4 hidden md:table-cell">Slug</th>
                  <th className="p-4 hidden sm:table-cell">Autor</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 hidden md:table-cell">Tipo / Categoría</th>
                  <th className="p-4 hidden sm:table-cell">Publicación</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {contents.map((c) => {
                  const statusInfo = STATUS_LABELS[c.status] || {
                    text: c.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono md:hidden mt-0.5">
                            Slug: {c.slug}
                          </span>
                        </div>
                      </td>

                      {/* Slug (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500 max-w-[150px] truncate">
                        {c.slug}
                      </td>

                      {/* Autor */}
                      <td className="p-4 hidden sm:table-cell">
                        <span className="font-medium">
                          {c.author?.display_name || <span className="text-stone-400 italic">Sin autor</span>}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Tipo / Categoría (Desktop only) */}
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          {c.content_type?.name && (
                            <span className="text-[10px] uppercase tracking-wide font-bold text-stone-500 font-mono">
                              {c.content_type.name}
                            </span>
                          )}
                          {c.category?.name && (
                            <span className="text-[10px] uppercase tracking-wide font-bold text-earth-red font-mono">
                              {c.category.name}
                            </span>
                          )}
                          {!c.content_type?.name && !c.category?.name && (
                            <span className="text-stone-400 italic font-mono">-</span>
                          )}
                        </div>
                      </td>

                      {/* Fecha de Publicación */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-500">
                        {c.publish_date ? (
                          new Date(c.publish_date).toLocaleDateString()
                        ) : (
                          <span className="text-stone-400 italic">No programada</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col gap-2 justify-center items-end">
                          <a
                            href={`/contenidos/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-28 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150 text-center"
                          >
                            VER PÚBLICO
                          </a>
                          <Link
                            href={`/admin/contenidos/${c.id}/editar`}
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
