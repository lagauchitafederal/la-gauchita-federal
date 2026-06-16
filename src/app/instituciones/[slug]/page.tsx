import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveInstitutionBySlug } from '../../../lib/public-content/public-content';
import PublicHeader from '../../../components/public/PublicHeader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InstitutionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const inst = await getActiveInstitutionBySlug(slug);

  if (!inst) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full flex flex-col gap-6">
        
        {/* Navigation Header */}
        <PublicHeader />

        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12 flex flex-col gap-6">
          
          {/* Navigation / Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
            <Link href="/instituciones" className="text-stone-500 hover:text-stone-900 font-medium text-sm transition-colors">
              &larr; Volver a instituciones
            </Link>
            <span className="text-xs text-stone-400 font-mono">Detalle de Institucion</span>
          </div>

          {/* Title and Badge */}
          <div className="flex flex-col gap-2">
            {inst.is_featured && (
              <span className="self-start text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider mb-2">
                Destacada
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              {inst.name}
            </h1>
            <span className="self-start text-xs text-stone-500 font-semibold uppercase tracking-wider bg-stone-100 px-2.5 py-1 rounded">
              Tipo: {inst.institution_type}
            </span>
          </div>

          {/* Description */}
          {inst.description && (
            <div className="bg-stone-50 border-l-4 border-stone-300 p-4 rounded-r-md my-2">
              <p className="text-stone-700 text-base leading-relaxed">
                {inst.description}
              </p>
            </div>
          )}

          {/* Contact and Info Grid */}
          <div className="border-t border-stone-100 pt-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-stone-800">
              Informacion de Contacto
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {inst.website_url && (
                <div>
                  <dt className="font-semibold text-stone-500">Sitio Web</dt>
                  <dd className="mt-1 text-stone-900 font-medium">
                    <a href={inst.website_url} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-900 underline transition-colors">
                      {inst.website_url}
                    </a>
                  </dd>
                </div>
              )}
              
              {inst.contact_email && (
                <div>
                  <dt className="font-semibold text-stone-500">Correo Electronico</dt>
                  <dd className="mt-1 text-stone-900 font-medium font-mono">
                    {inst.contact_email}
                  </dd>
                </div>
              )}

              {inst.contact_phone && (
                <div>
                  <dt className="font-semibold text-stone-500 font-sans">Telefono de Contacto</dt>
                  <dd className="mt-1 text-stone-900 font-medium font-mono">
                    {inst.contact_phone}
                  </dd>
                </div>
              )}

              {inst.address && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-stone-500">Direccion</dt>
                  <dd className="mt-1 text-stone-900 font-medium">
                    {inst.address}
                  </dd>
                </div>
              )}
            </dl>
          </div>

        </div>
      </div>
    </div>
  );
}
