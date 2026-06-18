import Link from 'next/link';
import { getActiveInstitutionsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';
import { formatInstitutionType } from '../../lib/utils/formatters';

export const metadata: Metadata = {
  title: "Instituciones participantes",
  description: "Contamos con la participación de instituciones, organismos y espacios culturales que fortalecen la memoria federal.",
};

export default async function InstitucionesPage() {
  const institutions = await getActiveInstitutionsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Instituciones Participantes"
        description="Contamos con la participación de instituciones, organismos y espacios culturales que fortalecen la memoria federal."
      />

        {institutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {institutions.map(inst => (
              <div key={inst.slug} className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 flex flex-col gap-3 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-lg font-serif font-bold text-charcoal hover:text-earth-red transition-colors duration-200">
                    <Link href={`/instituciones/${inst.slug}`}>
                      {inst.name}
                    </Link>
                  </h2>
                  {inst.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Destacada
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 self-start tracking-wider uppercase">
                  {formatInstitutionType(inst.institution_type)}
                </span>

                {inst.description && (
                  <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">{inst.description}</p>
                )}

                <div className="mt-auto pt-3 border-t border-stone-beige/50 flex justify-end">
                  <Link href={`/instituciones/${inst.slug}`} className="text-[10px] text-earth-red hover:underline font-bold font-mono uppercase tracking-wider">
                    Ver más detalles &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aún no hay instituciones activas cargadas.
            </p>
          </div>
        )}
    </PublicPageShell>
  );
}
