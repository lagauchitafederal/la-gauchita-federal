import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../components/admin/AdminShell';
import AdminCard from '../../components/admin/AdminCard';

export const metadata: Metadata = {
  title: 'Panel de Administración',
  description: 'Gestión interna de La Gauchita Federal',
};

export default function AdminPage() {
  return (
    <AdminShell>
      
      {/* Header and Aviso */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-serif font-black tracking-tight text-charcoal">
            Panel de administración
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed font-medium">
            Gestión interna de La Gauchita Federal
          </p>
        </div>

        {/* Aviso prudente */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-mono">
            Versión inicial del panel. Acceso reservado a usuarios autorizados.
          </p>
        </div>
      </div>

      {/* Grid of access cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <AdminCard
          title="Contenidos"
          description="Administración de artículos, efemérides, notas culturales y materiales editoriales de Revista La Gauchita y colaboradores."
          href="/admin/contenidos"
          badge="Borrador"
        />

        <AdminCard
          title="Instituciones"
          description="Gestión y catalogación de instituciones participantes y entidades vinculadas al archivo documental de la red."
          href="/admin/instituciones"
          badge="Borrador"
        />

        <AdminCard
          title="Reconocimientos"
          description="Administración de premios, menciones, homenajes, certificados y distinciones oficiales documentadas."
          href="/admin/reconocimientos"
          badge="Borrador"
        />

        <AdminCard
          title="Archivo visual"
          description="Gestión de imágenes, portadas editoriales de revistas, diplomas y archivos digitales del patrimonio cultural."
          href="/admin/archivo"
          badge="Borrador"
        />
      </div>

      {/* Bottom informational note */}
      <div className="bg-stone-100 border border-stone-200 rounded-lg p-5 mt-auto">
        <p className="text-xs text-stone-500 font-mono leading-relaxed">
          Nota técnica: La protección de acceso y el control de roles por Supabase Auth están activos en este panel.
        </p>
      </div>

    </AdminShell>
  );
}
