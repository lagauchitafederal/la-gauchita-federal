import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import { getAdminMediaAssetsList, AdminMediaAsset } from '../../../lib/admin/admin-media-assets';
import { getPublicMediaUrl } from '../../../lib/utils/media-url';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración de Archivo Visual - Búsqueda y Filtros',
  description: 'Gestión de recursos multimedia, portadas y certificados de La Gauchita Federal',
};

const ASSET_TYPES: Record<string, string> = {
  cover_image: 'Imagen de Portada',
  content_image: 'Imagen de Contenido',
  gallery_image: 'Imagen de Galería',
  historical_photo: 'Foto Histórica',
  pdf_document: 'Documento PDF',
  magazine_pdf: 'PDF de Revista',
  book_pdf: 'PDF de Libro',
  audio: 'Audio / Grabación',
  teacher_resource: 'Recurso Docente',
  institutional_document: 'Doc. Institucional',
  recognition_document: 'Doc. de Reconocimiento',
  archive_material: 'Material de Archivo',
  other: 'Otro',
};

const RIGHTS_LABELS: Record<string, string> = {
  owned: 'Propio',
  authorized: 'Autorizado',
  public_domain: 'Dominio Público',
  licensed: 'Licenciado',
  pending_review: 'Pendiente de Revisión',
  restricted: 'Restringido',
  unknown: 'Desconocido',
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Público',
  subscribers: 'Suscriptores',
  institutional: 'Institucional',
  private: 'Privado',
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  active: { text: 'Activo', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  draft: { text: 'Borrador', classes: 'bg-stone-100 text-stone-600 border-stone-200/60' },
  review: { text: 'En revisión', classes: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  archived: { text: 'Archivado', classes: 'bg-slate-100 text-slate-600 border-slate-200/60' },
  rejected: { text: 'Rechazado', classes: 'bg-red-50 text-red-700 border-red-200/60' },
};

interface AdminArchivoPageProps {
  searchParams: Promise<{ creado?: string; guardado?: string; estado?: string; q?: string; orden?: string }>;
}

export default async function AdminArchivoPage({ searchParams }: AdminArchivoPageProps) {
  const params = await searchParams;
  const isCreated = params.creado === '1';
  const isSaved = params.guardado === '1';
  
  // Extract and validate parameters
  const selectedStatus = params.estado || 'todos';
  const searchQuery = params.q || '';
  const allowedOrders = ['newest', 'oldest', 'title_asc', 'title_desc', 'asset_type', 'status'];
  const selectedOrder = allowedOrders.includes(params.orden || '') ? params.orden! : 'newest';

  let assets: AdminMediaAsset[] = [];
  let isError = false;

  try {
    const rawAssets = await getAdminMediaAssetsList();
    let filtered = rawAssets;

    // 1. Filter by Status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((a) => a.status === selectedStatus);
    }

    // 2. Filter by Search Query (title, original_filename, credit, source_reference, storage_path)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((a) => {
        const titleMatch = a.title?.toLowerCase().includes(query);
        const filenameMatch = a.original_filename?.toLowerCase().includes(query);
        const creditMatch = a.credit?.toLowerCase().includes(query);
        const sourceMatch = a.source_reference?.toLowerCase().includes(query);
        const pathMatch = a.storage_path?.toLowerCase().includes(query);
        return titleMatch || filenameMatch || creditMatch || sourceMatch || pathMatch;
      });
    }

    // 3. Sort (Database is newest first by default)
    if (selectedOrder === 'oldest') {
      filtered = [...filtered].reverse();
    } else if (selectedOrder === 'title_asc') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    } else if (selectedOrder === 'title_desc') {
      filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
    } else if (selectedOrder === 'asset_type') {
      filtered = [...filtered].sort((a, b) => a.asset_type.localeCompare(b.asset_type));
    } else if (selectedOrder === 'status') {
      filtered = [...filtered].sort((a, b) => a.status.localeCompare(b.status));
    }

    assets = filtered;
  } catch (error) {
    isError = true;
  }

  return (
    <AdminShell>
      
      {/* Module Header and Create Button */}
      <div className="flex flex-col gap-4">
        <AdminSectionHeader
          title="Archivo visual"
          description="Administración de imágenes, documentos, certificados, portadas y materiales de archivo."
          inPreparation={false}
        />
        <div className="flex justify-start">
          <Link
            href="/admin/archivo/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-earth-red text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-earth-red/90 transition-colors duration-200 font-mono shadow-sm"
          >
            SUBIR ARCHIVO
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Aviso de éxito tras crear */}
        {isCreated && (
          <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              El archivo fue registrado correctamente.
            </p>
          </div>
        )}

        {/* Aviso de éxito tras editar */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-md">
            <p className="text-xs text-emerald-800 font-bold font-mono">
              Los cambios fueron guardados correctamente.
            </p>
          </div>
        )}

        {/* Aviso de edición habilitada */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
            Carga de archivos habilitada. Puede subir archivos de hasta 10 MB y asociarlos con contenidos o instituciones.
          </p>
        </div>

        {/* Formulario de Búsqueda, Filtros y Ordenamiento */}
        <form method="GET" action="/admin/archivo" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-col gap-4 shadow-sm">
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
                placeholder="Escriba título, crédito, nombre original o fuente..."
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
                <option value="asset_type">Tipo de recurso</option>
                <option value="status">Estado del archivo</option>
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
              {['todos', 'draft', 'active', 'archived'].map((st) => {
                const isActive = selectedStatus === st;
                const label = st === 'todos' ? 'Todos' : STATUS_LABELS[st]?.text || st;
                const href = `/admin/archivo?estado=${st}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}&orden=${selectedOrder}`;
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
              Mostrando {assets.length} registros
            </span>
            
            <div className="flex items-center gap-3">
              {(searchQuery || selectedStatus !== 'todos' || selectedOrder !== 'newest') && (
                <Link
                  href="/admin/archivo"
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
            No se pudieron cargar los archivos.
          </p>
        </div>
      ) : assets.length === 0 ? (
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
                  <th className="p-4 min-w-[50px] text-center">Vista Previa</th>
                  <th className="p-4 min-w-[200px]">Título</th>
                  <th className="p-4 hidden sm:table-cell">Tipo / Mime</th>
                  <th className="p-4 hidden md:table-cell">Derechos / Visibilidad</th>
                  <th className="p-4 hidden sm:table-cell">Crédito</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 hidden md:table-cell">Creado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {assets.map((c) => {
                  const statusInfo = STATUS_LABELS[c.status] || {
                    text: c.status,
                    classes: 'bg-stone-100 text-stone-600 border-stone-200/60',
                  };
                  const typeLabel = ASSET_TYPES[c.asset_type] || c.asset_type;
                  const rightsLabel = RIGHTS_LABELS[c.rights_status] || c.rights_status;
                  const visibilityLabel = VISIBILITY_LABELS[c.visibility] || c.visibility;
                  
                  const publicUrl = getPublicMediaUrl(c.bucket_name, c.storage_path);
                  const isImage = c.mime_type?.startsWith('image/') || ['cover_image', 'content_image', 'gallery_image', 'historical_photo'].includes(c.asset_type);

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      
                      {/* Vista Previa */}
                      <td className="p-4 text-center">
                        {isImage && publicUrl ? (
                          <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative inline-block w-10 h-10 bg-stone-100 border border-stone-200 rounded overflow-hidden group hover:border-earth-red transition-colors duration-150"
                          >
                            <img
                              src={publicUrl}
                              alt={c.alt_text || c.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </a>
                        ) : (
                          <div className="w-10 h-10 bg-stone-100 border border-stone-200 rounded flex items-center justify-center text-[10px] text-stone-400 font-mono">
                            Doc
                          </div>
                        )}
                      </td>

                      {/* Título */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-bold text-charcoal text-sm leading-snug">
                            {c.title}
                          </span>
                          {c.original_filename && (
                            <span className="text-[10px] text-stone-400 font-mono mt-0.5 max-w-[200px] truncate">
                              Original: {c.original_filename}
                            </span>
                          )}
                          <span className="text-[9px] text-stone-400 font-mono md:hidden mt-0.5">
                            Path: {c.storage_path}
                          </span>
                        </div>
                      </td>

                      {/* Tipo / Mime */}
                      <td className="p-4 hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-stone-700">{typeLabel}</span>
                          {c.mime_type && (
                            <span className="text-[10px] text-stone-400 font-mono">{c.mime_type}</span>
                          )}
                        </div>
                      </td>

                      {/* Derechos / Visibilidad (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">
                            {rightsLabel}
                          </span>
                          <span className="text-[10px] text-earth-red font-bold">
                            {visibilityLabel}
                          </span>
                        </div>
                      </td>

                      {/* Crédito */}
                      <td className="p-4 hidden sm:table-cell font-medium text-stone-600">
                        {c.credit || <span className="text-stone-400 italic">Sin crédito</span>}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider font-mono ${statusInfo.classes}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Creado (Desktop only) */}
                      <td className="p-4 hidden md:table-cell font-mono text-stone-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right font-mono">
                        <div className="flex justify-end items-center gap-3">
                          <Link
                            href={`/admin/archivo/${c.id}/editar`}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-700 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150"
                          >
                            EDITAR
                          </Link>
                          {publicUrl ? (
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-stone-beige rounded-md text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-earth-red hover:border-earth-red/30 transition-colors duration-150"
                            >
                              {isImage ? 'Abrir imagen' : 'Abrir archivo'}
                            </a>
                          ) : (
                            <span className="text-stone-400 italic font-mono">-</span>
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
