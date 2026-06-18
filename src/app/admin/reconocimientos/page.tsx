import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';

export const metadata: Metadata = {
  title: 'Administración de Reconocimientos',
  description: 'Gestión de trayectoria, premios y avales de La Gauchita Federal',
};

export default function AdminReconocimientosPage() {
  return (
    <AdminShell>
      
      {/* Module Header */}
      <AdminSectionHeader
        title="Reconocimientos"
        description="Administración de premios, menciones, homenajes, certificados y distinciones documentadas."
        inPreparation={true}
      />

      {/* Placeholder content and disabled actions */}
      <div className="bg-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-6">
        
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-serif font-bold text-charcoal">
            Acciones de Gestión de Avales
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Las funciones de registro y vinculación de distinciones y certificados oficiales se activarán en la siguiente etapa del desarrollo.
          </p>
        </div>

        {/* Action buttons (Disabled) */}
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            disabled
            className="px-4 py-2.5 bg-stone-300 text-stone-500 text-xs font-bold uppercase tracking-wider rounded-md cursor-not-allowed border border-stone-400/50"
          >
            Crear reconocimiento
          </button>
          
          <button
            disabled
            className="px-4 py-2.5 bg-stone-200 text-stone-500 text-xs font-bold uppercase tracking-wider rounded-md cursor-not-allowed border border-stone-300"
          >
            Ver reconocimientos activos
          </button>

          <button
            disabled
            className="px-4 py-2.5 bg-stone-200 text-stone-500 text-xs font-bold uppercase tracking-wider rounded-md cursor-not-allowed border border-stone-300"
          >
            Revisar documentación asociada
          </button>
        </div>

        {/* Informative Table mockup (Disabled) */}
        <div className="border border-stone-200 rounded-lg overflow-hidden mt-4 opacity-60">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Título</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Entidad Otorgante</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr>
                <td className="p-4 font-serif font-bold text-stone-500 italic">Ejemplo de distinción bloqueada...</td>
                <td className="p-4">Certificación</td>
                <td className="p-4">Museo Regional</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-stone-100 border rounded text-[10px]">Bloqueado</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </AdminShell>
  );
}
