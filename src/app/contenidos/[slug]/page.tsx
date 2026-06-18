import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedContentBySlug } from '../../../lib/public-content/public-content';
import PublicPageShell from '../../../components/public/PublicPageShell';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getPublishedContentBySlug(slug);

  if (!content) {
    return {
      title: "Contenido no encontrado",
    };
  }

  return {
    title: content.title,
    description: content.summary || content.subtitle || undefined,
  };
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const content = await getPublishedContentBySlug(slug);

  if (!content) {
    notFound();
  }

  return (
    <PublicPageShell>
      <article className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 flex flex-col gap-6">
          
          {/* Navigation / Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60">
            <Link href="/contenidos" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
              &larr; Volver a contenidos
            </Link>
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Detalle de Contenido</span>
          </div>

          {/* Title and Metadata */}
          <div className="flex flex-col gap-2">
            {content.is_featured && (
              <span className="self-start text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider mb-2">
                Destacado
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
              {content.title}
            </h1>
            {content.subtitle && (
              <p className="text-lg text-stone-700 font-medium italic mt-1 leading-relaxed">
                {content.subtitle}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-6 text-[11px] text-stone-500 font-mono py-2 border-y border-stone-beige/50">
            {content.publish_date && (
              <span>Publicado: {new Date(content.publish_date).toLocaleDateString()}</span>
            )}
            {content.event_date && (
              <span>Hito Histórico: {new Date(content.event_date).toLocaleDateString()}</span>
            )}
          </div>

          {/* Summary (if exists, styled as callout/lead paragraph) */}
          {content.summary && (
            <div className="bg-[#fcf8f2] border-l-4 border-earth-red p-4 rounded-r-md">
              <p className="text-stone-800 text-base leading-relaxed font-medium">
                {content.summary}
              </p>
            </div>
          )}

          {/* Body Content */}
          {content.body ? (
            <div className="text-stone-850 text-base leading-relaxed whitespace-pre-wrap font-serif flex flex-col gap-4">
              {content.body}
            </div>
          ) : (
            <p className="text-stone-400 italic text-sm">
              No hay cuerpo de texto disponible para este contenido.
            </p>
          )}

          {/* Source Reference */}
          {content.source_reference && (
            <div className="mt-8 pt-4 border-t border-stone-beige/50 text-[11px] text-stone-500 font-mono">
              <span className="font-bold">Referencia:</span> {content.source_reference}
            </div>
          )}

      </article>
    </PublicPageShell>
  );
}
