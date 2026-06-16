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
    <div className="py-4 border-b border-stone-200">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
