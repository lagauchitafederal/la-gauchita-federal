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
      <article className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12 flex flex-col gap-6">
          
          {/* Navigation / Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
            <Link href="/contenidos" className="text-stone-500 hover:text-stone-900 font-medium text-sm transition-colors">
              &larr; Volver a contenidos
            </Link>
            <span className="text-xs text-stone-400 font-mono">Detalle de Contenido</span>
          </div>

          {/* Title and Metadata */}
          <div className="flex flex-col gap-2">
            {content.is_featured && (
              <span className="self-start text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider mb-2">
                Destacado
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              {content.title}
            </h1>
            {content.subtitle && (
              <p className="text-lg text-stone-600 font-medium italic mt-1 leading-relaxed">
                {content.subtitle}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-stone-400 font-mono py-2 border-y border-stone-100">
            {content.publish_date && (
              <span>Publicado: {new Date(content.publish_date).toLocaleDateString()}</span>
            )}
            {content.event_date && (
              <span>Hito Historico: {new Date(content.event_date).toLocaleDateString()}</span>
            )}
          </div>

          {/* Summary (if exists, styled as callout/lead paragraph) */}
          {content.summary && (
            <div className="bg-stone-50 border-l-4 border-stone-300 p-4 rounded-r-md">
              <p className="text-stone-700 text-base leading-relaxed font-medium">
                {content.summary}
              </p>
            </div>
          )}

          {/* Body Content */}
          {content.body ? (
            <div className="text-stone-800 text-base leading-relaxed whitespace-pre-wrap font-serif flex flex-col gap-4">
              {content.body}
            </div>
          ) : (
            <p className="text-stone-400 italic text-sm">
              No hay cuerpo de texto disponible para este contenido.
            </p>
          )}

          {/* Source Reference */}
          {content.source_reference && (
            <div className="mt-8 pt-4 border-t border-stone-100 text-xs text-stone-500 font-mono">
              <span className="font-bold">Referencia:</span> {content.source_reference}
            </div>
          )}

      </article>
    </PublicPageShell>
  );
}
