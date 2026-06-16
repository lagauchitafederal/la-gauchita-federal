import Link from 'next/link';
import { getActiveRecognitionsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';

export default async function ReconocimientosPage() {
  const recognitions = await getActiveRecognitionsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Reconocimientos"
        description="Premios, menciones y distinciones que fortalecen la trayectoria cultural del proyecto."
      />

        {/* Recognitions List */}
        {recognitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recognitions.map(r => (
              <div key={r.slug} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 flex flex-col gap-2 hover:border-stone-300 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-lg font-bold text-stone-900 hover:text-stone-700 transition-colors">
                    <Link href={`/reconocimientos/${r.slug}`}>
                      {r.title}
                    </Link>
                  </h2>
                  {r.is_featured && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium shrink-0">
                      Destacado
                    </span>
                  )}
                </div>

                <span className="text-xs text-stone-500 font-semibold tracking-wider uppercase">
                  {r.recognition_type}
                </span>

                {r.description && (
                  <p className="text-sm text-stone-600 line-clamp-3">{r.description}</p>
                )}

                <div className="mt-auto pt-4 border-t border-stone-100 flex justify-between items-center gap-4">
                  {r.recognition_date && (
                    <span className="text-xs text-stone-400 font-mono">
                      Fecha: {new Date(r.recognition_date).toLocaleDateString()}
                    </span>
                  )}
                  <Link href={`/reconocimientos/${r.slug}`} className="text-xs text-stone-600 hover:text-stone-900 font-bold font-mono">
                    Ver detalles &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aun no hay reconocimientos publicos cargados.
            </p>
          </div>
        )}
    </PublicPageShell>
  );
}
