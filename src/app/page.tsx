import {
  getRegions,
  getProvinces,
  getMunicipalities,
  getContentTypes,
  getCategories,
  getMembershipLevels
} from '../lib/catalogs/catalogs';
import {
  getPublishedContents,
  getActiveInstitutions,
  getActiveRecognitions,
  getPublicMediaAssets
} from '../lib/public-content/public-content';
import { checkSupabaseEnvironment } from '../lib/supabase/healthcheck';
import PublicHeader from '../components/public/PublicHeader';

export default async function Home() {
  const envCheck = checkSupabaseEnvironment();

  // Fetch all data in parallel (catalogs + public logical entities)
  const [
    regions,
    provinces,
    municipalities,
    contentTypes,
    categories,
    membershipLevels,
    contents,
    institutions,
    recognitions,
    mediaAssets
  ] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getContentTypes(),
    getCategories(),
    getMembershipLevels(),
    getPublishedContents(),
    getActiveInstitutions(),
    getActiveRecognitions(),
    getPublicMediaAssets()
  ]);

  // Evaluate connection status based on environment variables and database responses
  const dbConnected = regions.length > 0 || provinces.length > 0 || municipalities.length > 0;
  const isConnectionSuccessful = envCheck.status === 'ok' && dbConnected;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex flex-col gap-8">
        
        {/* Navigation Header */}
        <PublicHeader />

        {/* Core Control Center Box */}
        <header className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12">
          {/* Header */}
          <div className="border-b border-stone-100 pb-6 mb-8 text-center sm:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 mb-2">
              La Gauchita Federal
            </h1>
            <p className="text-lg text-stone-600 font-medium italic">
              "Donde late la historia de cada argentino"
            </p>
          </div>

          {/* Supabase Connection Status */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-stone-800 mb-3">
              Estado de Conexion
            </h2>
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3.5 h-3.5 rounded-full ${isConnectionSuccessful ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-stone-700 font-medium">
                {isConnectionSuccessful 
                  ? 'Conectado exitosamente con Supabase (Desarrollo)' 
                  : 'Error de conexion o catalogo vacio'}
              </span>
            </div>
            {envCheck.status === 'error' && (
              <p className="mt-2 text-sm text-rose-600 bg-rose-50 p-3 rounded border border-rose-100">
                {envCheck.message}
              </p>
            )}
          </div>

          {/* Catalogs Counts Grid */}
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-4">
              Resumen de Catalogos Cargados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
                <span className="block text-sm text-stone-500 font-medium">Regiones</span>
                <span className="text-3xl font-extrabold text-stone-900">{regions.length}</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
                <span className="block text-sm text-stone-500 font-medium">Provincias</span>
                <span className="text-3xl font-extrabold text-stone-900">{provinces.length}</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
                <span className="block text-sm text-stone-500 font-medium">Municipios</span>
                <span className="text-3xl font-extrabold text-stone-900">{municipalities.length}</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
                <span className="block text-sm text-stone-500 font-medium">Tipos de Contenido</span>
                <span className="text-3xl font-extrabold text-stone-900">{contentTypes.length}</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
                <span className="block text-sm text-stone-500 font-medium">Categorias</span>
                <span className="text-3xl font-extrabold text-stone-900">{categories.length}</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
                <span className="block text-sm text-stone-500 font-medium">Niveles de Membresia</span>
                <span className="text-3xl font-extrabold text-stone-900">{membershipLevels.length}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Section: Instituciones Participantes */}
        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
            Instituciones Participantes
          </h2>
          {institutions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institutions.map(inst => (
                <div key={inst.slug} className="p-4 bg-stone-50 border border-stone-200 rounded-md flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-stone-800">{inst.name}</h3>
                    {inst.is_featured && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                        Destacada
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 font-semibold tracking-wider uppercase">
                    {inst.institution_type}
                  </span>
                  {inst.description && (
                    <p className="text-sm text-stone-600 line-clamp-2">{inst.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm italic py-4">
              Aun no hay instituciones activas cargadas.
            </p>
          )}
        </section>

        {/* Section: Contenidos Culturales */}
        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
            Contenidos Culturales
          </h2>
          {contents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {contents.map(c => (
                <div key={c.slug} className="p-5 bg-stone-50 border border-stone-200 rounded-md flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-lg text-stone-900">{c.title}</h3>
                    {c.is_featured && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium shrink-0">
                        Destacado
                      </span>
                    )}
                  </div>
                  {c.subtitle && (
                    <p className="text-sm font-medium text-stone-700">{c.subtitle}</p>
                  )}
                  {c.summary && (
                    <p className="text-sm text-stone-600">{c.summary}</p>
                  )}
                  {c.publish_date && (
                    <span className="text-xs text-stone-400 font-mono mt-2">
                      Publicado: {new Date(c.publish_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm italic py-4">
              Aun no hay contenidos publicados.
            </p>
          )}
        </section>

        {/* Section: Reconocimientos */}
        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
            Reconocimientos
          </h2>
          {recognitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recognitions.map(r => (
                <div key={r.slug} className="p-4 bg-stone-50 border border-stone-200 rounded-md flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-stone-800">{r.title}</h3>
                    {r.is_featured && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                        Destacado
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 font-semibold uppercase">
                    {r.recognition_type}
                  </span>
                  {r.description && (
                    <p className="text-sm text-stone-600">{r.description}</p>
                  )}
                  {r.recognition_date && (
                    <span className="text-xs text-stone-400 font-mono mt-1">
                      Fecha: {new Date(r.recognition_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm italic py-4">
              Aun no hay reconocimientos publicos cargados.
            </p>
          )}
        </section>

        {/* Section: Archivo y Medios */}
        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
            Archivo y Medios
          </h2>
          {mediaAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediaAssets.map(ma => (
                <div key={ma.storage_path} className="p-4 bg-stone-50 border border-stone-200 rounded-md flex flex-col gap-2">
                  <h3 className="font-bold text-stone-800">{ma.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                    <span className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      {ma.asset_type}
                    </span>
                    <span className="font-mono">
                      {ma.bucket_name}/{ma.storage_path}
                    </span>
                  </div>
                  {ma.alt_text && (
                    <p className="text-xs text-stone-500">Alt: {ma.alt_text}</p>
                  )}
                  {ma.credit && (
                    <p className="text-xs text-stone-400">Credito: {ma.credit}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm italic py-4">
              Aun no hay medios publicos cargados.
            </p>
          )}
        </section>

      </div>
    </div>
  );
}