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

export function formatAssetType(type: string | null | undefined): string {
  if (!type) return '';

  const normalized = type.trim().toLowerCase();

  switch (normalized) {
    case 'cover_image':
      return 'Imagen de portada';
    case 'content_image':
      return 'Imagen de contenido';
    case 'gallery_image':
      return 'Imagen de galer\u00eda';
    case 'historical_photo':
      return 'Fotograf\u00eda hist\u00f3rica';
    case 'pdf_document':
      return 'Documento PDF';
    case 'magazine_pdf':
      return 'Revista PDF';
    case 'book_pdf':
      return 'Libro PDF';
    case 'audio':
      return 'Audio';
    case 'teacher_resource':
      return 'Recurso docente';
    case 'institutional_document':
      return 'Documento institucional';
    case 'recognition_document':
      return 'Documento de reconocimiento';
    case 'archive_material':
      return 'Material de archivo';
    case 'other':
      return 'Otro';
    default: {
      const cleaned = normalized.replace(/_/g, ' ');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
}

export function stripHtml(htmlStr: string | null | undefined): string {
  if (!htmlStr) return '';
  return htmlStr.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

