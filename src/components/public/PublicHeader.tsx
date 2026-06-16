import Link from 'next/link';

const publicLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/contenidos', label: 'Contenidos' },
  { href: '/instituciones', label: 'Instituciones' },
  { href: '/reconocimientos', label: 'Reconocimientos' },
  { href: '/archivo', label: 'Archivo' },
  { href: '/acerca', label: 'Acerca' },
];

export default function PublicHeader() {
  return (
    <header className="w-full bg-white border border-stone-200 rounded-lg shadow-sm py-5 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex justify-center lg:justify-start">
          <Link
            href="/"
            className="font-extrabold text-stone-900 tracking-tight text-lg hover:text-stone-700 transition-colors text-center"
          >
            La Gauchita Federal
          </Link>
        </div>

        <nav className="w-full lg:w-auto">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center justify-center gap-2 lg:gap-x-5 text-xs sm:text-sm font-medium text-stone-600">
            {publicLinks.map((link) => (
              <li key={link.href} className="min-w-0">
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-center hover:bg-stone-100 hover:text-stone-900 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}