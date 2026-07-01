import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../../lib/supabase/env';
import AdminShell from '../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../components/admin/AdminSectionHeader';
import NewPublicationForm from '../../../../components/admin/publications/NewPublicationForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nueva Publicación Cultural',
  description: 'Publicación de nuevos libros, discos y obras del Instituto Cultural Andino',
};

export default async function NewPublicationPage() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });

  // Fetch active institutions and covers
  const [institutionsRes, coversRes] = await Promise.all([
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
      .order('title')
  ]);

  const institutions = institutionsRes.data || [];
  const covers = coversRes.data || [];

  // Resolve default publisher: 'instituto-cultural-andino'
  const defaultPublisherId = institutions.find(i => i.slug === 'instituto-cultural-andino')?.id || '';

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Nueva Publicación Cultural"
        description="Complete los datos del nuevo libro, disco o álbum musical para registrarlo en el catálogo."
        inPreparation={false}
      />

      <NewPublicationForm
        institutions={institutions}
        covers={covers}
        defaultPublisherId={defaultPublisherId}
      />
    </AdminShell>
  );
}
