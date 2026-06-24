'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateAssignmentStatusAction } from '../../../app/admin/contenidos/actions';

interface Task {
  id: string;
  entity_type: string;
  entity_id: string;
  assigned_to_profile_id: string;
  assigned_by_profile_id: string | null;
  notes: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
  content_title?: string;
  content_slug?: string;
}

interface AssignmentsBoardProps {
  initialUserTasks: Task[];
  initialOpenTasks: Task[];
  isAdminOrEditor?: boolean;
}

export default function AssignmentsBoard({
  initialUserTasks,
  initialOpenTasks,
  isAdminOrEditor = false
}: AssignmentsBoardProps) {
  const router = useRouter();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress'>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'due_soon'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filterTasks = (tasksList: Task[]) => {
    let list = [...tasksList];

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Filter by due date
    if (dueFilter !== 'all') {
      const now = new Date();
      if (dueFilter === 'overdue') {
        list = list.filter((t) => t.due_date && new Date(t.due_date) < now);
      } else if (dueFilter === 'due_soon') {
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        list = list.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) >= now &&
            new Date(t.due_date) <= threeDaysLater
        );
      }
    }

    // Filter by content search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          (t.content_title && t.content_title.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(q))
      );
    }

    return list;
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateAssignmentStatusAction(taskId, newStatus, undefined, undefined, undefined);
      if (res.success) {
        setSuccessMsg(`Estado de tarea actualizado a: ${
          newStatus === 'completed' ? 'Completado' : newStatus === 'cancelled' ? 'Cancelado' : 'En curso'
        }.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al actualizar el estado de la tarea.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUserTasks = filterTasks(initialUserTasks);
  const filteredOpenTasks = filterTasks(initialOpenTasks);

  const isEmpty = filteredUserTasks.length === 0 && filteredOpenTasks.length === 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            {successMsg}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            Error: {errorMsg}
          </p>
        </div>
      )}

      {/* Control / Filter Bar */}
      <div className="bg-white border border-stone-beige rounded-lg shadow-sm p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        
        {/* Status filters buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
              statusFilter === 'all'
                ? 'bg-earth-red text-white border-earth-red'
                : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
              statusFilter === 'pending'
                ? 'bg-earth-red text-white border-earth-red'
                : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors duration-150 uppercase tracking-wider ${
              statusFilter === 'in_progress'
                ? 'bg-earth-red text-white border-earth-red'
                : 'bg-white text-stone-600 border-stone-beige hover:border-earth-red hover:text-earth-red'
            }`}
          >
            En curso
          </button>
        </div>

        {/* Due date filter select */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
              Vencimiento:
            </span>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-earth-red font-mono bg-white"
            >
              <option value="all">Cualquiera</option>
              <option value="overdue">Vencidas</option>
              <option value="due_soon">Vencen pronto (3 días)</option>
            </select>
          </div>

          {/* Search query input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por contenido o nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red"
            />
          </div>
        </div>

      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="bg-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-4 items-center">
          <h2 className="text-xl font-serif font-bold text-charcoal">
            No hay tareas editoriales pendientes
          </h2>
          <p className="text-stone-600 text-sm font-serif max-w-md">
            Las asignaciones de redacción y revisión aparecerán aquí cuando sean registradas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* A. Mis Tareas Section */}
          {filteredUserTasks.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2">
                Mis tareas pendientes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUserTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 bg-warm-white/70 border border-stone-beige rounded-lg flex flex-col gap-3.5 hover:border-earth-red/40 hover:shadow-sm transition-all duration-200 justify-between"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-stone-500 font-mono uppercase">
                          Asignado por: <strong>{task.assigned_by_name}</strong>
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${
                          task.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {task.status === 'in_progress' ? 'En curso' : 'Pendiente'}
                        </span>
                      </div>

                      <h4 className="font-serif font-black text-base text-charcoal leading-snug">
                        {task.content_title}
                      </h4>

                      {task.notes && (
                        <p className="text-xs text-stone-700 font-serif bg-white/60 p-2.5 rounded border border-stone-beige/40">
                          {task.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 pt-3 border-t border-stone-beige/50 mt-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
                        <span>Creado: {new Date(task.created_at).toLocaleDateString('es-AR')}</span>
                        {task.due_date && (
                          <span className="text-earth-red font-bold">
                            Vence: {new Date(task.due_date).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <Link
                          href={`/admin/contenidos/${task.entity_id}/editar`}
                          className="text-[10px] font-mono font-bold text-earth-red hover:underline uppercase tracking-wider"
                        >
                          Editar contenido &rarr;
                        </Link>

                        {isAdminOrEditor && (
                          <div className="flex items-center gap-1.5">
                            {task.status === 'pending' && (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[9px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                              >
                                Iniciar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                            >
                              Completar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* B. Tareas Abiertas Section */}
          {filteredOpenTasks.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-serif font-black text-charcoal border-b border-stone-beige pb-2">
                Todas las tareas abiertas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOpenTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 bg-white border border-stone-beige rounded-lg flex flex-col gap-3.5 hover:border-stone-beige/90 hover:shadow-sm transition-all duration-200 justify-between"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-600 font-mono uppercase">
                            Para: <strong>{task.assigned_to_name}</strong>
                          </span>
                          <span className="text-[9px] text-stone-400 font-mono">
                            Por: {task.assigned_by_name}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${
                          task.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {task.status === 'in_progress' ? 'En curso' : 'Pendiente'}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-base text-charcoal leading-snug">
                        {task.content_title}
                      </h4>

                      {task.notes && (
                        <p className="text-xs text-stone-650 font-serif bg-stone-50 p-2.5 rounded border border-stone-beige/30 line-clamp-2 hover:line-clamp-none transition-all duration-300">
                          {task.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 pt-3 border-t border-stone-beige/50 mt-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
                        <span>Creado: {new Date(task.created_at).toLocaleDateString('es-AR')}</span>
                        {task.due_date && (
                          <span className="text-earth-red font-bold">
                            Vence: {new Date(task.due_date).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <Link
                          href={`/admin/contenidos/${task.entity_id}/editar`}
                          className="text-[10px] font-mono font-bold text-earth-red hover:underline uppercase tracking-wider"
                        >
                          Editar contenido &rarr;
                        </Link>

                        {isAdminOrEditor && (
                          <div className="flex items-center gap-1.5">
                            {task.status === 'pending' && (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[9px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                              >
                                Iniciar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                            >
                              Completar
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-[9px] uppercase font-bold tracking-wider rounded font-mono transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </div>
  );
}
