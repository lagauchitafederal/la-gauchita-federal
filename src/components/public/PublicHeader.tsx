import Link from 'next/link';
import { cookies } from 'next/headers';
import TerritorySelector from './TerritorySelector';
import { parseTerritoryCookie } from '../../lib/utils/territory';

const publicLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/contenidos', label: 'Historias y cultura' },
  { href: '/efemerides', label: 'Efemérides' },
  { href: '/personajes', label: 'Personajes' },
  { href: '/instituciones', label: 'Instituciones' },
  { href: '/reconocimientos', label: 'Reconocimientos' },
  { href: '/archivo', label: 'Archivo' },
  { href: '/acerca', label: 'Acerca' },
];

export default async function PublicHeader() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lgf_territory')?.value;
  const currentTerritory = parseTerritoryCookie(rawCookie);

  return (
    <header className="w-full flex flex-col pt-4 pb-2 border-b border-stone-beige/80">
      {/* Editorial Header Brand Name */}
      <div className="text-center py-4 flex flex-col gap-1.5">
        <Link
          href="/"
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-charcoal hover:text-earth-red transition-colors duration-300 select-none"
        >
          LA GAUCHITA FEDERAL
        </Link>
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-stone-500 font-bold italic mb-2">
          Donde late la historia de cada argentino
        </p>

        {/* Public Territory Selector */}
        <div className="mt-1">
          <TerritorySelector currentTerritory={currentTerritory} />
        </div>
      </div>

      {/* Editorial Menu Navigation */}
      <nav className="w-full py-3 border-t border-stone-beige/60 mt-3">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-semibold tracking-wide text-charcoal">
          {publicLinks.map((link) => (
            <li key={link.href} className="relative group">
              <Link
                href={link.href}
                className="block py-1 hover:text-earth-red transition-colors duration-200"
              >
                {link.label}
              </Link>
              {/* Subtle line transition under the active/hovered link */}
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-earth-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}