import * as XLSX from 'xlsx';
import { Category, Clue } from '../types';

export interface ParseResult {
  success: boolean;
  categories: Category[];
  error?: string;
  rowCount?: number;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into Jeopardy Categories & Clues
 */
export async function parseExcelOrCsv(file: File): Promise<ParseResult> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    // Pick first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, categories: [], error: 'El archivo no contiene ninguna hoja de cálculo.' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert sheet to JSON array of objects
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, categories: [], error: 'La hoja de cálculo está vacía.' };
    }

    // Attempt format 1: Column-based table
    // Expected keys (case-insensitive & accent-insensitive)
    const categoryMap: Map<string, Clue[]> = new Map();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      let catName = '';
      let value = 0;
      let question = '';
      let answer = '';

      for (const [key, rawVal] of Object.entries(row)) {
        const cleanKey = key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const valStr = String(rawVal).trim();
        if (!valStr) continue;

        // Category match: categoria, category, tema, rubro, materia, asignatura, modulo, seccion
        if (
          cleanKey.includes('categoria') ||
          cleanKey.includes('category') ||
          cleanKey.includes('tema') ||
          cleanKey.includes('rubro') ||
          cleanKey.includes('materia') ||
          cleanKey.includes('asignatura') ||
          cleanKey.includes('seccion')
        ) {
          catName = valStr;
        }
        // Points match: punto, puntos, valor, point, points, value, pts, score, nivel, dificultad
        else if (
          cleanKey.includes('punto') ||
          cleanKey.includes('valor') ||
          cleanKey.includes('point') ||
          cleanKey.includes('value') ||
          cleanKey.includes('score') ||
          cleanKey.includes('pts') ||
          cleanKey.includes('dificultad')
        ) {
          const num = parseInt(valStr.replace(/[^\d]/g, ''), 10);
          if (!isNaN(num) && num > 0) value = num;
        }
        // Question match: pista, pregunta, clue, question, enunciado, consigna, interrogante
        else if (
          cleanKey.includes('pista') ||
          cleanKey.includes('pregunta') ||
          cleanKey.includes('clue') ||
          cleanKey.includes('question') ||
          cleanKey.includes('enunciado') ||
          cleanKey.includes('consigna')
        ) {
          question = valStr;
        }
        // Answer match: respuesta, solucion, answer, solution, correcta, resultado
        else if (
          cleanKey.includes('respuesta') ||
          cleanKey.includes('solucion') ||
          cleanKey.includes('answer') ||
          cleanKey.includes('solution') ||
          cleanKey.includes('correcta') ||
          cleanKey.includes('resultado')
        ) {
          answer = valStr;
        }
      }

      // If category wasn't explicit, default to "General"
      if (!catName && (question && answer)) {
        catName = 'General';
      }

      if (catName && question && answer) {
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, []);
        }
        const clues = categoryMap.get(catName)!;
        // Default points 100, 200, 300, 400, 500 if not specified
        const finalValue = value > 0 ? value : (clues.length + 1) * 100;

        clues.push({
          id: `clue-${catName}-${finalValue}-${clues.length + 1}`.replace(/\s+/g, '-').toLowerCase(),
          value: finalValue,
          question,
          answer,
          isAnswered: false,
          answeredByTeamId: null,
        });
      }
    }

    // Support any spreadsheet with 1 or more categories (up to 6)
    if (categoryMap.size >= 1) {
      const categories: Category[] = [];
      let catIdx = 1;

      for (const [name, clues] of categoryMap.entries()) {
        // Sort clues by value ascending
        clues.sort((a, b) => a.value - b.value);

        // Limit to 5 clues per category (standard Jeopardy)
        const normalizedClues = clues.slice(0, 5);

        // Ensure values are standard 100-500 if all values were identical or unset
        normalizedClues.forEach((clue, idx) => {
          if (clue.value === 0 || normalizedClues.filter((c) => c.value === clue.value).length > 1) {
            clue.value = (idx + 1) * 100;
          }
        });

        categories.push({
          id: `cat-${catIdx++}`,
          name,
          clues: normalizedClues,
        });

        if (categories.length >= 6) break; // Max 6 categories for standard board
      }

      return {
        success: true,
        categories,
        rowCount: rawRows.length,
      };
    }

    return {
      success: false,
      categories: [],
      error: 'No se encontraron las columnas requeridas (Categoría, Puntos, Pista, Respuesta). Puedes descargar la plantilla oficial abajo.',
    };
  } catch (err: any) {
    return {
      success: false,
      categories: [],
      error: `Error al procesar el archivo: ${err.message || 'Formato no soportado'}`,
    };
  }
}

/**
 * Downloads a sample Excel file (.xlsx) with pre-filled Jeopardy questions
 */
export function downloadSampleExcel() {
  const sampleData = [
    { Categoría: 'Ciencia y Universo', Puntos: 100, Pista: 'Planeta conocido como el Planeta Rojo.', Respuesta: 'Marte' },
    { Categoría: 'Ciencia y Universo', Puntos: 200, Pista: 'Gas más abundante en la atmósfera terrestre.', Respuesta: 'Nitrógeno' },
    { Categoría: 'Ciencia y Universo', Puntos: 300, Pista: 'Partícula subatómica con carga eléctrica negativa.', Respuesta: 'Electrón' },
    { Categoría: 'Ciencia y Universo', Puntos: 400, Pista: 'Famosa ecuación de Albert Einstein sobre equivalencia masa-energía.', Respuesta: 'E = mc²' },
    { Categoría: 'Ciencia y Universo', Puntos: 500, Pista: 'Límite alrededor de un agujero negro del cual nada puede escapar.', Respuesta: 'Horizonte de Sucesos' },

    { Categoría: 'Historia Universal', Puntos: 100, Pista: 'Año en que Cristóbal Colón llegó a América.', Respuesta: '1492' },
    { Categoría: 'Historia Universal', Puntos: 200, Pista: 'Imperio que construyó el Coliseo y la Vía Apia.', Respuesta: 'Imperio Romano' },
    { Categoría: 'Historia Universal', Puntos: 300, Pista: 'Reina de Francia guillotinada durante la Revolución en 1793.', Respuesta: 'María Antonieta' },
    { Categoría: 'Historia Universal', Puntos: 400, Pista: 'Pacto firmado en 1919 que puso fin oficial a la Primera Guerra Mundial.', Respuesta: 'Tratado de Versalles' },
    { Categoría: 'Historia Universal', Puntos: 500, Pista: 'Primer emperador de la China unificada y creador de los guerreros de terracota.', Respuesta: 'Qin Shi Huang' },

    { Categoría: 'Geografía del Mundo', Puntos: 100, Pista: 'El océano más grande y profundo del planeta Tierra.', Respuesta: 'Océano Pacífico' },
    { Categoría: 'Geografía del Mundo', Puntos: 200, Pista: 'Desierto cálido más grande del mundo ubicado en el norte de África.', Respuesta: 'Desierto del Sáhara' },
    { Categoría: 'Geografía del Mundo', Puntos: 300, Pista: 'Capital y ciudad más poblada de la República Argentina.', Respuesta: 'Buenos Aires' },
    { Categoría: 'Geografía del Mundo', Puntos: 400, Pista: 'País con mayor cantidad de islas naturales en su territorio (más de 260,000).', Respuesta: 'Suecia' },
    { Categoría: 'Geografía del Mundo', Puntos: 500, Pista: 'Canal artificial centroamericano que conecta el océano Atlántico con el Pacífico.', Respuesta: 'Canal de Panamá' },

    { Categoría: 'Programación & Tech', Puntos: 100, Pista: 'Lenguaje fundamental para estructurar el contenido de páginas web.', Respuesta: 'HTML' },
    { Categoría: 'Programación & Tech', Puntos: 200, Pista: 'Comando Git para enviar commits locales a un repositorio remoto.', Respuesta: 'git push' },
    { Categoría: 'Programación & Tech', Puntos: 300, Pista: 'Estructura de datos First-In, First-Out (FIFO).', Respuesta: 'Cola (Queue)' },
    { Categoría: 'Programación & Tech', Puntos: 400, Pista: 'Creador del sistema operativo Linux y del software Git.', Respuesta: 'Linus Torvalds' },
    { Categoría: 'Programación & Tech', Puntos: 500, Pista: 'Protocolo de red para transmisión cifrada de hipertexto en el puerto 443.', Respuesta: 'HTTPS (TLS)' },

    { Categoría: 'Arte y Cultura', Puntos: 100, Pista: 'Pintor italiano creador de La Última Cena y la Mona Lisa.', Respuesta: 'Leonardo da Vinci' },
    { Categoría: 'Arte y Cultura', Puntos: 200, Pista: 'Novela de Miguel de Cervantes sobre el caballero de la triste figura.', Respuesta: 'Don Quijote de la Mancha' },
    { Categoría: 'Arte y Cultura', Puntos: 300, Pista: 'Teatro de ópera de Milán, uno de los más famosos del mundo.', Respuesta: 'La Scala' },
    { Categoría: 'Arte y Cultura', Puntos: 400, Pista: 'Escultura en mármol blanco de Miguel Ángel que representa a la Virgen con Jesús fallecido.', Respuesta: 'La Piedad' },
    { Categoría: 'Arte y Cultura', Puntos: 500, Pista: 'Movimiento artístico y literario de vanguardia fundado por André Breton en París.', Respuesta: 'Surrealismo' },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jeopardy');
  XLSX.writeFile(wb, 'plantilla_jeopardy.xlsx');
}

/**
 * Downloads a sample CSV file
 */
export function downloadSampleCsv() {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel
    'Categoría,Puntos,Pista,Respuesta\r\n' +
    'Ciencia y Universo,100,Planeta conocido como el Planeta Rojo,Marte\r\n' +
    'Ciencia y Universo,200,Gas más abundante en la atmósfera terrestre,Nitrógeno\r\n' +
    'Ciencia y Universo,300,Partícula subatómica con carga eléctrica negativa,Electrón\r\n' +
    'Ciencia y Universo,400,Famosa ecuación de Albert Einstein,E = mc²\r\n' +
    'Ciencia y Universo,500,Límite de no retorno en un agujero negro,Horizonte de sucesos\r\n' +
    'Historia Universal,100,Año en que Cristóbal Colón llegó a América,1492\r\n' +
    'Historia Universal,200,Civilización constructora del Coliseo,Roma\r\n' +
    'Historia Universal,300,Reina de Francia guillotinada en 1793,María Antonieta\r\n' +
    'Historia Universal,400,Tratado de 1919 tras la Primera Guerra Mundial,Tratado de Versalles\r\n' +
    'Historia Universal,500,Primer emperador de China unificada,Qin Shi Huang\r\n' +
    'Geografía del Mundo,100,El océano más grande del planeta,Pacífico\r\n' +
    'Geografía del Mundo,200,Desierto cálido más grande del mundo en África,Sáhara\r\n' +
    'Geografía del Mundo,300,Capital de la República Argentina,Buenos Aires\r\n' +
    'Geografía del Mundo,400,País con más islas naturales del mundo,Suecia\r\n' +
    'Geografía del Mundo,500,Canal que une el Atlántico con el Pacífico,Canal de Panamá\r\n' +
    'Programación & Tech,100,Lenguaje fundamental de estructura web,HTML\r\n' +
    'Programación & Tech,200,Comando Git para subir cambios al servidor,git push\r\n' +
    'Programación & Tech,300,Estructura FIFO (First In First Out),Cola (Queue)\r\n' +
    'Programación & Tech,400,Creador de Linux y de Git,Linus Torvalds\r\n' +
    'Programación & Tech,500,Protocolo web seguro en el puerto 443,HTTPS\r\n' +
    'Arte y Cultura,100,Pintor de la Mona Lisa,Leonardo da Vinci\r\n' +
    'Arte y Cultura,200,Autor de Don Quijote de la Mancha,Miguel de Cervantes\r\n' +
    'Arte y Cultura,300,Famoso teatro de ópera de Milán,La Scala\r\n' +
    'Arte y Cultura,400,Escultura célebre de Miguel Ángel en San Pedro,La Piedad\r\n' +
    'Arte y Cultura,500,Movimiento de Salvador Dalí y André Breton,Surrealismo\r\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'plantilla_jeopardy.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
