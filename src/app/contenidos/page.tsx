import Link from 'next/link';
import { getPublishedContentsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';

export default async function ContenidosPage() {
  const contents = await getPublishedContentsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Contenidos Culturales"
        description="Explora las efemerides, historias y tradiciones federales."
      />

        {/* Contents List */}
        {contents.length > 0 ? (
          <div className="flex flex-col gap-4">
            {contents.map(c => (
              <article key={c.slug} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 flex flex-col gap-2 hover:border-stone-300 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-xl font-bold text-stone-900 hover:text-stone-700 transition-colors">
                    <Link href={`/contenidos/${c.slug}`}>
                      {c.title}
                    </Link>
                  </h2>
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
                  <p className="text-sm text-stone-600 line-clamp-3">{c.summary}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 font-mono mt-2 pt-2 border-t border-stone-100">
                  {c.publish_date && (
                    <span>Publicado: {new Date(c.publish_date).toLocaleDateString()}</span>
                  )}
                  {c.event_date && (
                    <span>Hito: {new Date(c.event_date).toLocaleDateString()}</span>
                  )}
                  <Link href={`/contenidos/${c.slug}`} className="text-stone-600 hover:text-stone-900 font-semibold ml-auto">
                    Leer mas &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aun no hay contenidos publicados.
            </p>
          </div>
        )}
    </PublicPageShell>
  );
}
