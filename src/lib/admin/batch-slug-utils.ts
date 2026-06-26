import { createServerSupabaseClient } from '../supabase/server';
import { generateSlug } from './slug-utils';

/**
 * Resuelve slugs unicos para un lote de contenidos en la tabla 'contents' de forma eficiente.
 * 
 * @param titles Coleccion de titulos de entrada.
 * @returns Slugs unicos generados en el mismo orden que la entrada.
 */
export async function getUniqueContentSlugsBatch(titles: string[]): Promise<string[]> {
  if (!titles || titles.length === 0) return [];

  const supabase = createServerSupabaseClient();
  const baseSlugs = titles.map(t => generateSlug(t));
  
  const resolvedSlugs: string[] = new Array(titles.length).fill('');
  const usedSlugsInBatch = new Set<string>();
  const existingSlugsInDb = new Set<string>();
  const resolvedIndexes = new Set<number>();
  
  // Suffix counters being evaluated for each index
  const currentTrySuffix = new Array(titles.length).fill(0);
  
  // Highest checked suffix limit for each base slug
  const checkedMaxSuffix = new Map<string, number>();
  
  // Suffix batch range size (tanda)
  const TANDA_SIZE = 100;

  // Helper to query database for candidates in bulk
  async function checkDbSlugs(candidates: string[]) {
    if (candidates.length === 0) return;
    
    const chunkSize = 500;
    for (let i = 0; i < candidates.length; i += chunkSize) {
      const chunk = candidates.slice(i, i + chunkSize);
      
      const { data, error } = await supabase
        .from('contents')
        .select('slug')
        .in('slug', chunk);

      if (error) {
        console.error('Error en consulta de slugs por lote:', error);
        throw new Error(`Error al verificar duplicados de slugs en lote: ${error.message}`);
      }

      if (data) {
        for (const row of data) {
          existingSlugsInDb.add(row.slug);
        }
      }
    }
  }

  // Iterate until every index has been successfully resolved
  while (resolvedIndexes.size < titles.length) {
    const batchCandidatesToQuery = new Set<string>();
    
    // Identify unresolved indexes and check if we need to query the DB for their current range
    for (let i = 0; i < titles.length; i++) {
      if (resolvedIndexes.has(i)) continue;
      
      const base = baseSlugs[i];
      const counter = currentTrySuffix[i];
      const maxChecked = checkedMaxSuffix.has(base) ? checkedMaxSuffix.get(base)! : -1;
      
      if (counter > maxChecked) {
        // Expand suffix checked range by TANDA_SIZE (e.g. 0 to 99, then 100 to 199)
        const nextLimit = maxChecked === -1 ? TANDA_SIZE - 1 : maxChecked + TANDA_SIZE;
        
        // Add all suffix variations within the new range as candidates to query in bulk
        for (let s = maxChecked + 1; s <= nextLimit; s++) {
          const candidateStr = s === 0 ? base : `${base}-${s}`;
          batchCandidatesToQuery.add(candidateStr);
        }
        
        checkedMaxSuffix.set(base, nextLimit);
      }
    }

    // Execute bulk query if new candidates need to be checked
    if (batchCandidatesToQuery.size > 0) {
      await checkDbSlugs(Array.from(batchCandidatesToQuery));
    }

    // Re-evaluate unresolved indexes with the newly fetched range data
    for (let i = 0; i < titles.length; i++) {
      if (resolvedIndexes.has(i)) continue;
      
      const base = baseSlugs[i];
      const counter = currentTrySuffix[i];
      const candidate = counter === 0 ? base : `${base}-${counter}`;
      
      const maxChecked = checkedMaxSuffix.get(base) || 0;
      
      // We can only check if we have already queried the DB for this suffix level
      if (counter <= maxChecked) {
        if (!existingSlugsInDb.has(candidate) && !usedSlugsInBatch.has(candidate)) {
          resolvedSlugs[i] = candidate;
          usedSlugsInBatch.add(candidate);
          resolvedIndexes.add(i);
        } else {
          // Collision found, increment counter to check in the next iteration
          currentTrySuffix[i]++;
        }
      }
    }
  }

  return resolvedSlugs;
}
