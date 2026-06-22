import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminRecognitionsList, AdminRecognition } from '../../../lib/admin/admin-recognitions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Reconocimientos - Búsqueda y Filtros',
  description: 'Gestión de trayectoria, premios y avales de La Gauchita Federal',
};

const RECOGNITION_TYPES: Record<string, string> = {
  award: 'Premio',
  mention: 'Mención',
  declaration: 'Declaración',
  endorsement: 'Aval',
  distinction: 'Distinción',
  homage: 'Homenaje',
  certification: 'Certificación',
  press: 'Prensa',
  participation: 'Participación',
  other: 'Otro',
};

const ENTITY_TYPES: Record<string, string> = {
  person: 'Persona',
  magazine: 'Revista',
  institute: 'Instituto',
  project: 'Proyecto',
  book: 'Libro',
  music_album: 'Álbum',
  institution: 'Institución',
  content: 'Contenido',
  event: 'Evento',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  active: { text: 'Activo', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazado', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

interface AdminReconocimientosPageProps {
  searchParams: Promise<{ guardado?: string; creado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminReconocimientosPage({ searchParams }: AdminReconocimientosPageProps) {
  const params = await searchParams;
  const isSaved = params.guardado === '1';
  const isCreated = params.creado === '1';
  
  // Extract and validate parameters
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  const allowedOrders = ['newest', 'oldest', 'title_asc', 'title_desc', 'recognition_date_desc', 'recognition_date_asc', 'featured_first'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'newest';

  let recognitions: AdminRecognition[] = [];
  let isError = false;

  try {
    const rawRecognitions = await getAdminRecognitionsList();
    let filtered = rawRecognitions;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }

    // 2. Filter by Search Query (title, slug, recognition_type, granting_institution_name, source_reference)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((r) => {
        const titleMatch = r.title?.toLowerCase().includes(query);
        const slugMatch = r.slug?.toLowerCase().includes(query);
        const typeLabel = RECOGNITION_TYPES[r.recognition_type] || r.recognition_type;
        const typeMatch = typeLabel.toLowerCase().includes(query) || r.recognition_type?.toLowerCase().includes(query);
        const grantingMatch = r.granting_institution_name?.toLowerCase().includes(query);
        const sourceMatch = r.source_reference?.toLowerCase().includes(query);
        return titleMatch || slugMatch || typeMatch || grantingMatch || sourceMatch;
      });
    }

    // 3. Sort (Database is newest first by default)
    if (selectedOrder === 'oldest') {
      filtered = [...filtered].reverse();
    } else if (selectedOrder === 'title_asc') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    } else if (selectedOrder === 'title_desc') {
      filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
    } else if (selectedOrder === 'recognition_date_desc') {
      filtered = [...filtered].sort((a, b) => {
        const da = a.recognition_date ? new Date(a.recognition_date).getTime() : 0;
        const db = b.recognition_date ? new Date(b.recognition_date).getTime() : 0;
        return db - da;
      });
    } else if (selectedOrder === 'recognition_date_asc') {
      filtered = [...filtered].sort((a, b) => {
        const da = a.recognition_date ? new Date(a.recognition_date).getTime() : 0;
        const db = b.recognition_date ? new Date(b.recognition_date).getTime() : 0;
        return da - db;
      });
    } else if (selectedOrder === 'featured_first') {
      filtered = [...filtered].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    recognitions = filtered;
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Reconocimientos"
          description="Administración de premios, menciones, homenajes, certificados y distinciones oficiales."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/reconocimientos/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            NUEVO RECONOCIMIENTO
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
              El reconocimiento fue creado correctamente.
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
        <form method="GET" action="/admin/reconocimientos" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
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
                placeholder="Escriba título, otorgante, tipo o referencia..."
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
                <option value="recognition_date_desc">Fecha de otorgamiento (Reciente)</option>
                <option value="recognition_date_asc">Fecha de otorgamiento (Antiguo)</option>
                <option value="featured_first">Destacados primero</option>
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
              {['todos', 'draft', 'review', 'active', 'rejected', 'archived'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/reconocimientos?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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
              Mostrando {recognitions.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'newest') && (
                <Link
                  href="/admin/reconocimientos"
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
            No se pudieron cargar los reconocimientos.
          </p>
        </div>
      ) : recognitions.length === 0 ? (
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
                  <th className="p-4">Tipo</th>
                  <th className="p-4 hidden sm:table-cell">Entidad Reconocida</th>
                  <th className="p-4 hidden md:table-cell">Otorgante</th>
                  <th className="p-4 hidden sm:table-cell">Fecha</th>
                  <th className="p-4 hidden md:table-cell">Localidad</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {recognitions.map((rec) => {
                  const statusInfo = STATUS_LABELS[rec.status] || {
                    text: rec.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };
                  const typeLabel = RECOGNITION_TYPES[rec.recognition_type] || rec.recognition_type;
                  const entityLabel = ENTITY_TYPES[rec.recognized_entity_type] || rec.recognized_entity_type;

                  return (
                    <tr key={rec.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {rec.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono md:hidden mt-0.5">
                            Slug: {rec.slug}
                          </span>
                          {rec.location && (
                            <span className="text-[10px] text-stone-500 md:hidden font-mono mt-0.5">
                              Localidad: {rec.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="p-4">
                        <span className="bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide font-mono text-stone-600">
                          {typeLabel}
                        </span>
                      </td>

                      {/* Entidad Reconocida */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-600">
                        <span className="text-[10px] bg-earth-red/5 text-earth-red border border-earth-red/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {entityLabel}
                        </span>
                      </td>

                      {/* Otorgante */}
                      <td className="p-4 hidden md:table-cell font-medium text-stone-700">
                        {rec.granting_institution_name || <span className="text-stone-400 italic">No especificada</span>}
                      </td>

                      {/* Fecha */}
                      <td className="p-4 hidden sm:table-cell font-mono text-stone-500">
                        {rec.recognition_date ? (
                          new Date(rec.recognition_date).toLocaleDateString()
                        ) : (
                          <span className="text-stone-400 italic">-</span>
                        )}
                      </td>

                      {/* Localidad (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500">
                        {rec.location || <span className="text-stone-400 italic">No especificada</span>}
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
                          <a
                            href={`/reconocimientos/${rec.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-28 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150 text-center"
                          >
                            VER PÚBLICO
                          </a>
                          <Link
                            href={`/admin/reconocimientos/${rec.id}/editar`}
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
