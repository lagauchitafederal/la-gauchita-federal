import {
  getRegions,
  getProvinces,
  getMunicipalities,
  getContentTypes,
  getCategories,
  getMembershipLevels
} from '../lib/catalogs/catalogs';
import { checkSupabaseEnvironment } from '../lib/supabase/healthcheck';

export default async function Home() {
  const envCheck = checkSupabaseEnvironment();

  // Fetch all catalogs in parallel
  const [
    regions,
    provinces,
    municipalities,
    contentTypes,
    categories,
    membershipLevels
  ] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getContentTypes(),
    getCategories(),
    getMembershipLevels()
  ]);

  // Evaluate connection status based on environment variables and database responses
  const dbConnected = regions.length > 0 || provinces.length > 0 || municipalities.length > 0;
  const isConnectionSuccessful = envCheck.status === 'ok' && dbConnected;

  // Filter specific municipalities for display
  const targetNames = ["Salta", "La Silleta", "Campo Quijano"];
  const filteredMunicipalities = municipalities.filter(m =>
    targetNames.some(target => m.name.toLowerCase().includes(target.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-3xl w-full bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12">
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
            Estado de Conexión
          </h2>
          <div className="flex items-center gap-3">
            <span className={`inline-block w-3.5 h-3.5 rounded-full ${isConnectionSuccessful ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-stone-700 font-medium">
              {isConnectionSuccessful 
                ? 'Conectado exitosamente con Supabase (Desarrollo)' 
                : 'Error de Conexión o catálogo vacÃ­o'}
            </span>
          </div>
          {envCheck.status === 'error' && (
            <p className="mt-2 text-sm text-rose-600 bg-rose-50 p-3 rounded border border-rose-100">
              {envCheck.message}
            </p>
          )}
        </div>

        {/* Catalogs Counts Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            Resumen de catálogos Cargados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <span className="block text-sm text-stone-500 font-medium">Categorías</span>
              <span className="text-3xl font-extrabold text-stone-900">{categories.length}</span>
            </div>
            <div className="bg-stone-50 p-4 rounded-md border border-stone-200/60">
              <span className="block text-sm text-stone-500 font-medium">Niveles de Membresía</span>
              <span className="text-3xl font-extrabold text-stone-900">{membershipLevels.length}</span>
            </div>
          </div>
        </div>

        {/* Featured Municipalities */}
        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">
            Municipios de Muestra
          </h2>
          {filteredMunicipalities.length > 0 ? (
            <ul className="divide-y divide-stone-100 bg-stone-50 border border-stone-200/60 rounded-md overflow-hidden">
              {filteredMunicipalities.map(m => (
                <li key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                  <div>
                    <span className="font-semibold text-stone-900">{m.name}</span>
                    <span className="ml-2 text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-medium">
                      {m.code}
                    </span>
                  </div>
                  {m.latitude && m.longitude && (
                    <span className="text-xs text-stone-500 font-mono">
                      Lat: {m.latitude} / Long: {m.longitude}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-stone-500 text-sm italic bg-stone-50 p-4 rounded-md border border-stone-100">
              No se encontraron los municipios de muestra (Salta, La Silleta, Campo Quijano) en los datos cargados.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

