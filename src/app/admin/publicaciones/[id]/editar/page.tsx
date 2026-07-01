import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../../../lib/supabase/env';
import AdminShell from '../../../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../../../components/admin/AdminSectionHeader';
import EditPublicationForm from '../../../../../components/admin/publications/EditPublicationForm';
import EditorialRelationsManager from '../../../../../components/admin/content/EditorialRelationsManager';
import { getAdminPublicationById } from '../../../../../lib/admin/admin-publications';
import { getEditorialRelationsForEntity } from '../../../../../lib/admin/admin-editorial-relations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Publicación Cultural',
  description: 'Modificación de libros, discos y obras especiales en La Gauchita Federal',
};

interface EditPublicationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPublicationPage({ params }: EditPublicationPageProps) {
  const { id } = await params;

  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });

  const [publication, institutionsRes, coversRes, relations] = await Promise.all([
    getAdminPublicationById(id),
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
    getEditorialRelationsForEntity('cultural_publication', id)
  ]);

  if (!publication) {
    notFound();
  }

  const institutions = institutionsRes.data || [];
  const covers = coversRes.data || [];

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Editar Publicación Cultural"
        description={`Modifique los campos de la obra "${publication.title}".`}
        inPreparation={false}
      />

      <div className="flex flex-col gap-8">
        <EditPublicationForm
          publicationId={id}
          initialData={publication}
          institutions={institutions}
          covers={covers}
        />

        <EditorialRelationsManager
          entityType="cultural_publication"
          entityId={id}
          initialRelations={relations}
        />
      </div>
    </AdminShell>
  );
}
