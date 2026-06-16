import type { Metadata } from 'next';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';

export const metadata: Metadata = {
  title: "Acerca de nosotros",
  description: "Una plataforma cultural para preservar, organizar y difundir la memoria historica y el patrimonio federal argentino.",
};

export default function AcercaPage() {
  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Acerca de La Gauchita Federal"
        description="Una plataforma cultural para preservar, organizar y difundir la memoria historica y el patrimonio federal argentino."
      />

      <div className="flex flex-col gap-6">
        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">
            Origen y proposito
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            La Gauchita Federal nace como una iniciativa de digitalizacion, organizacion y puesta en valor del patrimonio cultural e historico argentino. Nuestro proposito central es conectar la historia local de cada region, provincia y municipio, integrando esfuerzos institucionales y comunitarios para salvaguardar la memoria colectiva del pais.
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">
            Instituto Cultural Andino
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            El Instituto Cultural Andino es un pilar fundamental en la investigacion y promocion de las tradiciones, el folklore y el patrimonio cultural del norte argentino. Mediante este portal, colabora de manera activa en la difusion de materiales y documentos valiosos para docentes, investigadores y estudiantes.
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">
            Revista La Gauchita
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Con una larga trayectoria en la comunicacion cultural e historica, Revista La Gauchita ha sido un medio clave para registrar testimonios, cronicas, efemerides y expresiones artisticas. Este portal representa su evolucion digital, ampliando su alcance para abrazar un caracter plenamente federal.
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">
            Eduardo Ceballos
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Como escritor, periodista y promotor cultural, Eduardo Ceballos ha dedicado su labor al rescate y resguardo de la identidad federal. Su trayectoria y sus valiosas recopilaciones historicas forman parte del nucleo de conocimiento que este portal busca poner al alcance de todos los ciudadanos.
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">
            Alcance federal
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Creemos que la historia argentina no se escribe desde un unico centro. La Gauchita Federal se ha estructurado para dar voz y visibilidad a cada rincon del territorio nacional, permitiendo a municipios y provincias catalogar sus efemerides, instituciones culturales y reconocimientos locales bajo un mismo espacio integrado.
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">
            Nuestra mision
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Nuestra mision es consolidar un portal cultural, patrimonial, educativo y comunitario administrable que funcione como un banco de informacion historica. Buscamos democratizar el acceso al conocimiento de nuestras tradiciones y asegurar que el legado cultural de cada argentino siga latiendo para las futuras generaciones.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
