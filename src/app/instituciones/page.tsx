import Link from 'next/link';
import { getActiveInstitutionsList } from '../../lib/public-content/public-content';
import PublicHeader from '../../components/public/PublicHeader';

export default async function InstitucionesPage() {
  const institutions = await getActiveInstitutionsList();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full flex flex-col gap-6">
        
        {/* Navigation Header */}
        <PublicHeader />

        {/* Title */}
        <div className="py-4 border-b border-stone-200">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
            Instituciones Participantes
          </h1>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed">
            Contamos con la participacion de instituciones, organismos y espacios culturales que fortalecen la memoria federal.
          </p>
        </div>

        {/* Institutions List */}
        {institutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutions.map(inst => (
              <div key={inst.slug} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 flex flex-col gap-2 hover:border-stone-300 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-lg font-bold text-stone-900 hover:text-stone-700 transition-colors">
                    <Link href={`/instituciones/${inst.slug}`}>
                      {inst.name}
                    </Link>
                  </h2>
                  {inst.is_featured && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium shrink-0">
                      Destacada
                    </span>
                  )}
                </div>

                <span className="text-xs text-stone-500 font-semibold tracking-wider uppercase">
                  {inst.institution_type}
                </span>

                {inst.description && (
                  <p className="text-sm text-stone-600 line-clamp-3">{inst.description}</p>
                )}

                <div className="mt-auto pt-4 border-t border-stone-100 flex justify-end">
                  <Link href={`/instituciones/${inst.slug}`} className="text-xs text-stone-600 hover:text-stone-900 font-bold font-mono">
                    Ver mas detalles &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aun no hay instituciones activas cargadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
