import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import AssignmentsBoard from '../../../components/admin/content/AssignmentsBoard';
import { getUserAssignments, getOpenAssignments, checkUserIsAdminOrEditor } from '../../../lib/admin/admin-editorial-assignments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trabajo Editorial | Panel de Control',
  description: 'Bandeja editorial y asignaciones de contenido en La Gauchita Federal',
};

export default async function AsignacionesPage() {
  const [userTasks, openTasks, isAdminOrEditor] = await Promise.all([
    getUserAssignments(),
    getOpenAssignments(),
    checkUserIsAdminOrEditor(),
  ]);

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Trabajo editorial"
        description="Tareas, revisiones y contenidos pendientes dentro del circuito de producción."
        inPreparation={false}
      />
      
      <AssignmentsBoard
        initialUserTasks={userTasks}
        initialOpenTasks={openTasks}
        isAdminOrEditor={isAdminOrEditor}
      />
    </AdminShell>
  );
}
