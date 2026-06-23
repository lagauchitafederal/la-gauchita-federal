import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditEphemerisForm from '../../../../../components/admin/content/EditEphemerisForm';
import { getAdminEphemerisById } from '../../../../../lib/admin/admin-ephemerides';
import {
  getCategories,
  getRegions,
  getProvinces,
  getMunicipalities
} from '../../../../../lib/catalogs/catalogs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Efeméride',
  description: 'Edición administrativa de efemérides en La Gauchita Federal',
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEphemerisPage({ params }: EditPageProps) {
  const { id } = await params;
  
  let ephemeris = null;
  let isError = false;

  // Load catalogs and ephemeris details
  const [categories, regions, provinces, municipalities] = await Promise.all([
    getCategories(),
    getRegions(),
    getProvinces(),
    getMunicipalities()
  ]);

  try {
    ephemeris = await getAdminEphemerisById(id);
  } catch (error) {
    console.error('Error loading admin ephemeris detail:', error);
    isError = true;
  }

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Editar Efeméride"
        description="Modificá los detalles de la efeméride seleccionada."
        inPreparation={false}
      />

      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm font-bold font-mono">
            Ocurrió un error al intentar cargar la efeméride.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/efemerides"
              className="inline-flex items-center px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 font-mono"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      ) : !ephemeris ? (
        <div className="bg-white border border-stone-beige rounded-lg p-12 text-center flex flex-col gap-4 items-center">
          <p className="text-stone-500 text-sm italic font-mono">
            La efeméride con el identificador provisto no existe o no tiene privilegios para acceder a ella.
          </p>
          <Link
            href="/admin/efemerides"
            className="inline-flex items-center px-5 py-3 bg-charcoal text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-charcoal/90 font-mono"
          >
            Volver al listado
          </Link>
        </div>
      ) : (
        <EditEphemerisForm
          ephemeris={ephemeris}
          categories={categories}
          regions={regions}
          provinces={provinces}
          municipalities={municipalities}
        />
      )}
    </AdminShell>
  );
}
