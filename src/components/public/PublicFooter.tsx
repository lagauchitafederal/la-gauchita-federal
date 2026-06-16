import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="w-full bg-white border border-stone-200 rounded-lg shadow-sm py-6 px-6 sm:px-8 mt-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col items-center md:items-start gap-1">
        <span className="font-extrabold text-stone-900 tracking-tight text-base">
          La Gauchita Federal
        </span>
        <span className="text-xs text-stone-500 font-medium">
          Instituto Cultural Andino
        </span>
        <p className="text-xs text-stone-400 mt-1 text-center md:text-left">
          Portal federal de historia, cultura y patrimonio argentino.
        </p>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-stone-900 transition-colors">
          Inicio
        </Link>
        <Link href="/contenidos" className="hover:text-stone-900 transition-colors">
          Contenidos
        </Link>
        <Link href="/instituciones" className="hover:text-stone-900 transition-colors">
          Instituciones
        </Link>
        <Link href="/reconocimientos" className="hover:text-stone-900 transition-colors">
          Reconocimientos
        </Link>
        <Link href="/archivo" className="hover:text-stone-900 transition-colors">
          Archivo
        </Link>
        <Link href="/acerca" className="hover:text-stone-900 transition-colors">
          Acerca
        </Link>
      </nav>
    </footer>
  );
}
