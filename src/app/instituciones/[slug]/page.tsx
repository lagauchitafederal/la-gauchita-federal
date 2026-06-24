import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveInstitutionBySlug } from '../../../lib/public-content/public-content';
import { getPublicEditorialRelations } from '../../../lib/public-content/public-editorial-relations';
import PublicEditorialRelations from '../../../components/public/PublicEditorialRelations';
import PublicPageShell from '../../../components/public/PublicPageShell';
import type { Metadata } from 'next';
import { formatInstitutionType } from '../../../lib/utils/formatters';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const inst = await getActiveInstitutionBySlug(slug);

  if (!inst) {
    return {
      title: "Institución no encontrada",
    };
  }

  return {
    title: inst.name,
    description: inst.description || undefined,
  };
}

export default async function InstitutionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const inst = await getActiveInstitutionBySlug(slug);

  if (!inst) {
    notFound();
  }

  // Fetch related editorial relations if the institution has an ID
  const relations = inst.id ? await getPublicEditorialRelations('institution', inst.id) : [];

  return (
    <PublicPageShell>
      <div className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 flex flex-col gap-6">
          
          {/* Navigation / Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-beige/60">
            <Link href="/instituciones" className="text-stone-500 hover:text-earth-red font-bold text-xs uppercase tracking-wider transition-colors duration-200">
              &larr; Volver a instituciones
            </Link>
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">Detalle de Institución</span>
          </div>

          {/* Title and Badge */}
          <div className="flex flex-col gap-2">
            {inst.is_featured && (
              <span className="self-start text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider mb-2">
                Destacada
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-charcoal leading-tight">
              {inst.name}
            </h1>
            <span className="self-start text-[10px] font-bold text-earth-red bg-earth-red/5 px-2.5 py-1 rounded border border-earth-red/10 tracking-wider uppercase">
              Tipo: {formatInstitutionType(inst.institution_type)}
            </span>
          </div>

          {/* Description */}
          {inst.description && (
            <div className="bg-[#fcf8f2] border-l-4 border-earth-red p-4 rounded-r-md my-2">
              <p className="text-stone-800 text-base leading-relaxed">
                {inst.description}
              </p>
            </div>
          )}

          {/* Contact and Info Grid */}
          <div className="border-t border-stone-beige/50 pt-6 flex flex-col gap-4">
            <h2 className="text-base font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
              Información de Contacto
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {inst.website_url && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Sitio Web</dt>
                  <dd className="mt-1 text-charcoal font-medium">
                    <a href={inst.website_url} target="_blank" rel="noopener noreferrer" className="text-earth-red hover:underline transition-colors">
                      {inst.website_url}
                    </a>
                  </dd>
                </div>
              )}
              
              {inst.contact_email && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Correo Electrónico</dt>
                  <dd className="mt-1 text-charcoal font-medium font-mono">
                    {inst.contact_email}
                  </dd>
                </div>
              )}

              {inst.contact_phone && (
                <div>
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider font-sans">Teléfono de Contacto</dt>
                  <dd className="mt-1 text-charcoal font-medium font-mono">
                    {inst.contact_phone}
                  </dd>
                </div>
              )}

              {inst.address && (
                <div className="sm:col-span-2">
                  <dt className="font-bold text-stone-500 text-[10px] uppercase tracking-wider">Dirección</dt>
                  <dd className="mt-1 text-charcoal font-medium">
                    {inst.address}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Editorial Relations */}
          {relations.length > 0 && (
            <div className="border-t border-stone-beige/50 pt-8 mt-4">
              <PublicEditorialRelations relations={relations} />
            </div>
          )}

      </div>
    </PublicPageShell>
  );
}
