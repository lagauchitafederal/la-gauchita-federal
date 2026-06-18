import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveRecognitionBySlug } from '../../../lib/public-content/public-content';
import PublicPageShell from '../../../components/public/PublicPageShell';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const r = await getActiveRecognitionBySlug(slug);

  if (!r) {
    return {
      title: "Reconocimiento no encontrado",
    };
  }

  return {
    title: r.title,
    description: r.description || undefined,
  };
}

export default async function RecognitionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const r = await getActiveRecognitionBySlug(slug);

  if (!r) {
    notFound();
  }

  return (
    <PublicPageShell>
      <div className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 flex flex-col gap-6">
          
          {/* Navigation / Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60">
            <Link href="/reconocimientos" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
              &larr; Volver a reconocimientos
            </Link>
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Detalle de Reconocimiento</span>
          </div>

          {/* Title and Badge */}
          <div className="flex flex-col gap-2">
            {r.is_featured && (
              <span className="self-start text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider mb-2">
                Destacado
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
              {r.title}
            </h1>
            <span className="self-start text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-1 rounded border border-earth-red/10 tracking-wider uppercase">
              Tipo: {r.recognition_type}
            </span>
          </div>

          {/* Description */}
          {r.description && (
            <div className="bg-[#fcf8f2] border-l-4 border-earth-red p-4 rounded-r-md my-2">
              <p className="text-stone-800 text-base leading-relaxed">
                {r.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="border-t border-stone-beige/50 pt-6 flex flex-col gap-4">
            <h2 className="text-base font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
              Detalles del Reconocimiento
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {r.granting_institution_name && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Institución Otorgante</dt>
                  <dd className="mt-1 text-charcoal font-medium">
                    {r.granting_institution_name}
                  </dd>
                </div>
              )}

              {r.recognition_date && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Fecha de Otorgamiento</dt>
                  <dd className="mt-1 text-charcoal font-medium font-mono">
                    {new Date(r.recognition_date).toLocaleDateString()}
                  </dd>
                </div>
              )}

              {r.location && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Lugar</dt>
                  <dd className="mt-1 text-charcoal font-medium">
                    {r.location}
                  </dd>
                </div>
              )}

              {r.document_reference && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Referencia de Documento</dt>
                  <dd className="mt-1 text-charcoal font-medium font-mono">
                    {r.document_reference}
                  </dd>
                </div>
              )}

              {r.source_reference && (
                <div className="sm:col-span-2">
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Referencia de Fuente</dt>
                  <dd className="mt-1 text-charcoal font-medium text-stone-600 font-mono break-all">
                    {r.source_reference}
                  </dd>
                </div>
              )}
            </dl>
          </div>

      </div>
    </PublicPageShell>
  );
}
