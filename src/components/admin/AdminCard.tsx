import React from 'react';
import Link from 'next/link';

interface AdminCardProps {
  title: string;
  description: string;
  href: string;
  badge?: string;
}

export default function AdminCard({
  title,
  description,
  href,
  badge
}: AdminCardProps) {
  return (
    <Link
      href={href}
      className="bg-white border border-stone-beige rounded-lg p-6 hover:border-muted-amber hover:shadow-md transition-all duration-300 flex flex-col gap-3 group"
    >
      <div className="flex justify-between items-start gap-4">
        <h2 className="font-serif font-bold text-charcoal text-lg group-hover:text-earth-red transition-colors duration-200">
          {title}
        </h2>
        {badge && (
          <span className="text-[9px] bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 rounded font-mono uppercase tracking-wider shrink-0">
            {badge}
          </span>
        )}
      </div>

      <p className="text-xs text-stone-600 leading-relaxed">
        {description}
      </p>

      <span className="text-[10px] font-bold text-earth-red mt-auto font-mono flex items-center gap-1 uppercase tracking-wider">
        Ingresar módulo &rarr;
      </span>
    </Link>
  );
}
