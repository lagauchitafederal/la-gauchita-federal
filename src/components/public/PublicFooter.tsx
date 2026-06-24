import Link from 'next/link';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full pt-10 pb-6 border-t border-stone-beige/85 mt-12 flex flex-col gap-8">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col gap-2 max-w-sm">
          <span className="font-serif font-black text-charcoal tracking-tight text-xl">
            La Gauchita Federal
          </span>
          <span className="text-[10px] text-earth-red font-bold tracking-widest uppercase font-mono">
            Instituto Cultural Andino
          </span>
          <p className="text-xs text-stone-600 font-serif leading-relaxed mt-1">
            Plataforma web federal de investigación, preservación y difusión de la historia, cultura, patrimonio y tradiciones argentinas.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
            Navegación
          </span>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs font-semibold text-charcoal">
            <Link href="/" className="hover:text-earth-red transition-colors duration-200">
              Inicio
            </Link>
            <Link href="/contenidos" className="hover:text-earth-red transition-colors duration-200">
              Historias y cultura
            </Link>
            <Link href="/efemerides" className="hover:text-earth-red transition-colors duration-200">
              Efemérides
            </Link>
            <Link href="/personajes" className="hover:text-earth-red transition-colors duration-200">
              Personajes
            </Link>
            <Link href="/instituciones" className="hover:text-earth-red transition-colors duration-200">
              Instituciones
            </Link>
            <Link href="/revista" className="hover:text-earth-red transition-colors duration-200">
              Revista
            </Link>
            <Link href="/archivo" className="hover:text-earth-red transition-colors duration-200">
              Archivo
            </Link>
            <Link href="/reconocimientos" className="hover:text-earth-red transition-colors duration-200">
              Reconocimientos
            </Link>
            <Link href="/acerca" className="hover:text-earth-red transition-colors duration-200 col-span-2">
              Institucional
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-6 border-t border-stone-beige/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-stone-500">
        <span>
          &copy; {currentYear} La Gauchita Federal. Todos los derechos reservados.
        </span>
        <span className="italic">
          Donde late la historia de cada argentino.
        </span>
      </div>
    </footer>
  );
}
