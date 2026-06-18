import React from 'react';

interface PublicSectionHeaderProps {
  title: string;
  description?: string;
}

export default function PublicSectionHeader({
  title,
  description
}: PublicSectionHeaderProps) {
  return (
    <div className="py-5 border-b border-stone-beige/80 flex flex-col gap-1.5">
      <h1 className="text-3xl font-serif font-black tracking-tight text-charcoal">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-stone-600 leading-relaxed font-medium italic">
          {description}
        </p>
      )}
    </div>
  );
}
