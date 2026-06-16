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
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12 flex flex-col gap-6">
          
          {/* Navigation / Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
            <Link href="/reconocimientos" className="text-stone-500 hover:text-stone-900 font-medium text-sm transition-colors">
              &larr; Volver a reconocimientos
            </Link>
            <span className="text-xs text-stone-400 font-mono">Detalle de Reconocimiento</span>
          </div>

          {/* Title and Badge */}
          <div className="flex flex-col gap-2">
            {r.is_featured && (
              <span className="self-start text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider mb-2">
                Destacado
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              {r.title}
            </h1>
            <span className="self-start text-xs text-stone-500 font-semibold uppercase tracking-wider bg-stone-100 px-2.5 py-1 rounded">
              Tipo: {r.recognition_type}
            </span>
          </div>

          {/* Description */}
          {r.description && (
            <div className="bg-stone-50 border-l-4 border-stone-300 p-4 rounded-r-md my-2">
              <p className="text-stone-700 text-base leading-relaxed">
                {r.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="border-t border-stone-100 pt-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-stone-800">
              Detalles del Reconocimiento
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {r.granting_institution_name && (
                <div>
                  <dt className="font-semibold text-stone-500">Institucion Otorgante</dt>
                  <dd className="mt-1 text-stone-900 font-medium">
                    {r.granting_institution_name}
                  </dd>
                </div>
              )}

              {r.recognition_date && (
                <div>
                  <dt className="font-semibold text-stone-500">Fecha de Otorgamiento</dt>
                  <dd className="mt-1 text-stone-900 font-medium font-mono">
                    {new Date(r.recognition_date).toLocaleDateString()}
                  </dd>
                </div>
              )}

              {r.location && (
                <div>
                  <dt className="font-semibold text-stone-500">Lugar</dt>
                  <dd className="mt-1 text-stone-900 font-medium">
                    {r.location}
                  </dd>
                </div>
              )}

              {r.document_reference && (
                <div>
                  <dt className="font-semibold text-stone-500">Referencia de Documento</dt>
                  <dd className="mt-1 text-stone-900 font-medium font-mono">
                    {r.document_reference}
                  </dd>
                </div>
              )}

              {r.source_reference && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-stone-500">Referencia de Fuente</dt>
                  <dd className="mt-1 text-stone-900 font-medium text-stone-600 font-mono break-all">
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
