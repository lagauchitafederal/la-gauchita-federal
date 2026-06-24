import { createServerSupabaseClient } from '../supabase/server';
import { PublicContent } from './public-content';
import { SelectedTerritory, sortPublicContentByRelevance } from './relevance';

export interface PublicHomepageLayout {
  leadStory: PublicContent | null;
  featuredContents: PublicContent[];
}

function resolveSlotContent(
  slots: any[],
  slotCode: string,
  provinceId: string | null
): any | null {
  // 1. Try to find slot matching slotCode and provinceId
  if (provinceId) {
    const provSlot = slots.find(s => s.slot_code === slotCode && s.province_id === provinceId);
    if (provSlot && provSlot.contents) return provSlot.contents;
  }
  // 2. Try to find federal slot matching slotCode
  const fedSlot = slots.find(s => s.slot_code === slotCode && !s.province_id);
  if (fedSlot && fedSlot.contents) return fedSlot.contents;

  return null;
}

/**
 * Resolves the homepage editorial layout: combines manually pinned slots (with provincial/federal priority)
 * and falls back to relevance-sorted published contents for unassigned slots.
 * Ensures no content is duplicated across the layout.
 */
export async function resolveHomepageLayout(territory?: SelectedTerritory): Promise<PublicHomepageLayout> {
  try {
    const supabase = createServerSupabaseClient();
    const nowStr = new Date().toISOString();

    // 1. Fetch active and currently valid homepage slots with contents details
    const { data: slotsData, error: slotsError } = await supabase
      .from('homepage_slots')
      .select(`
        slot_code,
        province_id,
        contents:content_id (
          id, 
          title, 
          slug, 
          subtitle, 
          summary, 
          event_date, 
          publish_date, 
          is_featured, 
          created_at, 
          region_id, 
          province_id, 
          municipality_id,
          institutions(name, slug), 
          categories(name), 
          content_types(code, name, slug)
        )
      `)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${nowStr}`)
      .or(`ends_at.is.null,ends_at.gte.${nowStr}`);

    if (slotsError) {
      console.error('Error fetching homepage slots for public layout:', slotsError);
    }

    // Map slot contents, formatting nested arrays if any (due to supabase plural mappings)
    const slots = (slotsData || []).map((item: any) => {
      const c = item.contents;
      if (!c) return null;

      // Ensure content is published, public and current
      const isPublished = c.status === 'published';
      const isPublic = c.visibility === 'public';
      const isReleased = c.publish_date && new Date(c.publish_date) <= new Date();

      if (!isPublished || !isPublic || !isReleased) {
        return null;
      }

      const mappedContent = {
        id: c.id,
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle,
        summary: c.summary,
        event_date: c.event_date,
        publish_date: c.publish_date,
        is_featured: c.is_featured,
        created_at: c.created_at,
        region_id: c.region_id,
        province_id: c.province_id,
        municipality_id: c.municipality_id,
        institutions: Array.isArray(c.institutions) ? c.institutions[0] || null : c.institutions || null,
        categories: Array.isArray(c.categories) ? c.categories[0] || null : c.categories || null,
        content_types: Array.isArray(c.content_types) ? c.content_types[0] || null : c.content_types || null
      };

      return {
        slot_code: item.slot_code,
        province_id: item.province_id,
        contents: mappedContent
      };
    }).filter(Boolean);

    // Resolve slot contents based on territory
    const provinceId = territory?.provinceId || null;
    const resolvedLead = resolveSlotContent(slots, 'lead_story', provinceId);
    const resolvedFeatured1 = resolveSlotContent(slots, 'featured_1', provinceId);
    const resolvedFeatured2 = resolveSlotContent(slots, 'featured_2', provinceId);
    const resolvedFeatured3 = resolveSlotContent(slots, 'featured_3', provinceId);
    const resolvedFeatured4 = resolveSlotContent(slots, 'featured_4', provinceId);

    // Keep track of used content IDs to avoid duplications
    const usedContentIds = new Set<string>();
    if (resolvedLead && resolvedLead.id) usedContentIds.add(resolvedLead.id);
    if (resolvedFeatured1 && resolvedFeatured1.id) usedContentIds.add(resolvedFeatured1.id);
    if (resolvedFeatured2 && resolvedFeatured2.id) usedContentIds.add(resolvedFeatured2.id);
    if (resolvedFeatured3 && resolvedFeatured3.id) usedContentIds.add(resolvedFeatured3.id);
    if (resolvedFeatured4 && resolvedFeatured4.id) usedContentIds.add(resolvedFeatured4.id);

    // 2. Fetch automatic fallback pool
    const { data: contentsData, error: contentsError } = await supabase
      .from('contents')
      .select('id, title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, region_id, province_id, municipality_id, institutions(name, slug), categories(name), content_types(code, name, slug)')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .lte('publish_date', nowStr)
      .order('is_featured', { ascending: false })
      .order('publish_date', { ascending: false })
      .limit(100);

    if (contentsError) {
      console.error('Error fetching fallback contents pool:', contentsError);
    }

    let allPublished = (contentsData || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle,
      summary: item.summary,
      event_date: item.event_date,
      publish_date: item.publish_date,
      is_featured: item.is_featured,
      created_at: item.created_at,
      region_id: item.region_id,
      province_id: item.province_id,
      municipality_id: item.municipality_id,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      categories: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null,
      content_types: Array.isArray(item.content_types) ? item.content_types[0] || null : item.content_types || null
    })) as PublicContent[];

    if (territory) {
      allPublished = sortPublicContentByRelevance(allPublished, territory);
    }

    // Exclude ephemerides for general homepage slots
    const generalPublished = allPublished.filter(c => c.content_types?.code !== 'ephemeris');
    const fallbackPool = generalPublished.length > 0 ? generalPublished : allPublished;

    // 3. Construct final layout
    const leadStory = resolvedLead || fallbackPool.find(c => c.id && !usedContentIds.has(c.id)) || null;
    if (leadStory && leadStory.id) {
      usedContentIds.add(leadStory.id);
    }

    const featuredContents: PublicContent[] = [];

    // Position 0 (Featured 1)
    const feat1 = resolvedFeatured1 || fallbackPool.find(c => c.id && !usedContentIds.has(c.id));
    if (feat1) {
      featuredContents.push(feat1);
      if (feat1.id) usedContentIds.add(feat1.id);
    }

    // Position 1 (Featured 2)
    const feat2 = resolvedFeatured2 || fallbackPool.find(c => c.id && !usedContentIds.has(c.id));
    if (feat2) {
      featuredContents.push(feat2);
      if (feat2.id) usedContentIds.add(feat2.id);
    }

    // Position 2 (Featured 3)
    const feat3 = resolvedFeatured3 || fallbackPool.find(c => c.id && !usedContentIds.has(c.id));
    if (feat3) {
      featuredContents.push(feat3);
      if (feat3.id) usedContentIds.add(feat3.id);
    }

    // Position 3 (Featured 4)
    const feat4 = resolvedFeatured4 || fallbackPool.find(c => c.id && !usedContentIds.has(c.id));
    if (feat4) {
      featuredContents.push(feat4);
      if (feat4.id) usedContentIds.add(feat4.id);
    }

    // Positions 4 and 5 (Extra fallback slots to complete the homepage design of 6 featured stories)
    const feat5 = fallbackPool.find(c => c.id && !usedContentIds.has(c.id));
    if (feat5) {
      featuredContents.push(feat5);
      if (feat5.id) usedContentIds.add(feat5.id);
    }

    const feat6 = fallbackPool.find(c => c.id && !usedContentIds.has(c.id));
    if (feat6) {
      featuredContents.push(feat6);
      if (feat6.id) usedContentIds.add(feat6.id);
    }

    return {
      leadStory,
      featuredContents
    };
  } catch (err) {
    console.error('Unexpected error in resolveHomepageLayout:', err);
    return {
      leadStory: null,
      featuredContents: []
    };
  }
}
