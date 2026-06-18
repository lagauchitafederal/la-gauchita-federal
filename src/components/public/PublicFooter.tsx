import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="w-full py-8 border-t border-stone-beige/80 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col items-center md:items-start gap-1">
        <span className="font-serif font-bold text-charcoal tracking-tight text-lg">
          La Gauchita Federal
        </span>
        <span className="text-xs text-earth-red font-bold tracking-wider uppercase">
          Instituto Cultural Andino
        </span>
        <p className="text-xs text-stone-500 mt-1 text-center md:text-left">
          Portal federal de historia, cultura y patrimonio argentino.
        </p>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-semibold text-stone-600">
        <Link href="/" className="hover:text-earth-red transition-colors duration-200">
          Inicio
        </Link>
        <Link href="/contenidos" className="hover:text-earth-red transition-colors duration-200">
          Contenidos
        </Link>
        <Link href="/instituciones" className="hover:text-earth-red transition-colors duration-200">
          Instituciones
        </Link>
        <Link href="/reconocimientos" className="hover:text-earth-red transition-colors duration-200">
          Reconocimientos
        </Link>
        <Link href="/archivo" className="hover:text-earth-red transition-colors duration-200">
          Archivo
        </Link>
        <Link href="/acerca" className="hover:text-earth-red transition-colors duration-200">
          Acerca
        </Link>
      </nav>
    </footer>
  );
}
