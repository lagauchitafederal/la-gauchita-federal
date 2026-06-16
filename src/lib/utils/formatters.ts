/**
 * Formatter utilities for displaying database values in user-friendly Spanish labels.
 */

export function formatInstitutionType(type: string | null | undefined): string {
  if (!type) return '';

  const normalized = type.trim().toLowerCase();

  switch (normalized) {
    case 'cultural_institute':
      return 'Instituto cultural';
    case 'municipality':
      return 'Municipio';
    case 'province':
      return 'Provincia';
    case 'government_agency':
      return 'Organismo gubernamental';
    case 'school':
      return 'Escuela';
    case 'library':
      return 'Biblioteca';
    case 'museum':
      return 'Museo';
    case 'association':
      return 'Asociaci\u00f3n';
    case 'pena':
      return 'Pe\u00f1a';
    case 'gastronomic_place':
      return 'Espacio gastron\u00f3mico';
    case 'cultural_center':
      return 'Centro cultural';
    case 'media':
      return 'Medio / Revista';
    case 'other':
      return 'Otro';
    default: {
      const cleaned = normalized.replace(/_/g, ' ');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
}
