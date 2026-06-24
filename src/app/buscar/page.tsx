import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getProvinces, getCategories } from '../../lib/catalogs/catalogs';
import { getPublishedContents } from '../../lib/public-content/public-content';
import {
  getEditorialSearchResults,
  sanitizeQuery,
  SearchFilters,
  UnifiedSearchResult
} from '../../lib/public-content/public-editorial-search';
import PublicPageShell from '../../components/public/PublicPageShell';

// Import visual cards
import ContentCard from '../../components/cards/ContentCard';
import PersonCard from '../../components/cards/PersonCard';
import InstitutionCard from '../../components/cards/InstitutionCard';
import RecognitionCard from '../../components/cards/RecognitionCard';
import MagazineEditionCard from '../../components/cards/MagazineEditionCard';
import ArchiveAssetCard from '../../components/cards/ArchiveAssetCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Buscador Editorial | La Gauchita Federal',
  description: 'Explorá la memoria cultural, personajes, revista y archivo histórico de la República Argentina.',
  robots: {
    index: false,
    follow: false,
  },
};

interface BuscadorPageProps {
  searchParams: Promise<{ q?: string; tipo?: string; provincia?: string; categoria?: string; page?: string }>;
}

const TABS = [
  { code: 'todos', label: 'Todos' },
  { code: 'contenidos', label: 'Historias' },
  { code: 'personajes', label: 'Personajes' },
  { code: 'instituciones', label: 'Instituciones' },
  { code: 'reconocimientos', label: 'Reconocimientos' },
  { code: 'revista', label: 'Revista' },
  { code: 'archivo', label: 'Archivo' }
];

export default async function BuscadorPage({ searchParams }: BuscadorPageProps) {
  const params = await searchParams;
  const rawQ = params.q || '';
  const selectedTipo = params.tipo || 'todos';
  const selectedProv = params.provincia || 'todas';
  const selectedCat = params.categoria || 'todas';
  const rawPage = params.page || '1';

  // Load catalogs to validate inputs
  const [provinces, categories] = await Promise.all([
    getProvinces(),
    getCategories()
  ]);

  let warningMessage: string | null = null;

  // 1. Validate 'tipo' param
  const validTipos = ['todos', 'contenidos', 'personajes', 'instituciones', 'reconocimientos', 'revista', 'archivo'];
  let verifiedTipo: SearchFilters['tipo'] = 'todos';
  if (validTipos.includes(selectedTipo)) {
    verifiedTipo = selectedTipo as SearchFilters['tipo'];
  } else {
    warningMessage = 'El tipo de búsqueda especificado no es válido.';
  }

  // 2. Validate 'provincia' UUID
  let verifiedProvince: string | undefined = undefined;
  if (selectedProv && selectedProv !== 'todas') {
    const exists = provinces.some(p => p.id === selectedProv);
    if (exists) {
      verifiedProvince = selectedProv;
    } else {
      warningMessage = warningMessage
        ? `${warningMessage} Además, el filtro de provincia no es válido.`
        : 'El filtro de provincia especificado no es válido.';
    }
  }

  // 3. Validate 'categoria' UUID
  let verifiedCategory: string | undefined = undefined;
  if (selectedCat && selectedCat !== 'todas') {
    const exists = categories.some(c => c.id === selectedCat);
    if (exists) {
      verifiedCategory = selectedCat;
    } else {
      warningMessage = warningMessage
        ? `${warningMessage} Además, el filtro de categoría no es válido.`
        : 'El filtro de categoría especificado no es válido.';
    }
  }

  // 4. Validate page param
  let pageNum = parseInt(rawPage, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    pageNum = 1;
  }

  const cleanQ = sanitizeQuery(rawQ);

  // Load cookies and territory context
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  // Execute search if query is valid (>= 3 chars)
  const isSearchActive = cleanQ.length >= 3;
  let searchResponse = { results: [] as UnifiedSearchResult[], totalCount: 0 };
  let explorationContents = [] as any[];

  if (isSearchActive) {
    searchResponse = await getEditorialSearchResults(
      {
        q: cleanQ,
        tipo: verifiedTipo,
        provincia: verifiedProvince,
        categoria: verifiedCategory,
        page: pageNum
      },
      territory
        ? { 
            provinceId: territory.provinceId || undefined, 
            municipalityId: territory.municipalityId || undefined 
          }
        : undefined
    );
  } else {
    // If q is empty or too short, load featured exploration content based on cookies territory
    explorationContents = await getPublishedContents(territory);
  }

  const { results, totalCount } = searchResponse;

  // Build helper URLs for persistent filtering and clean navigation
  const buildTabHref = (code: string) => {
    const queryParams = new URLSearchParams();
    if (cleanQ) queryParams.set('q', cleanQ);
    if (code !== 'todos') queryParams.set('tipo', code);
    if (selectedProv && selectedProv !== 'todas') queryParams.set('provincia', selectedProv);
    if (selectedCat && selectedCat !== 'todas') queryParams.set('categoria', selectedCat);
    return `/buscar?${queryParams.toString()}`;
  };

  const buildPaginationHref = (newPage: number) => {
    const queryParams = new URLSearchParams();
    if (cleanQ) queryParams.set('q', cleanQ);
    if (selectedTipo && selectedTipo !== 'todos') queryParams.set('tipo', selectedTipo);
    if (selectedProv && selectedProv !== 'todas') queryParams.set('provincia', selectedProv);
    if (selectedCat && selectedCat !== 'todas') queryParams.set('categoria', selectedCat);
    if (newPage > 1) queryParams.set('page', newPage.toString());
    return `/buscar?${queryParams.toString()}`;
  };

  // Determine current active territory label
  const territoryLabel = territory?.label || 'Argentina';

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <div className="flex flex-col gap-8">
        
        {/* A. Encabezado editorial */}
        <div className="flex flex-col gap-2 border-b border-stone-beige pb-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red font-mono">
            Buscador federal
          </span>
          <h1 className="text-4xl font-serif font-black text-charcoal">
            Explorá la memoria cultural de Argentina
          </h1>
          <p className="text-base text-stone-600 font-serif italic">
            Buscá historias, efemérides, personajes, instituciones, reconocimientos, revista y archivo histórico.
          </p>
        </div>

        {/* Invalid parameters alert banner */}
        {warningMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md text-xs font-serif leading-relaxed">
            ⚠️ <strong>Filtro no aplicado:</strong> {warningMessage} Los demás resultados se muestran sin este criterio.
          </div>
        )}

        {/* B. Search Form & Filters */}
        <form method="GET" action="/buscar" className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={rawQ}
                placeholder="Ej. San Martín, Cabildo, Gaucho..."
                className="w-full px-4 py-3 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-charcoal bg-white"
                minLength={3}
                required
              />
            </div>
            
            {/* hidden tab type input to preserve selected tab in form submissions */}
            {selectedTipo !== 'todos' && (
              <input type="hidden" name="tipo" value={selectedTipo} />
            )}

            <button
              type="submit"
              className="px-6 py-3 bg-charcoal hover:bg-charcoal/90 text-white text-xs uppercase font-bold tracking-wider rounded font-mono transition-colors shrink-0"
            >
              Buscar / Aplicar
            </button>

            {rawQ && (
              <Link
                href="/buscar"
                className="px-5 py-3 border border-stone-beige text-stone-700 bg-white hover:bg-stone-50 text-xs uppercase tracking-wider font-bold rounded font-mono transition-all text-center shrink-0 flex items-center justify-center"
              >
                Limpiar
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-beige/60 pt-4">
            {/* Province Filter Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="provincia" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                Por Provincia:
              </label>
              <select
                id="provincia"
                name="provincia"
                defaultValue={selectedProv}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-750 bg-white"
              >
                <option value="todas">Todas las provincias</option>
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Dropdown (only contents or todos) */}
            {(selectedTipo === 'todos' || selectedTipo === 'contenidos') && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="categoria" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">
                  Por Categoría (Historias):
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  defaultValue={selectedCat}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red font-mono text-stone-750 bg-white"
                >
                  <option value="todas">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </form>

        {/* C. Entity Tabs Selector */}
        <div className="border-b border-stone-beige/80">
          <nav className="flex overflow-x-auto gap-4 pb-0.5 scrollbar-none scroll-smooth">
            {TABS.map((tab) => {
              const isActive = selectedTipo === tab.code;
              return (
                <Link
                  key={tab.code}
                  href={buildTabHref(tab.code)}
                  className={`py-2 px-3 text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap border-b-2 transition-all shrink-0 ${
                    isActive
                      ? 'border-earth-red text-earth-red'
                      : 'border-transparent text-stone-500 hover:text-charcoal'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* D. Query execution views */}
        {!isSearchActive ? (
          /* Exploration View (No query q submitted or too short) */
          <div className="flex flex-col gap-8">
            <div className="bg-warm-white border border-stone-beige rounded-lg p-10 text-center shadow-sm flex flex-col gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-stone-beige/20 flex items-center justify-center text-stone-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h2 className="text-xl font-serif font-bold text-charcoal">
                  Empezá a explorar
                </h2>
                <p className="text-stone-600 text-sm font-serif leading-relaxed">
                  Encontrá historias, protagonistas, instituciones y documentos que forman parte de la memoria cultural argentina.
                </p>
              </div>
            </div>

            {/* Suggested articles exploration section */}
            {explorationContents.length > 0 && (
              <section className="flex flex-col gap-5">
                <div className="border-b border-stone-beige pb-2">
                  <h3 className="text-lg font-serif font-black text-charcoal">
                    Historias sugeridas para explorar ({territoryLabel})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {explorationContents.slice(0, 6).map((c) => (
                    <ContentCard
                      key={c.slug}
                      content={c}
                      territoryLabel={c.province_id ? provinces.find(p => p.id === c.province_id)?.name : null}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : results.length > 0 ? (
          /* Results View */
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono border-b border-stone-beige/50 pb-2">
              <span>
                Resultados de la búsqueda: <strong>{results.length}</strong> encontrados
              </span>
              <span>📍 Territorio: {territoryLabel}</span>
            </div>

            {/* Results Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item) => {
                const itemProvLabel = item.province_id
                  ? provinces.find(p => p.id === item.province_id)?.name
                  : null;

                switch (item.type) {
                  case 'content':
                    return (
                      <ContentCard
                        key={`content_${item.slug}`}
                        content={item.originalData}
                        territoryLabel={itemProvLabel}
                      />
                    );
                  case 'person':
                    return (
                      <PersonCard
                        key={`person_${item.slug}`}
                        person={item.originalData}
                        imageUrl={item.imageUrl}
                        territoryLabel={itemProvLabel}
                      />
                    );
                  case 'institution':
                    return (
                      <InstitutionCard
                        key={`inst_${item.slug}`}
                        institution={item.originalData}
                      />
                    );
                  case 'recognition':
                    return (
                      <RecognitionCard
                        key={`rec_${item.slug}`}
                        recognition={item.originalData}
                      />
                    );
                  case 'magazine_edition':
                    return (
                      <MagazineEditionCard
                        key={`mag_${item.slug}`}
                        edition={item.originalData}
                      />
                    );
                  case 'media_asset':
                    return (
                      <ArchiveAssetCard
                        key={`asset_${item.originalData.storage_path}`}
                        asset={item.originalData}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-stone-beige/70 pt-6 mt-4">
              {pageNum > 1 ? (
                <Link
                  href={buildPaginationHref(pageNum - 1)}
                  className="px-4 py-2 border border-stone-beige text-stone-700 bg-white hover:bg-stone-50 text-xs font-mono font-bold uppercase rounded transition-all"
                >
                  &larr; Anterior
                </Link>
              ) : (
                <span className="px-4 py-2 border border-stone-100 text-stone-300 text-xs font-mono font-bold uppercase rounded select-none cursor-not-allowed">
                  &larr; Anterior
                </span>
              )}

              <span className="text-xs font-mono text-stone-500">
                Página {pageNum}
              </span>

              {/* In our pagination logic, if results length is exactly 12, there might be more results */}
              {results.length === 12 ? (
                <Link
                  href={buildPaginationHref(pageNum + 1)}
                  className="px-4 py-2 border border-stone-beige text-stone-700 bg-white hover:bg-stone-50 text-xs font-mono font-bold uppercase rounded transition-all"
                >
                  Siguiente &rarr;
                </Link>
              ) : (
                <span className="px-4 py-2 border border-stone-100 text-stone-300 text-xs font-mono font-bold uppercase rounded select-none cursor-not-allowed">
                  Siguiente &rarr;
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Empty State (Q entered but no results matched) */
          <div className="bg-warm-white border border-stone-beige rounded-lg p-16 text-center shadow-sm flex flex-col gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-stone-beige/25 flex items-center justify-center text-stone-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="text-xl font-serif font-bold text-charcoal">
                No encontramos resultados para esta búsqueda
              </h2>
              <p className="text-stone-600 text-sm font-serif leading-relaxed">
                Probá con un término más amplio o quitá algunos filtros para explorar nuevos contenidos.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/efemerides"
                className="px-5 py-2.5 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded hover:bg-earth-red/90 transition-colors font-mono"
              >
                Ver efemérides
              </Link>
              <Link
                href="/archivo"
                className="px-5 py-2.5 border border-stone-beige text-stone-700 bg-white hover:bg-stone-50 text-xs uppercase tracking-wider font-bold rounded transition-all font-mono"
              >
                Explorar el archivo
              </Link>
            </div>
          </div>
        )}

      </div>
    </PublicPageShell>
  );
}
