import Link from 'next/link';
import { getActiveRecognitionsList } from '../../lib/public-content/public-content';
import PublicPageShell from '../../components/public/PublicPageShell';
import PublicSectionHeader from '../../components/public/PublicSectionHeader';
import type { Metadata } from 'next';
import RecognitionCard from '../../components/cards/RecognitionCard';

export const metadata: Metadata = {
  title: "Reconocimientos",
  description: "Premios, menciones y distinciones que fortalecen la trayectoria cultural del proyecto.",
};

export default async function ReconocimientosPage() {
  const recognitions = await getActiveRecognitionsList();

  return (
    <PublicPageShell>
      <PublicSectionHeader
        title="Reconocimientos"
        description="Premios, menciones y distinciones que fortalecen la trayectoria cultural del proyecto."
      />

        {recognitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {recognitions.map(r => (
              <RecognitionCard key={r.slug} recognition={r} />
            ))}
          </div>
        ) : (
          <div className="bg-warm-white border border-stone-beige rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm italic">
              Aún no hay reconocimientos públicos cargados.
            </p>
          </div>
        )}
    </PublicPageShell>
  );
}
