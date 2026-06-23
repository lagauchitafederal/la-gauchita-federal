import React from 'react';
import AdminShell from '../../../components/admin/AdminShell';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    action?: string;
    entity?: string;
  }>;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Creación', color: 'bg-green-50 text-green-700 border-green-200' },
  update: { label: 'Edición', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  upload: { label: 'Subida', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const ENTITY_LABELS: Record<string, string> = {
  content: 'Contenido',
  institution: 'Institución',
  recognition: 'Reconocimiento',
  media_asset: 'Archivo Visual',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function renderMetadataSummary(log: any) {
  const meta = log.metadata || {};
  const parts: string[] = [];

  if (meta.status_previo !== undefined || meta.status_nuevo !== undefined) {
    parts.push(`Estado: ${meta.status_previo || 'ninguno'} → ${meta.status_nuevo || 'ninguno'}`);
  }
  if (meta.visibility_previo !== undefined || meta.visibility_nuevo !== undefined) {
    parts.push(`Visibilidad: ${meta.visibility_previo || 'ninguna'} → ${meta.visibility_nuevo || 'ninguna'}`);
  }
  if (meta.original_filename) {
    parts.push(`Archivo: ${meta.original_filename}`);
  }
  if (meta.mime_type) {
    parts.push(`MIME: ${meta.mime_type}`);
  }
  if (meta.file_size_bytes) {
    const sizeKb = (meta.file_size_bytes / 1024).toFixed(1);
    parts.push(`Tamaño: ${sizeKb} KB`);
  }
  if (meta.is_featured !== undefined) {
    parts.push(`Destacado: ${meta.is_featured ? 'Sí' : 'No'}`);
  }

  if (parts.length === 0) {
    return Object.keys(meta).length > 0 ? JSON.stringify(meta) : '-';
  }
  return parts.join(' | ');
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const { action, entity } = await searchParams;

  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      persistSession: false,
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/login');
  }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('roles(code)')
    .eq('profile_id', profile.id);

  const roleCodes: string[] = (userRoles || [])
    .map((ur: any) => {
      if (ur.roles) {
        return Array.isArray(ur.roles) ? ur.roles[0]?.code : ur.roles.code;
      }
      return null;
    })
    .filter(Boolean);

  const isAuthorized = roleCodes.includes('super_admin') || roleCodes.includes('general_admin');

  if (!isAuthorized) {
    return (
      <AdminShell>
        <div className="bg-white border border-stone-beige rounded-lg p-8 text-center max-w-md mx-auto my-12">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-lg font-serif font-black text-charcoal mb-2">Acceso Restringido</h1>
          <p className="text-sm text-stone-600 leading-relaxed font-mono">
            Su nivel de usuario no tiene permisos para ver el historial de actividad administrativa.
          </p>
        </div>
      </AdminShell>
    );
  }

  let dbQuery = supabase
    .from('admin_activity_logs')
    .select(`
      id,
      created_at,
      action_type,
      entity_type,
      entity_id,
      entity_label,
      metadata,
      profiles (
        display_name
      )
    `);

  if (action && action !== 'all') {
    dbQuery = dbQuery.eq('action_type', action);
  }
  if (entity && entity !== 'all') {
    dbQuery = dbQuery.eq('entity_type', entity);
  }

  const { data: logs } = await dbQuery.order('created_at', { ascending: false });
  const activityLogs = logs || [];

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-serif font-black text-charcoal">
            Actividad administrativa
          </h1>
          <p className="text-sm text-stone-500">
            Registro interno de operaciones editoriales y de gestión.
          </p>
        </div>

        {/* Filters Form */}
        <form method="GET" className="bg-white border border-stone-beige rounded-lg p-4 flex flex-wrap items-end gap-4 shadow-sm">
          <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 sm:flex-initial">
            <label htmlFor="entity" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Tipo de Elemento
            </label>
            <select
              id="entity"
              name="entity"
              defaultValue={entity || 'all'}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              <option value="all">Todos</option>
              <option value="content">Contenido</option>
              <option value="institution">Institución</option>
              <option value="recognition">Reconocimiento</option>
              <option value="media_asset">Archivo Visual</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 sm:flex-initial">
            <label htmlFor="action" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Acción
            </label>
            <select
              id="action"
              name="action"
              defaultValue={action || 'all'}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200 font-mono"
            >
              <option value="all">Todas</option>
              <option value="create">Creación</option>
              <option value="update">Edición</option>
              <option value="upload">Subida</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-850 transition-colors duration-200"
          >
            Filtrar
          </button>

          {(action || entity) && (
            <Link
              href="/admin/actividad"
              className="px-4 py-2.5 border border-stone-300 text-stone-600 text-xs uppercase tracking-wider font-bold rounded-md hover:bg-stone-50 transition-colors duration-200 font-mono"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Logs Table */}
        <div className="bg-white border border-stone-beige rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                    Acción
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                    Elemento
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-500 font-mono">
                    Detalle Resumido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activityLogs.map((log: any) => {
                  const actionInfo = ACTION_LABELS[log.action_type] || { label: log.action_type, color: 'bg-stone-100 text-stone-800 border-stone-200' };
                  const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type;
                  const actorName = log.profiles?.display_name || 'Usuario Administrativo';

                  return (
                    <tr key={log.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-xs font-mono text-stone-600 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-stone-800">
                        {actorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-600 whitespace-nowrap font-mono">
                        {entityLabel}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-800 max-w-[200px] truncate" title={log.entity_label || '-'}>
                        {log.entity_label || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 font-mono max-w-[300px] truncate" title={renderMetadataSummary(log)}>
                        {renderMetadataSummary(log)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {activityLogs.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-stone-700">No se encontraron registros</h3>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                No hay operaciones registradas que coincidan con los filtros seleccionados.
              </p>
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  );
}
