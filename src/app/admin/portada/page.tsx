import React from 'react';
import type { Metadata } from 'next';
import AdminShell from '../../../components/admin/AdminShell';
import AdminSectionHeader from '../../../components/admin/AdminSectionHeader';
import HomepageSlotsManager from '../../../components/admin/content/HomepageSlotsManager';
import { listHomepageSlots } from '../../../lib/admin/admin-homepage-slots';
import { getProvinces } from '../../../lib/catalogs/catalogs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portada Editorial | Panel de Control',
  description: 'Definición y fijación de contenidos en las posiciones destacadas de la portada.',
};

export default async function PortadaPage() {
  const [slots, provinces] = await Promise.all([
    listHomepageSlots(),
    getProvinces(),
  ]);

  // Clean provinces to only pass serializable simple objects to client component
  const serializableProvinces = provinces.map(p => ({
    id: p.id,
    name: p.name,
    code: p.code
  }));

  // Clean slots to only pass serializable data
  const serializableSlots = slots.map(s => ({
    id: s.id,
    slot_code: s.slot_code,
    content_id: s.content_id,
    province_id: s.province_id,
    sort_order: s.sort_order,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    is_active: s.is_active,
    assigned_by_profile_id: s.assigned_by_profile_id,
    created_at: s.created_at,
    updated_at: s.updated_at,
    content_title: s.content_title,
    content_slug: s.content_slug,
    content_status: s.content_status,
    content_visibility: s.content_visibility,
    content_publish_date: s.content_publish_date,
    content_province_id: s.content_province_id,
    content_municipality_id: s.content_municipality_id,
    content_type_code: s.content_type_code,
    content_type_name: s.content_type_name,
    assigned_by_name: s.assigned_by_name,
    province_name: s.province_name
  }));

  return (
    <AdminShell>
      <AdminSectionHeader
        title="Portada editorial"
        description="Definí qué contenidos ocupan las posiciones principales de la portada federal o provincial."
        inPreparation={false}
      />
      
      <HomepageSlotsManager
        initialSlots={serializableSlots}
        provinces={serializableProvinces}
      />
    </AdminShell>
  );
}
