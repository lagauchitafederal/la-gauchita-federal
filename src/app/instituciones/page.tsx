import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseTerritoryCookie } from '../../lib/utils/territory';
import { getActiveInstitutionsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';
import InstitutionCard from '../../components/cards/InstitutionCard';

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
              <InstitutionCard key={inst.slug} institution={inst} />
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
