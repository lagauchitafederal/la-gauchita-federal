import Link from 'next/link';
import { getActiveRecognitionsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Reconocimientos",
  description: "Premios, menciones y distinciones que fortalecen la trayectoria cultural del proyecto.",
};

export default async function ReconocimientosPage() {
  const recognitions = await getActiveRecognitionsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Reconocimientos"
        description="Premios, menciones y distinciones que fortalecen la trayectoria cultural del proyecto."
      />

        {recognitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {recognitions.map(r => (
              <div key={r.slug} className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-lg font-serif font-bold text-charcoal hover:text-earth-red transition-colors duration-200 leading-snug">
                    <Link href={`/reconocimientos/${r.slug}`}>
                      {r.title}
                    </Link>
                  </h2>
                  {r.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Destacado
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase shrink-0">
                    {r.recognition_type}
                  </span>
                  {r.granting_institution_name && (
                    <span className="text-[10px] text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/60 tracking-wider font-medium shrink-0">
                      Otorgado por: {r.granting_institution_name}
                    </span>
                  )}
                </div>

                {r.description && (
                  <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">{r.description}</p>
                )}

                <div className="mt-auto pt-3 border-t border-stone-beige/50 flex justify-between items-center gap-4">
                  {r.recognition_date && (
                    <span className="text-[11px] text-stone-500 font-mono">
                      Fecha: {new Date(r.recognition_date).toLocaleDateString()}
                    </span>
                  )}
                  <Link href={`/reconocimientos/${r.slug}`} className="text-[10px] text-earth-red hover:underline font-bold font-mono uppercase tracking-wider">
                    Ver detalles &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aún no hay reconocimientos públicos cargados.
            </p>
          </div>
        )}
    </PublicPageShell>
  );
}
