import { createServerSupabaseClient } from '../supabase/server';
import { SelectedTerritory, getRelevanceScore } from './relevance';
import { isEventToday, getArgentinaDateParts, parseEventDate } from '../utils/date';
import { PublicContent } from './public-content';
import { PublicPerson } from './public-people';

export interface RememberedPerson extends PublicPerson {
  commemoration_type: 'birth' | 'death';
  years_elapsed: number | null;
}

export interface TodayInArgentinaData {
  leadStory: PublicContent | null;
  secondaryEphemerides: PublicContent[];
  rememberedPeople: RememberedPerson[];
  agendaEvents: PublicContent[];
  recognitions: any[];
}

export async function getTodayInArgentinaData(territory?: SelectedTerritory): Promise<TodayInArgentinaData> {
  try {
    const supabase = createServerSupabaseClient();
    const { year: currentYear } = getArgentinaDateParts();

    // 1. Fetch Today's Ephemerides
    const { data: contentsData, error: contentsError } = await supabase
      .from('contents')
      .select('id, title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, region_id, province_id, municipality_id, institutions(name, slug), categories(name), content_types(code, name, slug)')
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (contentsError) {
      console.error('Error fetching contents for Today in Argentina:', contentsError);
    }

    const rawContents = (contentsData || []).map((c: any) => ({
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
    })) as PublicContent[];

    // Filter ephemerides occurring today in Argentina timezone, excluding future publish dates
    const todayEphemerides = rawContents.filter(c => {
      if (c.content_types?.code !== 'ephemeris') return false;
      if (c.publish_date && new Date(c.publish_date) > new Date()) return false;
      return isEventToday(c.event_date);
    });

    // Sort ephemerides: relevance first, then featured, then newest publish date
    todayEphemerides.sort((a, b) => {
      if (territory) {
        const scoreA = getRelevanceScore(a, territory);
        const scoreB = getRelevanceScore(b, territory);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      if (a.is_featured !== b.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      const dateA = a.publish_date ? new Date(a.publish_date).getTime() : 0;
      const dateB = b.publish_date ? new Date(b.publish_date).getTime() : 0;
      return dateB - dateA;
    });

    const leadStory = todayEphemerides[0] || null;
    const secondaryEphemerides = leadStory ? todayEphemerides.slice(1, 5) : []; // max 4 secundarias

    // 2. Fetch Remembered People
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('id, full_name, slug, short_bio, biography, person_type, birth_date, death_date, region_id, province_id, municipality_id, main_image_asset_id, source_reference, is_featured, regions(name), provinces(name), municipalities(name), media_assets:main_image_asset_id(bucket_name, storage_path, title, alt_text)')
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (peopleError) {
      console.error('Error fetching people for Today in Argentina:', peopleError);
    }

    const rawPeople = (peopleData || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      slug: p.slug,
      short_bio: p.short_bio,
      biography: p.biography,
      person_type: p.person_type,
      birth_date: p.birth_date,
      death_date: p.death_date,
      region_id: p.region_id,
      province_id: p.province_id,
      municipality_id: p.municipality_id,
      main_image_asset_id: p.main_image_asset_id,
      source_reference: p.source_reference,
      is_featured: p.is_featured,
      regions: Array.isArray(p.regions) ? p.regions[0] || null : p.regions || null,
      provinces: Array.isArray(p.provinces) ? p.provinces[0] || null : p.provinces || null,
      municipalities: Array.isArray(p.municipalities) ? p.municipalities[0] || null : p.municipalities || null,
      media_assets: Array.isArray(p.media_assets) ? p.media_assets[0] || null : p.media_assets || null,
    })) as PublicPerson[];

    const todayPeople = rawPeople
      .filter(p => isEventToday(p.birth_date) || isEventToday(p.death_date))
      .map(p => {
        const isDeath = isEventToday(p.death_date);
        const targetDate = isDeath ? p.death_date : p.birth_date;
        const { year: eventYear } = targetDate ? parseEventDate(targetDate) : { year: null };
        
        const years_elapsed = eventYear !== null && !isNaN(eventYear) ? currentYear - eventYear : null;

        return {
          ...p,
          commemoration_type: (isDeath ? 'death' : 'birth') as 'birth' | 'death',
          years_elapsed
        };
      });

    // Sort people: relevance first, then featured, then full_name
    todayPeople.sort((a, b) => {
      if (territory) {
        const scoreA = getRelevanceScore(a, territory);
        const scoreB = getRelevanceScore(b, territory);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      if (a.is_featured !== b.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      return a.full_name.localeCompare(b.full_name);
    });

    const rememberedPeople = todayPeople.slice(0, 3) as RememberedPerson[]; // max 3

    // 3. Fetch Agenda Events (upcoming 30 days)
    const { day, month, year } = getArgentinaDateParts();
    // Use UTC representation to avoid client-side shift during serialization
    const todayDate = new Date(Date.UTC(year, month, day));
    const todayStr = todayDate.toISOString().split('T')[0];

    const next30Date = new Date(Date.UTC(year, month, day + 30));
    const next30DaysStr = next30Date.toISOString().split('T')[0];

    const { data: eventsData, error: eventsError } = await supabase
      .from('contents')
      .select('id, title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, region_id, province_id, municipality_id, institutions(name, slug), categories(name), content_types(code, name, slug)')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .gte('event_date', todayStr)
      .lte('event_date', next30DaysStr);

    if (eventsError) {
      console.error('Error fetching events for Today in Argentina:', eventsError);
    }

    const rawEvents = (eventsData || []).map((c: any) => ({
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
    })) as PublicContent[];

    const todayEvents = rawEvents.filter(c => c.content_types?.code === 'event');

    // Sort events: relevance first, then event_date ascending (closest first)
    todayEvents.sort((a, b) => {
      if (territory) {
        const scoreA = getRelevanceScore(a, territory);
        const scoreB = getRelevanceScore(b, territory);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
      return dateA - dateB;
    });

    const agendaEvents = todayEvents.slice(0, 3); // max 3

    // 4. Fetch Recordamos (Recognitions)
    const { data: recData, error: recError } = await supabase
      .from('recognitions')
      .select('id, title, slug, recognition_type, description, granting_institution_name, recognition_date, is_featured, location')
      .eq('status', 'active')
      .eq('visibility', 'public');

    if (recError) {
      console.error('Error fetching recognitions for Today in Argentina:', recError);
    }

    const rawRecognitions = recData || [];
    const todayRecognitions = rawRecognitions
      .filter(r => isEventToday(r.recognition_date))
      .map(r => {
        const { year: recYear } = r.recognition_date ? parseEventDate(r.recognition_date) : { year: null };
        const years_elapsed = recYear !== null && !isNaN(recYear) ? currentYear - recYear : null;
        return {
          ...r,
          years_elapsed
        };
      });

    // Sort by featured
    todayRecognitions.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    const recognitions = todayRecognitions.slice(0, 2); // max 2

    return {
      leadStory,
      secondaryEphemerides,
      rememberedPeople,
      agendaEvents,
      recognitions
    };
  } catch (err) {
    console.error('Unexpected error in getTodayInArgentinaData:', err);
    return {
      leadStory: null,
      secondaryEphemerides: [],
      rememberedPeople: [],
      agendaEvents: [],
      recognitions: []
    };
  }
}
