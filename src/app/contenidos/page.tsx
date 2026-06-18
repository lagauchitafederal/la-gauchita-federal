import Link from 'next/link';
import { getPublishedContentsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contenidos culturales",
  description: "Explora las efemérides, historias y tradiciones federales de nuestro país.",
};

export default async function ContenidosPage() {
  const contents = await getPublishedContentsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Contenidos Culturales"
        description="Explora las efemérides, historias y tradiciones federales."
      />

        {/* Contents List */}
        {contents.length > 0 ? (
          <div className="flex flex-col gap-4 mt-4">
            {contents.map(c => (
              <article key={c.slug} className="bg-[#fcf8f2] border border-stone-beige rounded-lg p-6 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-xl font-serif font-bold text-charcoal hover:text-earth-red transition-colors duration-200">
                    <Link href={`/contenidos/${c.slug}`}>
                      {c.title}
                    </Link>
                  </h2>
                  {c.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Destacado
                    </span>
                  )}
                </div>

                {c.subtitle && (
                  <p className="text-sm font-semibold text-stone-700 italic">{c.subtitle}</p>
                )}

                {c.summary && (
                  <p className="text-sm text-stone-700 leading-relaxed">{c.summary}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 font-mono mt-2 pt-3 border-t border-stone-beige/50">
                  {c.publish_date && (
                    <span>Publicado: {new Date(c.publish_date).toLocaleDateString()}</span>
                  )}
                  {c.event_date && (
                    <span>Hito: {new Date(c.event_date).toLocaleDateString()}</span>
                  )}
                  <Link href={`/contenidos/${c.slug}`} className="text-earth-red hover:underline font-bold ml-auto uppercase tracking-wider text-[10px] font-mono">
                    Leer más &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aún no hay contenidos publicados.
            </p>
          </div>
        )}
    </PublicPageShell>
  );
}
