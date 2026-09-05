import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { GameState, Category, Team, GameSettings } from '../types';
import {
  parseExcelOrCsv,
  downloadSampleExcel,
  downloadSampleCsv,
} from '../utils/excelParser';
import {
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
  Users,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ZoomIn,
  X,
  LogOut,
} from 'lucide-react';

interface InitialSetupScreenProps {
  gameState: GameState;
  isConnected: boolean;
  onStartGame: (config: {
    title: string;
    categories: Category[];
    teams: Team[];
    settings: GameSettings;
  }) => void;
  onRemoveMember: (teamId: string, memberId: string) => void;
  onClearMembers: () => void;
  onLogout?: () => void;
}

const DEFAULT_TEAM_PALETTE = [
  { name: 'Equipo Rojo', color: '#ef4444' },
  { name: 'Equipo Azul', color: '#3b82f6' },
  { name: 'Equipo Verde', color: '#10b981' },
  { name: 'Equipo Amarillo', color: '#f59e0b' },
  { name: 'Equipo Morado', color: '#8b5cf6' },
];

const PRESETS = [
  {
    name: 'Matemáticas & Lógica',
    title: 'Jeopardy de Matemáticas y Lógica',
    categories: [
      {
        id: 'math-alg',
        name: 'Álgebra & Números',
        clues: [
          { id: 'm-1', value: 100, question: 'Resultado de resolver para x en la ecuación: 2x + 8 = 20.', answer: 'x = 6', isAnswered: false, answeredByTeamId: null },
          { id: 'm-2', value: 200, question: 'El único número primo que también es un número par.', answer: '2', isAnswered: false, answeredByTeamId: null },
          { id: 'm-3', value: 300, question: 'Fórmula cuadrática para hallar las raíces de ax² + bx + c = 0.', answer: 'x = (-b ± √(b² - 4ac)) / (2a)', isAnswered: false, answeredByTeamId: null },
          { id: 'm-4', value: 400, question: 'Nombre del número irracional aproximadamente igual a 2.71828.', answer: 'Número e (de Euler)', isAnswered: false, answeredByTeamId: null },
          { id: 'm-5', value: 500, question: 'Matemático francés célebre por su Último Teorema, demostrado en 1994 por Andrew Wiles.', answer: 'Pierre de Fermat', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'math-geo',
        name: 'Geometría & Trigonometría',
        clues: [
          { id: 'mg-1', value: 100, question: 'Suma de los ángulos interiores de cualquier triángulo plano.', answer: '180 grados', isAnswered: false, answeredByTeamId: null },
          { id: 'mg-2', value: 200, question: 'Teorema que establece que a² + b² = c² en triángulos rectángulos.', answer: 'Teorema de Pitágoras', isAnswered: false, answeredByTeamId: null },
          { id: 'mg-3', value: 300, question: 'Cociente trigonométrico entre el cateto opuesto y el cateto adyacente.', answer: 'Tangente', isAnswered: false, answeredByTeamId: null },
          { id: 'mg-4', value: 400, question: 'Polígono regular de doce lados y doce vértices.', answer: 'Dodecágono', isAnswered: false, answeredByTeamId: null },
          { id: 'mg-5', value: 500, question: 'Relación de Euler para poliedros convexos relacionando Caras (C), Vértices (V) y Aristas (A).', answer: 'C + V - A = 2', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'math-calc',
        name: 'Cálculo & Probabilidad',
        clues: [
          { id: 'mc-1', value: 100, question: 'Probabilidad teórica de obtener un número par al lanzar un dado estándar de 6 caras.', answer: '1/2 (o 50%)', isAnswered: false, answeredByTeamId: null },
          { id: 'mc-2', value: 200, question: 'Derivada de la función f(x) = x³ respecto a x.', answer: '3x²', isAnswered: false, answeredByTeamId: null },
          { id: 'mc-3', value: 300, question: 'Operación inversa a la derivación en el cálculo infinitesimal.', answer: 'Integración (Antiderivada)', isAnswered: false, answeredByTeamId: null },
          { id: 'mc-4', value: 400, question: 'Teorema fundamental que vincula la integración y la diferenciación.', answer: 'Teorema Fundamental del Cálculo', isAnswered: false, answeredByTeamId: null },
          { id: 'mc-5', value: 500, question: 'Distribución de probabilidad continua caracterizada por la clásica campana de Gauss.', answer: 'Distribución Normal (Gaussiana)', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'math-hist',
        name: 'Historia Matemática',
        clues: [
          { id: 'mh-1', value: 100, question: 'Civilización que introdujo el uso formal del número cero como dígito y valor nulo en la India.', answer: 'India (Brahmagupta / Aryabhata)', isAnswered: false, answeredByTeamId: null },
          { id: 'mh-2', value: 200, question: 'Matemático de la antigüedad que gritó "¡Eureka!" en la bañera en Siracusa.', answer: 'Arquímedes', isAnswered: false, answeredByTeamId: null },
          { id: 'mh-3', value: 300, question: 'Matemático renacentista que inventó el plano con coordenadas X e Y.', answer: 'René Descartes', isAnswered: false, answeredByTeamId: null },
          { id: 'mh-4', value: 400, question: 'Científicos que desarrollaron de forma independiente el cálculo infinitesimal en el siglo XVII.', answer: 'Isaac Newton y Gottfried Leibniz', isAnswered: false, answeredByTeamId: null },
          { id: 'mh-5', value: 500, question: 'Matemático alemán apodado "El Príncipe de los Matemáticos".', answer: 'Carl Friedrich Gauss', isAnswered: false, answeredByTeamId: null },
        ],
      },
    ],
  },
  {
    name: 'Tecnología & Programación',
    title: 'Jeopardy de Programación y Tecnología',
    categories: [
      {
        id: 'tech-web',
        name: 'Desarrollo Web',
        clues: [
          { id: 'tw-1', value: 100, question: 'Lenguaje fundamental utilizado para definir la estructura de un documento web.', answer: 'HTML', isAnswered: false, answeredByTeamId: null },
          { id: 'tw-2', value: 200, question: 'Mecanismo en JavaScript para ejecutar funciones tras completar una petición HTTP.', answer: 'Callbacks / Promesas', isAnswered: false, answeredByTeamId: null },
          { id: 'tw-3', value: 300, question: 'Hook principal de React para almacenar estado local reactivo en componentes funcionales.', answer: 'useState', isAnswered: false, answeredByTeamId: null },
          { id: 'tw-4', value: 400, question: 'Protocolo de capa de aplicación sobre TCP que añade cifrado TLS al puerto 443.', answer: 'HTTPS', isAnswered: false, answeredByTeamId: null },
          { id: 'tw-5', value: 500, question: 'Algoritmo de renderizado en navegadores que calcula geometrías antes de pintar pixeles.', answer: 'Layout (Reflow)', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'tech-cs',
        name: 'Ciencias de la Computación',
        clues: [
          { id: 'tc-1', value: 100, question: 'Estructura de datos lineal regida por el principio LIFO (Last In First Out).', answer: 'Pila (Stack)', isAnswered: false, answeredByTeamId: null },
          { id: 'tc-2', value: 200, question: 'Complejidad temporal en el peor caso del algoritmo de búsqueda binaria.', answer: 'O(log n)', isAnswered: false, answeredByTeamId: null },
          { id: 'tc-3', value: 300, question: 'Padre de la informática teórica que propuso la máquina universal abstracta.', answer: 'Alan Turing', isAnswered: false, answeredByTeamId: null },
          { id: 'tc-4', value: 400, question: 'Condición en la que dos o más hilos se bloquean mutuamente esperando recursos.', answer: 'Interbloqueo (Deadlock)', isAnswered: false, answeredByTeamId: null },
          { id: 'tc-5', value: 500, question: 'Clase de problemas en teoría de la computación resolubles en tiempo polinómico no determinista.', answer: 'NP (Nondeterministic Polynomial)', isAnswered: false, answeredByTeamId: null },
        ],
      },
    ],
  },
];

export const InitialSetupScreen: React.FC<InitialSetupScreenProps> = ({
  gameState,
  isConnected,
  onStartGame,
  onRemoveMember,
  onClearMembers,
  onLogout,
}) => {
  // Config state
  const [gameTitle, setGameTitle] = useState(gameState.title || 'Jeopardy de Matemáticas');
  const [numTeams, setNumTeams] = useState<number>(() => {
    return Math.min(Math.max(gameState.teams.length, 1), 5);
  });
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState<number>(() => {
    return gameState.settings.maxPlayersPerTeam || 5;
  });

  // Teams config (up to 5)
  const [teamsConfig, setTeamsConfig] = useState<Team[]>(() => {
    const existing = gameState.teams || [];
    const result: Team[] = [];
    for (let i = 0; i < 5; i++) {
      const def = DEFAULT_TEAM_PALETTE[i];
      const found = existing[i];
      result.push({
        id: found ? found.id : `team-${i + 1}`,
        name: found ? found.name : def.name,
        color: found ? found.color : def.color,
        score: found ? found.score : 0,
        members: found ? found.members : [],
      });
    }
    return result;
  });

  // Active categories
  const [categories, setCategories] = useState<Category[]>(gameState.categories || []);

  // Excel parsing state
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // QR URLs dictionary
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);
  const [zoomedTeamId, setZoomedTeamId] = useState<string | null>(null);

  // Active teams subset
  const activeTeams = teamsConfig.slice(0, numTeams);

  // Close zoomed QR modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedTeamId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync teams with updated member counts from server
  useEffect(() => {
    setTeamsConfig((prev) =>
      prev.map((t) => {
        const live = gameState.teams.find((gt) => gt.id === t.id);
        return live ? { ...t, members: live.members, score: live.score } : t;
      })
    );
  }, [gameState.teams]);

  // Generate QR codes dynamically whenever active teams change (high res 480px for crisp zoom)
  useEffect(() => {
    const baseOrigin = window.location.origin;
    activeTeams.forEach((team) => {
      const joinUrl = `${baseOrigin}/?role=player&team=${team.id}`;
      QRCode.toDataURL(joinUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: '#000533',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrCodeUrls((prev) => ({ ...prev, [team.id]: url }));
        })
        .catch((err) => console.error('Error generating QR:', err));
    });
  }, [numTeams, teamsConfig]);

  // Handle Excel/CSV file upload
  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setUploadFeedback(null);
    try {
      const result = await parseExcelOrCsv(file);
      if (result.success && result.categories.length > 0) {
        setCategories(result.categories);
        const totalClues = result.categories.reduce((acc, c) => acc + c.clues.length, 0);
        setUploadFeedback({
          type: 'success',
          message: `¡Archivo cargado con éxito! Se importaron ${result.categories.length} categorías y ${totalClues} pistas.`,
          details: `Hoja procesada con ${result.rowCount || 0} filas. Las casillas están listas para el tablero.`,
        });
      } else {
        setUploadFeedback({
          type: 'error',
          message: result.error || 'No se pudieron extraer preguntas válidas del archivo.',
          details: 'Verifica que el archivo contenga las columnas requeridas o descarga la plantilla oficial abajo.',
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: 'Error de lectura del archivo.',
        details: err?.message || 'Asegúrate de que sea un archivo .xlsx, .xls o .csv válido.',
      });
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setGameTitle(preset.title);
    setCategories(preset.categories);
    setUploadFeedback({
      type: 'success',
      message: `Temario "${preset.name}" aplicado correctamente con ${preset.categories.length} categorías.`,
    });
  };

  const handleCopyLink = (teamId: string) => {
    const url = `${window.location.origin}/?role=player&team=${teamId}`;
    navigator.clipboard.writeText(url);
    setCopiedTeamId(teamId);
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleLaunchGame = () => {
    if (!gameTitle.trim()) {
      setLaunchError('Por favor, ingresa un título para el concurso antes de iniciar.');
      return;
    }
    if (categories.length === 0) {
      setLaunchError('Debes cargar al menos una categoría de preguntas (sube un archivo Excel o selecciona un temario).');
      return;
    }

    setLaunchError(null);
    onStartGame({
      title: gameTitle.trim(),
      categories,
      teams: activeTeams,
      settings: {
        ...gameState.settings,
        maxPlayersPerTeam,
      },
    });
  };

  const totalConnectedPlayers = activeTeams.reduce((sum, t) => sum + t.members.length, 0);

  return (
    <div className="min-h-screen bg-[#000533] text-white flex flex-col justify-between select-none bg-gradient-to-b from-[#000533] via-[#000845] to-[#000b5e] p-3 sm:p-6">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Top Branding & Connection Indicator */}
        <header className="bg-[#060CE9] border-4 border-[#D4AF37] rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(6,12,233,0.6)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-[#000222] border-4 border-[#D4AF37] flex items-center justify-center text-[#FFCC00] font-black text-3xl shadow-[0_0_20px_rgba(255,204,0,0.5)] italic shrink-0">
              J!
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-[#000222] px-3 py-1 rounded-full border border-[#D4AF37]/50 text-[11px] font-black uppercase tracking-wider text-[#FFCC00] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paso Obligatorio • Pre-Lanzamiento</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
                Configuración Inicial del Concurso
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 font-semibold">
                Personaliza el título, carga las preguntas y conecta los pulsadores móviles antes de proyectar el tablero.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#000222] border-2 border-[#D4AF37] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full border border-white ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                {isConnected ? 'Servidor Conectado' : 'Reconectando...'}
              </span>
            </div>

            {onLogout && (
              <button
                type="button"
                id="btn-setup-logout"
                onClick={onLogout}
                title="Cerrar sesión del anfitrión y desconectar todos los dispositivos"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider border-2 border-rose-300 shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Grid: Settings & Live QR Lobby */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Adjustments (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Box 1: Title & File Upload */}
            <div className="bg-[#000222] border-4 border-[#D4AF37] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex items-center gap-2 border-b-2 border-blue-900 pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#060CE9] border border-[#FFCC00] flex items-center justify-center text-[#FFCC00] font-black">
                  1
                </div>
                <h2 className="text-lg font-black text-[#FFCC00] uppercase tracking-wide">
                  Identidad & Preguntas del Concurso
                </h2>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-blue-200 mb-2">
                  Título del Concurso / Evento
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-game-title"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    placeholder="Ej. Jeopardy de Matemáticas, Jeopardy Escolar 2026..."
                    className="w-full bg-[#000533] border-2 border-blue-500 rounded-xl px-4 py-3 text-white font-bold text-base focus:outline-none focus:border-[#FFCC00] focus:ring-2 focus:ring-[#FFCC00]/50"
                  />
                  <Edit3 className="w-4 h-4 text-blue-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Excel / CSV Uploader */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-blue-200">
                    Cargar Archivo Excel (.xlsx) o CSV
                  </label>
                  <span className="text-[11px] text-[#FFCC00] font-bold">
                    {categories.length} categorías activas
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="relative border-2 border-dashed border-blue-500/80 hover:border-[#FFCC00] rounded-2xl p-5 bg-[#000533]/80 text-center transition-all cursor-pointer group"
                >
                  <input
                    type="file"
                    id="input-excel-upload"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-[#060CE9] border-2 border-[#D4AF37] flex items-center justify-center text-[#FFCC00] shadow-md group-hover:scale-110 transition-transform">
                      {isParsingFile ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {isParsingFile
                        ? 'Analizando estructura del archivo...'
                        : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'}
                    </div>
                    <p className="text-[11px] text-blue-300">
                      Soporta columnas: <strong>Categoría, Puntos (100-500), Pista, Respuesta</strong>
                    </p>
                  </div>
                </div>

                {/* Feedback message */}
                {uploadFeedback && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border-2 flex items-start gap-2.5 text-xs font-semibold ${
                      uploadFeedback.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500 text-rose-200'
                    }`}
                  >
                    {uploadFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{uploadFeedback.message}</div>
                      {uploadFeedback.details && (
                        <div className="text-[11px] opacity-90 mt-0.5">{uploadFeedback.details}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sample templates & Presets toolbar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-900/60">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-download-sample-excel"
                      onClick={downloadSampleExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#060CE9]/50 hover:bg-[#060CE9] text-xs font-bold text-white border border-blue-400/50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#FFCC00]" />
                      <span>Descargar Plantilla Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      id="btn-download-sample-csv"
                      onClick={downloadSampleCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#060CE9]/30 hover:bg-[#060CE9] text-xs font-bold text-blue-200 hover:text-white border border-blue-400/40 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-300" />
                      <span>CSV</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-blue-300 font-bold">Cargar Temario:</span>
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-[#000533] hover:bg-[#060CE9] border border-[#FFCC00]/40 text-[11px] font-bold text-[#FFCC00] transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Teams & Participant Capacity */}
            <div className="bg-[#000222] border-4 border-[#D4AF37] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex items-center gap-2 border-b-2 border-blue-900 pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#060CE9] border border-[#FFCC00] flex items-center justify-center text-[#FFCC00] font-black">
                  2
                </div>
                <h2 className="text-lg font-black text-[#FFCC00] uppercase tracking-wide">
                  Equipos & Límite de Participantes
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Number of Teams Selector (Max 5) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blue-200 mb-2">
                    Número de Equipos (Hasta 5)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const isSelected = numTeams === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          id={`btn-num-teams-${n}`}
                          onClick={() => setNumTeams(n)}
                          className={`py-3 px-1 sm:px-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition-all ${
                            isSelected
                              ? 'bg-[#060CE9] border-[#FFCC00] text-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.4)] scale-102 ring-2 ring-[#FFCC00]/50'
                              : 'bg-[#000533] border-blue-900 text-blue-300 hover:border-blue-700'
                          }`}
                        >
                          {n} {n === 1 ? 'Eq.' : 'Eqs.'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Maximum Players per Team */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blue-200 mb-2">
                    Límite de Integrantes por Equipo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="input-max-players"
                      min={1}
                      max={50}
                      value={maxPlayersPerTeam}
                      onChange={(e) => setMaxPlayersPerTeam(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 bg-[#000533] border-2 border-blue-500 rounded-xl px-3 py-2.5 text-center font-black text-lg text-[#FFCC00] focus:outline-none focus:border-[#FFCC00]"
                    />
                    <div className="text-[11px] text-blue-200 leading-snug">
                      <span>integrantes máx. por equipo.</span>
                      <span className="block text-[10px] text-blue-300 opacity-80">
                        El registro móvil se bloqueará automáticamente al llenarse.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Name and Color Customization */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-black uppercase tracking-wider text-blue-300">
                  Nombres y Colores de los Equipos Activos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                  {activeTeams.map((team, idx) => (
                    <div
                      key={team.id}
                      className="bg-[#000533] border-2 border-blue-900 rounded-2xl p-3 space-y-2 relative shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-blue-300">
                          Equipo {idx + 1}
                        </span>
                        <input
                          type="color"
                          value={team.color}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setTeamsConfig((prev) =>
                              prev.map((t) => (t.id === team.id ? { ...t, color: newColor } : t))
                            );
                          }}
                          className="w-6 h-6 rounded-full cursor-pointer border border-white/60 bg-transparent p-0"
                          title="Cambiar color del equipo"
                        />
                      </div>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setTeamsConfig((prev) =>
                            prev.map((t) => (t.id === team.id ? { ...t, name: newName } : t))
                          );
                        }}
                        className="w-full bg-[#000222] border border-blue-600 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#FFCC00]"
                        placeholder="Nombre de equipo"
                        maxLength={20}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic QR Lobby & Player Connection (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-[#000222] border-4 border-[#D4AF37] rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between border-b-2 border-blue-900 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#060CE9] border border-[#FFCC00] flex items-center justify-center text-[#FFCC00] font-black text-xs sm:text-sm">
                      3
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-[#FFCC00] uppercase tracking-wide leading-tight">
                        Códigos QR Dinámicos
                      </h2>
                      <p className="text-[10px] sm:text-[11px] text-blue-200 leading-tight">
                        Escanear con smartphone • Haz clic en el QR para agrandarlo
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-[#060CE9] border border-blue-400 text-[10px] sm:text-xs font-black text-[#FFCC00]">
                    {totalConnectedPlayers} Conectados
                  </span>
                </div>

                {/* Team QR Cards Container - 100% visible, fully responsive, zero scrollbars */}
                <div
                  className={`mt-2.5 flex flex-col ${
                    numTeams >= 4 ? 'gap-1.5' : numTeams === 3 ? 'gap-2' : 'gap-2.5'
                  }`}
                >
                  {activeTeams.map((team) => {
                    const isFull = team.members.length >= maxPlayersPerTeam;
                    const qrUrl = qrCodeUrls[team.id];

                    return (
                      <div
                        key={team.id}
                        className={`bg-[#000533] border-2 shadow-md flex items-center transition-all hover:border-opacity-100 ${
                          numTeams >= 4
                            ? 'rounded-xl p-1.5 sm:p-2 gap-2'
                            : numTeams === 3
                            ? 'rounded-xl p-2 sm:p-2.5 gap-2.5'
                            : 'rounded-2xl p-2.5 sm:p-3 gap-3'
                        }`}
                        style={{ borderColor: team.color }}
                      >
                        {/* QR Box - Clickable to expand / zoom */}
                        <button
                          type="button"
                          onClick={() => setZoomedTeamId(team.id)}
                          title="Haz clic para agrandar el código QR"
                          className="relative p-1 bg-white rounded-lg sm:rounded-xl shadow-sm shrink-0 flex items-center justify-center cursor-pointer group/qr transition-all hover:scale-105 hover:ring-2 hover:ring-[#FFCC00] focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                        >
                          {qrUrl ? (
                            <>
                              <img
                                src={qrUrl}
                                alt={`QR ${team.name}`}
                                className={`${
                                  numTeams >= 4
                                    ? 'w-13 h-13 sm:w-15 sm:h-15'
                                    : numTeams === 3
                                    ? 'w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20'
                                    : 'w-20 h-20 sm:w-22 sm:h-22'
                                } object-contain aspect-square transition-transform group-hover/qr:scale-102`}
                              />
                              {/* Hover zoom indicator overlay */}
                              <div className="absolute inset-0 bg-[#060CE9]/40 opacity-0 group-hover/qr:opacity-100 rounded-lg sm:rounded-xl transition-opacity flex items-center justify-center pointer-events-none">
                                <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            </>
                          ) : (
                            <div
                              className={`${
                                numTeams >= 4
                                  ? 'w-13 h-13 sm:w-15 sm:h-15'
                                  : numTeams === 3
                                  ? 'w-16 h-16 sm:w-18 sm:h-18'
                                  : 'w-20 h-20 sm:w-22 sm:h-22'
                              } flex items-center justify-center text-[9px] text-blue-950 font-bold text-center leading-none`}
                            >
                              Cargando...
                            </div>
                          )}
                        </button>

                        {/* Team Info & Member list */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between w-full text-left space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 border border-white/80 shadow-sm"
                                style={{ backgroundColor: team.color }}
                              />
                              <h3 className="font-black text-xs sm:text-sm text-white truncate uppercase tracking-wide">
                                {team.name}
                              </h3>
                            </div>

                            <span
                              className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${
                                isFull
                                  ? 'bg-rose-950 text-rose-300 border-rose-600'
                                  : 'bg-blue-950 text-emerald-400 border-blue-800'
                              }`}
                            >
                              {team.members.length} / {maxPlayersPerTeam}
                            </span>
                          </div>

                          {/* Member list preview */}
                          <div
                            className={`bg-[#000222] rounded-lg border border-blue-900/80 flex items-center ${
                              numTeams >= 4
                                ? 'px-2 py-0.5 min-h-[22px]'
                                : numTeams === 3
                                ? 'px-2 py-1 min-h-[26px]'
                                : 'p-1.5 min-h-[30px]'
                            }`}
                          >
                            {team.members.length === 0 ? (
                              <p className="text-[10px] text-blue-400/90 italic leading-none">
                                Esperando participantes...
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-h-[32px] overflow-y-auto w-full">
                                {team.members.map((m) => (
                                  <span
                                    key={m.id}
                                    className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] bg-[#060CE9]/60 border border-blue-400/50 text-white px-1.5 py-0.2 rounded font-bold"
                                  >
                                    <span className="truncate max-w-[70px] sm:max-w-[90px]">{m.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => onRemoveMember(team.id, m.id)}
                                      title="Remover integrante"
                                      className="text-blue-300 hover:text-rose-400 leading-none font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action tools */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(team.id)}
                              className="flex-1 flex items-center justify-center gap-1 py-0.5 sm:py-1 px-2 rounded-lg bg-[#000222] hover:bg-[#060CE9] border border-blue-800 text-[9px] sm:text-[10px] font-bold text-blue-200 hover:text-white transition-colors"
                            >
                              {copiedTeamId === team.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 text-blue-400" />
                                  <span>Copiar Enlace</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`/?role=player&team=${team.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-[#000222] hover:bg-[#060CE9] border border-blue-800 text-blue-200 hover:text-[#FFCC00] transition-colors"
                              title="Abrir pulsador en pestaña de prueba"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clear members helper */}
              {totalConnectedPlayers > 0 && (
                <div className="text-right pt-2 mt-2 border-t border-blue-900/60">
                  {showClearConfirm ? (
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <span className="text-rose-300 font-bold">¿Limpiar la lista de conectados?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onClearMembers();
                          setShowClearConfirm(false);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[11px]"
                      >
                        Sí, Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 underline font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpiar participantes conectados</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Launch Error Banner if present */}
        {launchError && (
          <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 flex items-center justify-between gap-3 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm font-bold">{launchError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLaunchError(null)}
              className="text-xs font-black uppercase text-rose-300 hover:text-white px-2 py-1 rounded bg-rose-900/60"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Bottom Launch Banner */}
        <div className="bg-[#060CE9] border-4 border-[#D4AF37] rounded-3xl p-5 shadow-[0_0_60px_rgba(6,12,233,0.7)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-[#FFCC00]">
              Listo para Comenzar la Emisión
            </div>
            <div className="text-sm font-bold text-white">
              {categories.length} Categorías listas • {numTeams} Equipos configurados • {totalConnectedPlayers} Participantes conectados
            </div>
            <p className="text-xs text-blue-200">
              Al iniciar, el tablero interactivo de Jeopardy se revelará y los pulsadores móviles quedarán sincronizados.
            </p>
          </div>

          <button
            type="button"
            id="btn-launch-game-board"
            onClick={handleLaunchGame}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] font-black text-base sm:text-lg uppercase tracking-wider transition-all transform hover:scale-105 active:scale-98 shadow-[0_0_30px_rgba(255,204,0,0.8)] border-4 border-white shrink-0 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>¡Iniciar Concurso y Abrir Tablero!</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Enlarged QR Code Lightbox Modal */}
      {zoomedTeamId && (() => {
        const zoomedTeam = activeTeams.find((t) => t.id === zoomedTeamId);
        if (!zoomedTeam) return null;
        const qrUrl = qrCodeUrls[zoomedTeam.id];
        const joinUrl = `${window.location.origin}/?role=player&team=${zoomedTeam.id}`;
        const isFull = zoomedTeam.members.length >= maxPlayersPerTeam;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setZoomedTeamId(null)}
          >
            <div
              className="relative w-full max-w-lg bg-[#000222] border-4 border-[#D4AF37] rounded-3xl p-5 sm:p-6 shadow-[0_0_80px_rgba(212,175,55,0.4)] flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setZoomedTeamId(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#000533] border border-blue-500/60 text-blue-300 hover:text-white hover:bg-rose-600 hover:border-rose-400 transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Team Selector Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full pr-8">
                {activeTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setZoomedTeamId(team.id)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                      team.id === zoomedTeamId
                        ? 'bg-[#FFCC00] text-[#000533] border-white shadow-md scale-105'
                        : 'bg-[#000533] text-blue-200 border-blue-800 hover:border-blue-500'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/80 shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span>{team.name}</span>
                  </button>
                ))}
              </div>

              {/* Header Title with Team Color */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#000533] border border-blue-800 shadow-inner">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: zoomedTeam.color }}
                  />
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                    {zoomedTeam.name}
                  </h3>
                </div>
                <p className="text-xs text-blue-200">
                  Escanea el código con la cámara de tu smartphone para ingresar
                </p>
              </div>

              {/* Enlarged QR Code Canvas */}
              <div className="p-3.5 sm:p-4 bg-white rounded-2xl shadow-[0_0_50px_rgba(255,204,0,0.35)] border-4 border-white flex items-center justify-center">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`Código QR ${zoomedTeam.name}`}
                    className="w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 object-contain aspect-square"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-blue-950 font-black text-sm">
                    Generando código QR...
                  </div>
                )}
              </div>

              {/* Status and Direct Links */}
              <div className="w-full space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-blue-300 font-semibold">Cupo del equipo:</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-full border ${
                      isFull
                        ? 'bg-rose-950 text-rose-300 border-rose-600'
                        : 'bg-blue-950 text-emerald-400 border-blue-800'
                    }`}
                  >
                    {zoomedTeam.members.length} / {maxPlayersPerTeam} participantes conectados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(zoomedTeam.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#060CE9] hover:bg-blue-700 border-2 border-[#FFCC00] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    {copiedTeamId === zoomedTeam.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>¡Enlace Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#FFCC00]" />
                        <span>Copiar Enlace de Acceso</span>
                      </>
                    )}
                  </button>

                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#000533] hover:bg-[#060CE9] border-2 border-blue-700 text-blue-200 hover:text-white font-bold text-xs sm:text-sm transition-colors"
                    title="Abrir pulsador en nueva pestaña"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Probar Pulsador</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
