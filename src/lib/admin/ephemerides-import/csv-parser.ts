export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  errors: string[];
}

/**
 * Parses a CSV string character-by-character using a state machine.
 * Supports comma and semicolon delimiters, double-quoted fields, escaped quotes, and newlines in quoted fields.
 */
export function parseCsv(csvText: string): ParsedCsv {
  const errors: string[] = [];
  const rows: string[][] = [];
  
  if (!csvText || csvText.trim() === '') {
    return { headers: [], rows: [], errors: ['El archivo est\u00e1 vac\u00edo.'] };
  }

  // 1. Delimiter auto-detection: scan first line (outside quotes) and count ',' vs ';'
  let delimiter = ',';
  let firstLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    }
    if (!inQuotes && (char === '\n' || char === '\r')) {
      break;
    }
    firstLine += char;
  }
  
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  if (semiCount > commaCount) {
    delimiter = ';';
  }

  // 2. State-machine parsing loop
  let currentRow: string[] = [];
  let currentField = '';
  inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote ("")
          currentField += '"';
          i++; // skip next char
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }
  
  // Parse residual contents
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (inQuotes) {
    errors.push('Error de formato: Se detect\u00f3 una comilla abierta sin cerrar al final del archivo.');
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], errors: ['No se encontraron filas de datos.'] };
  }

  const rawHeaders = rows[0];
  const dataRows = rows.slice(1).filter(r => r.length > 0 && r.some(f => f.trim() !== ''));

  // Normalize headers
  const headers = rawHeaders.map(h => h.trim().toLowerCase());

  return {
    headers,
    rows: dataRows,
    errors
  };
}

/**
 * Maps CSV headers to standard column names.
 */
export function mapHeaders(headers: string[]): { [key: string]: number } {
  const mapping: { [key: string]: number } = {};
  
  const titleVariants = ['titulo', 't\u00edtulo', 'title'];
  const dateVariants = ['fecha_historica', 'fecha', 'date', 'fecha hist\u00f3rica', 'fecha historica'];
  const scopeVariants = ['alcance_territorial', 'territorio', 'alcance', 'scope'];
  const summaryVariants = ['resumen', 'summary'];
  const bodyVariants = ['cuerpo', 'body', 'contenido'];
  const categoryVariants = ['categoria', 'categor\u00eda', 'category'];
  const regionVariants = ['region', 'regi\u00f3n', 'region_id'];
  const provinceVariants = ['provincia', 'province', 'province_id'];
  const municipalityVariants = ['municipio', 'locality', 'municipality', 'municipality_id', 'localidad'];
  const sourceVariants = ['fuente', 'fuente_documental', 'source', 'referencia'];
  const featuredVariants = ['destacado', 'featured', 'is_featured'];
  const obsVariants = ['observaciones', 'observacion', 'comments', 'observaci\u00f3n', 'observaci\u00f3nes'];

  headers.forEach((header, index) => {
    const cleanHeader = header.trim().toLowerCase();
    
    if (titleVariants.includes(cleanHeader)) {
      mapping['titulo'] = index;
    } else if (dateVariants.includes(cleanHeader)) {
      mapping['fecha_historica'] = index;
    } else if (scopeVariants.includes(cleanHeader)) {
      mapping['alcance_territorial'] = index;
    } else if (summaryVariants.includes(cleanHeader)) {
      mapping['resumen'] = index;
    } else if (bodyVariants.includes(cleanHeader)) {
      mapping['cuerpo'] = index;
    } else if (categoryVariants.includes(cleanHeader)) {
      mapping['categoria'] = index;
    } else if (regionVariants.includes(cleanHeader)) {
      mapping['region'] = index;
    } else if (provinceVariants.includes(cleanHeader)) {
      mapping['provincia'] = index;
    } else if (municipalityVariants.includes(cleanHeader)) {
      mapping['municipio'] = index;
    } else if (sourceVariants.includes(cleanHeader)) {
      mapping['fuente'] = index;
    } else if (featuredVariants.includes(cleanHeader)) {
      mapping['destacado'] = index;
    } else if (obsVariants.includes(cleanHeader)) {
      mapping['observaciones'] = index;
    }
  });

  return mapping;
}
