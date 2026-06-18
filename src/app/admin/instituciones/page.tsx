import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';

export const metadata: Metadata = {
  title: 'Administración de Instituciones',
  description: 'Gestión de la red cultural e institucional de La Gauchita Federal',
};

export default function AdminInstitucionesPage() {
  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Instituciones"
        description="Administración de instituciones participantes o vinculadas al archivo documental."
        inPreparation={true}
      />

      {/* Placeholder content and disabled actions */}
      <div className="bg-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
        
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-serif font-bold text-charcoal">
            Acciones de Gestión
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Las funciones de alta y edición de instituciones participantes y vinculadas se activarán en la siguiente etapa del desarrollo.
          </p>
        </div>

        {/* Action buttons (Disabled) */}
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            disabled
            className="px-4 py-2.5 bg-stone-300 text-stone-500 text-xs font-bold uppercase tracking-wider rounded-md cursor-not-allowed border border-stone-400/50"
          >
            Crear institución
          </button>
          
          <button
            disabled
            className="px-4 py-2.5 bg-stone-200 text-stone-500 text-xs font-bold uppercase tracking-wider rounded-md cursor-not-allowed border border-stone-300"
          >
            Ver instituciones activas
          </button>

          <button
            disabled
            className="px-4 py-2.5 bg-stone-200 text-stone-500 text-xs font-bold uppercase tracking-wider rounded-md cursor-not-allowed border border-stone-300"
          >
            Revisar instituciones archivadas
          </button>
        </div>

        {/* Informative Table mockup (Disabled) */}
        <div className="border border-stone-200 rounded-lg overflow-hidden mt-4 opacity-60">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Nombre</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Región</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr>
                <td className="p-4 font-serif font-bold text-stone-500 italic">Ejemplo de institución bloqueada...</td>
                <td className="p-4">Museo</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-stone-100 border rounded text-[10px]">Bloqueado</span></td>
                <td className="p-4 font-mono">--</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </AdminShell>
  );
}
