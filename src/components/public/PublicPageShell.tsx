import React from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

interface PublicPageShellProps {
  children: React.ReactNode;
  maxWidth?: 'max-w-3xl' | 'max-w-4xl';
}

export default function PublicPageShell({
  children,
  maxWidth = 'max-w-3xl'
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-warm-white text-charcoal font-sans flex flex-col items-center py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className={`w-full ${maxWidth} flex flex-col gap-8`}>
        <PublicHeader />
        <main className="flex flex-col gap-8">
          {children}
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
