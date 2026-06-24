'use server';

import { revalidatePath } from 'next/cache';
import {
  assignHomepageSlot,
  deactivateHomepageSlot,
  reorderHomepageSlots,
  searchEligibleContents
} from '../../../lib/admin/admin-homepage-slots';

export async function assignHomepageSlotAction(params: {
  slot_code: 'lead_story' | 'featured_1' | 'featured_2' | 'featured_3' | 'featured_4';
  content_id: string;
  province_id: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  const result = await assignHomepageSlot(params);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/admin/portada');
  }
  return result;
}

export async function deactivateHomepageSlotAction(slotId: string) {
  const result = await deactivateHomepageSlot(slotId);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/admin/portada');
  }
  return result;
}

export async function reorderHomepageSlotsAction(slotsOrders: { id: string; sort_order: number }[]) {
  const result = await reorderHomepageSlots(slotsOrders);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/admin/portada');
  }
  return result;
}

export async function searchEligibleContentsAction(query: string) {
  return await searchEligibleContents(query);
}
