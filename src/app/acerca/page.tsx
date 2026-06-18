import type { Metadata } from 'next';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';

export const metadata: Metadata = {
  title: "Acerca de nosotros",
  description: "Una plataforma cultural para preservar, organizar y difundir la memoria histórica y el patrimonio federal argentino.",
};

export default function AcercaPage() {
  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Acerca de La Gauchita Federal"
        description="Una plataforma cultural para preservar, organizar y difundir la memoria histórica y el patrimonio federal argentino."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Origen y propósito
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            La Gauchita Federal nace como una iniciativa de digitalización, organización y puesta en valor del patrimonio cultural e histórico argentino. Nuestro propósito central es conectar la historia local de cada región, provincia y municipio, reuniendo contenidos, instituciones participantes y referencias documentales de entidades vinculadas al patrimonio cultural para salvaguardar la memoria colectiva del país.
          </p>
        </section>

        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Instituto Cultural Andino
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            El Instituto Cultural Andino es un pilar fundamental en la investigación y promoción de las tradiciones, el folklore y el patrimonio cultural del norte argentino. Mediante este portal, colabora de manera activa en la difusión de materiales y documentos valiosos para docentes, investigadores y estudiantes.
          </p>
        </section>

        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Revista La Gauchita
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            Con una larga trayectoria en la comunicación cultural e histórica, Revista La Gauchita ha sido un medio clave para registrar testimonios, crónicas, efemérides y expresiones artísticas. Este portal representa su evolución digital, ampliando su alcance para abrazar un carácter plenamente federal.
          </p>
        </section>

        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Eduardo Ceballos
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            Como escritor, periodista y promotor cultural, Eduardo Ceballos ha dedicado su labor al rescate y resguardo de la identidad federal. Su trayectoria y sus valiosas recopilaciones históricas forman parte del núcleo de conocimiento que este portal busca poner al alcance de todos los ciudadanos.
          </p>
        </section>

        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Alcance federal
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            Creemos que la historia argentina no se escribe desde un único centro. La Gauchita Federal se ha estructurado para dar voz y visibilidad a cada rincón del territorio nacional, permitiendo a municipios y provincias catalogar sus efemérides, instituciones culturales y reconocimientos locales bajo un mismo espacio integrado.
          </p>
        </section>

        <section className="bg-warm-white border border-stone-beige rounded-lg p-6 sm:p-8 flex flex-col gap-3.5 hover:border-muted-amber transition-colors duration-200">
          <h2 className="text-lg font-serif font-bold text-charcoal border-b border-stone-beige/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-earth-red rounded-full" />
            Nuestra misión
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            Nuestra misión es consolidar un portal cultural, patrimonial, educativo y comunitario administrable que funcione como un banco de información histórica. Buscamos democratizar el acceso al conocimiento de nuestras tradiciones y asegurar que el legado cultural de cada argentino siga latiendo para las futuras generaciones.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
