import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="w-full bg-white border border-stone-200 rounded-lg shadow-sm py-4 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-extrabold text-stone-900 tracking-tight text-lg hover:text-stone-700 transition-colors">
          La Gauchita Federal
        </Link>
      </div>
      <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
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
    </header>
  );
}
