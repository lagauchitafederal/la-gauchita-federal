import React from 'react';

interface AdminSectionHeaderProps {
  title: string;
  description: string;
  inPreparation?: boolean;
}

export default function AdminSectionHeader({
  title,
  description,
  inPreparation = true
}: AdminSectionHeaderProps) {
  return (
    <div className="pb-5 border-b border-stone-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-serif font-black tracking-tight text-charcoal">
          {title}
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {inPreparation && (
        <span className="self-start sm:self-center text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-250 font-mono tracking-wider uppercase shrink-0">
          Módulo en preparación
        </span>
      )}
    </div>
  );
}
