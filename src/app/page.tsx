import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getRegions,
  getProvinces,
  getMunicipalities,
  getContentTypes,
  getCategories,
  getMembershipLevels
} from '../lib/catalogs/catalogs';
import {
  getPublishedContents,
  getActiveInstitutions,
  getActiveRecognitions,
  getPublicMediaAssets
} from '../lib/public-content/public-content';
import PublicPageShell from '../components/public/PublicPageShell';
import { formatInstitutionType, formatAssetType } from '../lib/utils/formatters';
import { getPublicMediaUrl } from '../lib/utils/media-url';

export const metadata: Metadata = {
  title: 'La Gauchita Federal',
  description: 'Donde late la historia de cada argentino. Conectando regiones, provincias y municipios.',
};

export default async function Home() {
  const [
    regions,
    provinces,
    municipalities,
    contentTypes,
    categories,
    membershipLevels,
    contents,
    institutions,
    recognitions,
    mediaAssets
  ] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities(),
    getContentTypes(),
    getCategories(),
    getMembershipLevels(),
    getPublishedContents(),
    getActiveInstitutions(),
    getActiveRecognitions(),
    getPublicMediaAssets()
  ]);

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <header className="bg-warm-white border border-stone-beige rounded-lg p-8 md:p-12 flex flex-col gap-8">
        <div className="border-b border-stone-beige/80 pb-6 text-center sm:text-left flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-charcoal">
            La Gauchita Federal
          </h1>
          <p className="text-base text-stone-600 font-medium italic">
            "Donde late la historia de cada argentino"
          </p>
        </div>

        <div>
          <h2 className="text-base font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Resumen de catálogos cargados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-[#fcf8f2] p-4 rounded-md border border-stone-beige/80 hover:border-muted-amber transition-colors duration-200">
              <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Regiones</span>
              <span className="text-3xl font-serif font-black text-earth-red">{regions.length}</span>
            </div>
            <div className="bg-[#fcf8f2] p-4 rounded-md border border-stone-beige/80 hover:border-muted-amber transition-colors duration-200">
              <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Provincias</span>
              <span className="text-3xl font-serif font-black text-earth-red">{provinces.length}</span>
            </div>
            <div className="bg-[#fcf8f2] p-4 rounded-md border border-stone-beige/80 hover:border-muted-amber transition-colors duration-200">
              <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Municipios</span>
              <span className="text-3xl font-serif font-black text-earth-red">{municipalities.length}</span>
            </div>
            <div className="bg-[#fcf8f2] p-4 rounded-md border border-stone-beige/80 hover:border-muted-amber transition-colors duration-200">
              <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Tipos de Contenido</span>
              <span className="text-3xl font-serif font-black text-earth-red">{contentTypes.length}</span>
            </div>
            <div className="bg-[#fcf8f2] p-4 rounded-md border border-stone-beige/80 hover:border-muted-amber transition-colors duration-200">
              <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Categorías</span>
              <span className="text-3xl font-serif font-black text-earth-red">{categories.length}</span>
            </div>
            <div className="bg-[#fcf8f2] p-4 rounded-md border border-stone-beige/80 hover:border-muted-amber transition-colors duration-200">
              <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Niveles de Membrería</span>
              <span className="text-3xl font-serif font-black text-earth-red">{membershipLevels.length}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/contenidos" className="bg-warm-white border border-stone-beige rounded-lg p-6 hover:border-muted-amber hover:bg-[#fcfbf9] transition-all duration-300 flex flex-col gap-2 group">
          <h3 className="font-serif font-bold text-charcoal text-lg group-hover:text-earth-red transition-colors duration-200">Contenidos</h3>
          <p className="text-sm text-stone-700 leading-relaxed">
            Explorá las efemérides, historias y tradiciones federales de nuestro país.
          </p>
          <span className="text-xs font-bold text-earth-red mt-auto font-mono flex items-center gap-1 uppercase tracking-wider">
            Ingresar &rarr;
          </span>
        </Link>

        <Link href="/instituciones" className="bg-warm-white border border-stone-beige rounded-lg p-6 hover:border-muted-amber hover:bg-[#fcfbf9] transition-all duration-300 flex flex-col gap-2 group">
          <h3 className="font-serif font-bold text-charcoal text-lg group-hover:text-earth-red transition-colors duration-200">Instituciones</h3>
          <p className="text-sm text-stone-700 leading-relaxed">
            Conoce los organismos y espacios culturales que fortalecen la memoria federal.
          </p>
          <span className="text-xs font-bold text-earth-red mt-auto font-mono flex items-center gap-1 uppercase tracking-wider">
            Ingresar &rarr;
          </span>
        </Link>

        <Link href="/reconocimientos" className="bg-warm-white border border-stone-beige rounded-lg p-6 hover:border-muted-amber hover:bg-[#fcfbf9] transition-all duration-300 flex flex-col gap-2 group">
          <h3 className="font-serif font-bold text-charcoal text-lg group-hover:text-earth-red transition-colors duration-200">Reconocimientos</h3>
          <p className="text-sm text-stone-700 leading-relaxed">
            Premios, menciones y distinciones que avalan la trayectoria de nuestro proyecto.
          </p>
          <span className="text-xs font-bold text-earth-red mt-auto font-mono flex items-center gap-1 uppercase tracking-wider">
            Ingresar &rarr;
          </span>
        </Link>

        <Link href="/archivo" className="bg-warm-white border border-stone-beige rounded-lg p-6 hover:border-muted-amber hover:bg-[#fcfbf9] transition-all duration-300 flex flex-col gap-2 group">
          <h3 className="font-serif font-bold text-charcoal text-lg group-hover:text-earth-red transition-colors duration-200">Archivo y Medios</h3>
          <p className="text-sm text-stone-700 leading-relaxed">
            Fotografías, documentos y portadas históricas vinculadas al patrimonio.
          </p>
          <span className="text-xs font-bold text-earth-red mt-auto font-mono flex items-center gap-1 uppercase tracking-wider">
            Ingresar &rarr;
          </span>
        </Link>
      </section>

      <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-serif font-black text-charcoal mb-6 pb-3 border-b border-stone-beige/85">
          Instituciones Participantes
        </h2>
        {institutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutions.map((inst) => (
              <div key={inst.slug} className="p-5 bg-[#fcf8f2] border border-stone-beige rounded-lg flex flex-col gap-2.5 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-serif font-bold text-charcoal text-base">{inst.name}</h3>
                  {inst.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Destacada
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 self-start tracking-wider uppercase">
                  {formatInstitutionType(inst.institution_type)}
                </span>
                {inst.description && (
                  <p className="text-sm text-stone-700 leading-relaxed line-clamp-2">{inst.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-sm italic py-4">
            Aún no hay instituciones activas cargadas.
          </p>
        )}
      </section>

      <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-serif font-black text-charcoal mb-6 pb-3 border-b border-stone-beige/85">
          Contenidos Culturales
        </h2>
        {contents.length > 0 ? (
          <div className="flex flex-col gap-4">
            {contents.map((c) => (
              <div key={c.slug} className="p-6 bg-[#fcf8f2] border border-stone-beige rounded-lg flex flex-col gap-3 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-serif font-bold text-lg text-charcoal">{c.title}</h3>
                  {c.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
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
                {c.publish_date && (
                  <span className="text-[11px] text-stone-500 font-mono mt-1 flex items-center gap-1">
                    Publicado: {new Date(c.publish_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-sm italic py-4">
            Aún no hay contenidos publicados.
          </p>
        )}
      </section>

      <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-serif font-black text-charcoal mb-6 pb-3 border-b border-stone-beige/85">
          Reconocimientos
        </h2>
        {recognitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recognitions.map((r) => (
              <div key={r.slug} className="p-5 bg-[#fcf8f2] border border-stone-beige rounded-lg flex flex-col gap-2.5 hover:border-muted-amber transition-colors duration-200">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-serif font-bold text-charcoal text-base">{r.title}</h3>
                  {r.is_featured && (
                    <span className="text-[10px] bg-muted-amber/10 text-amber-900 border border-muted-amber/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Destacado
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded border border-earth-red/10 self-start tracking-wider uppercase">
                  {r.recognition_type}
                </span>
                {r.description && (
                  <p className="text-sm text-stone-700 leading-relaxed">{r.description}</p>
                )}
                {r.recognition_date && (
                  <span className="text-[11px] text-stone-500 font-mono mt-1 flex items-center gap-1">
                    Fecha: {new Date(r.recognition_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-sm italic py-4">
            Aún no hay reconocimientos públicos cargados.
          </p>
        )}
      </section>

      <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-serif font-black text-charcoal mb-6 pb-3 border-b border-stone-beige/85">
          Archivo y Medios
        </h2>
        {mediaAssets.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mediaAssets.slice(0, 3).map((ma) => {
                const imageUrl = getPublicMediaUrl(ma.bucket_name, ma.storage_path);
                const isImage = 
                  (ma.mime_type && ma.mime_type.startsWith('image/')) ||
                  [
                    'cover_image',
                    'content_image',
                    'gallery_image',
                    'historical_photo'
                  ].includes(ma.asset_type);

                const useContain = ['recognition_document', 'cover_image'].includes(ma.asset_type);

                return (
                  <div key={ma.storage_path} className="bg-warm-white border border-stone-beige rounded-lg overflow-hidden flex flex-col hover:border-muted-amber transition-colors duration-300">
                    {isImage && imageUrl ? (
                      useContain ? (
                        <div className="relative w-full h-48 bg-[#f6f0e6] flex items-center justify-center p-4 border-b border-stone-beige/60">
                          <img
                            src={imageUrl}
                            alt={ma.alt_text || ma.title}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-48 bg-[#f6f0e6] overflow-hidden border-b border-stone-beige/60">
                          <img
                            src={imageUrl}
                            alt={ma.alt_text || ma.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    ) : (
                      <div className="relative w-full h-48 bg-[#f6f0e6] flex flex-col items-center justify-center p-6 border-b border-stone-beige/60 text-stone-400 gap-2">
                        <svg className="w-10 h-10 text-stone-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                          {formatAssetType(ma.asset_type)}
                        </span>
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-grow gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-earth-red bg-earth-red/5 px-2 py-0.5 rounded self-start border border-earth-red/10">
                        {formatAssetType(ma.asset_type)}
                      </span>
                      <h3 className="font-serif font-bold text-charcoal text-base line-clamp-2">{ma.title}</h3>
                      {ma.credit && (
                        <span className="text-[11px] text-stone-500 mt-auto pt-2 border-t border-stone-beige/50 italic">
                          Crédito: {ma.credit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <Link href="/archivo" className="inline-flex items-center justify-center px-5 py-2.5 border border-stone-beige text-xs uppercase tracking-wider font-bold rounded-md text-stone-700 bg-white hover:bg-stone-50 hover:text-earth-red transition-all duration-200 shadow-sm gap-2">
                Ver archivo completo &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-stone-500 text-sm italic py-4">
            Aún no hay medios públicos cargados.
          </p>
        )}
      </section>
    </PublicPageShell>
  );
}