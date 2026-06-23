import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getActiveInstitutionsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';
import { formatInstitutionType } from '../../lib/utils/formatters';

export const metadata: Metadata = {
  title: "Red cultural e institucional",
  description: "Listado de instituciones participantes, entidades de la sociedad civil y espacios vinculados al archivo documental de La Gauchita Federal.",
};

export default async function InstitucionesPage() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const territory = parseTerritoryCookie(rawCookie);

  const institutions = await getActiveInstitutionsList(territory);


  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Red cultural e institucional"
        description="Instituciones participantes, organismos públicos, archivos, bibliotecas, museos y entidades culturales vinculadas a los documentos y reconocimientos de La Gauchita Federal."
      />

        {institutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {institutions.map(inst => (
              <div key={inst.slug} className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-lg font-serif font-bold text-charcoal hover:text-earth-red transition-colors duration-200 leading-snug">
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

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 tracking-wider uppercase shrink-0">
                    {formatInstitutionType(inst.institution_type)}
                  </span>
                  {inst.address && (
                    <span className="text-[10px] text-stone-600 bg-stone-beige/40 px-2.5 py-0.5 rounded border border-stone-beige/60 tracking-wider font-medium shrink-0">
                      Ubicación: {inst.address}
                    </span>
                  )}
                </div>

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
