import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../../../lib/supabase/env';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditMagazineForm from '../../../../../components/admin/magazine/EditMagazineForm';
import { getAdminMagazineById } from '../../../../../lib/admin/admin-magazines';

export const dynamic = 'force-dynamic';

interface EditMagazinePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditMagazinePageProps): Promise<Metadata> {
  const { id } = await params;
  const ed = await getAdminMagazineById(id);

  if (!ed) {
    return {
      title: 'Edición no encontrada',
    };
  }

  return {
    title: `Editar Edición Nº ${ed.edition_number}`,
    description: `Edición de datos para ${ed.title}`,
  };
}

export default async function EditMagazinePage({ params }: EditMagazinePageProps) {
  const { id } = await params;
  const ed = await getAdminMagazineById(id);

  if (!ed) {
    notFound();
  }

  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });

  // Fetch active institutions, covers, and PDFs for selector inputs
  const [institutionsRes, coversRes, pdfsRes] = await Promise.all([
    supabase
      .from('institutions')
      .select('id, name, slug')
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('media_assets')
      .select('id, title, original_filename')
      .eq('asset_type', 'cover_image')
      .eq('status', 'active')
      .order('title'),
    supabase
      .from('media_assets')
      .select('id, title, original_filename')
      .in('asset_type', ['magazine_pdf', 'pdf_document'])
      .eq('status', 'active')
      .order('title')
  ]);

  const institutions = institutionsRes.data || [];
  const covers = coversRes.data || [];
  const pdfs = pdfsRes.data || [];

  return (
    <AdminShell>
      <AdminSectionHeader
        title={`Editar edición Nº ${ed.edition_number}`}
        description="Actualice los metadatos, modifique el orden o restructure las entradas del índice."
        inPreparation={false}
      />

      <EditMagazineForm
        magazine={ed}
        institutions={institutions}
        covers={covers}
        pdfs={pdfs}
      />
    </AdminShell>
  );
}
