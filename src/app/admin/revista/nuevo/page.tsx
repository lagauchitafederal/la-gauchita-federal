import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../../lib/supabase/env';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewMagazineForm from '../../../../components/admin/magazine/NewMagazineForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nueva Edición de Revista',
  description: 'Publicación de nuevos ejemplares en La Gauchita Federal',
};

export default async function NewMagazinePage() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });

  // Fetch active institutions, covers, and PDFs
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

  // Resolve default publisher
  const defaultPublisherId = institutions.find(i => i.slug === 'revista-la-gauchita')?.id || '';

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Nueva edición de revista"
        description="Complete los datos de la nueva publicación y compile su índice correspondiente."
        inPreparation={false}
      />

      <NewMagazineForm
        institutions={institutions}
        covers={covers}
        pdfs={pdfs}
        defaultPublisherId={defaultPublisherId}
      />
    </AdminShell>
  );
}
