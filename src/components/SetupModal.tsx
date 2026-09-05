import React, { useState, useRef } from 'react';
import { Category, Team, GameSettings } from '../types';
import { PREDEFINED_GAMES } from '../data/defaultGames';
import { parseExcelOrCsv, downloadSampleExcel, downloadSampleCsv } from '../utils/excelParser';
import {
  X,
  Upload,
  Download,
  Check,
  AlertCircle,
  Sparkles,
  BookOpen,
  Settings,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  currentCategories: Category[];
  currentTeams: Team[];
  currentSettings: GameSettings;
  onSave: (data: {
    title: string;
    categories: Category[];
    teams: Team[];
    settings: GameSettings;
  }) => void;
}

const DEFAULT_EXTRA_TEAMS: Team[] = [
  { id: 'team-1', name: 'Equipo Rojo', color: '#ef4444', score: 0, members: [] },
  { id: 'team-2', name: 'Equipo Azul', color: '#3b82f6', score: 0, members: [] },
  { id: 'team-3', name: 'Equipo Verde', color: '#10b981', score: 0, members: [] },
  { id: 'team-4', name: 'Equipo Amarillo', color: '#f59e0b', score: 0, members: [] },
  { id: 'team-5', name: 'Equipo Morado', color: '#8b5cf6', score: 0, members: [] },
];

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  currentCategories,
  currentTeams,
  currentSettings,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'teams' | 'preview'>('upload');
  const [gameTitle, setGameTitle] = useState(currentTitle);
  const [categories, setCategories] = useState<Category[]>(currentCategories);
  const [teams, setTeams] = useState<Team[]>(currentTeams);
  const [settings, setSettings] = useState<GameSettings>(currentSettings);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    setUploadError(null);
    setUploadSuccess(null);

    const result = await parseExcelOrCsv(file);
    setIsProcessingFile(false);

    if (result.success && result.categories.length > 0) {
      setCategories(result.categories);
      setUploadSuccess(
        `¡Archivo procesado con éxito! Se cargaron ${result.categories.length} categorías y ${result.rowCount || 0} pistas.`
      );
      // Auto-suggest title based on filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      if (cleanName && cleanName.length > 3) {
        setGameTitle(`Jeopardy: ${cleanName}`);
      }
    } else {
      setUploadError(result.error || 'Error al analizar el archivo.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PREDEFINED_GAMES.find((g) => g.id === presetId);
    if (preset) {
      setCategories(JSON.parse(JSON.stringify(preset.categories)));
      setGameTitle(preset.title);
      setUploadSuccess(`Se cargó el paquete temático "${preset.title}".`);
    }
  };

  const handleSaveAll = () => {
    onSave({
      title: gameTitle,
      categories,
      teams,
      settings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#000533]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#000533] border-4 border-[#D4AF37] rounded-3xl shadow-[0_0_80px_rgba(6,12,233,0.7)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#060CE9] px-6 py-4 border-b-4 border-[#D4AF37] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#000222] border-2 border-[#D4AF37] flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#FFCC00]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#FFCC00] uppercase tracking-wide drop-shadow-md">
                Configuración del Tablero & Preguntas
              </h2>
              <p className="text-xs text-blue-200 font-semibold">
                Personaliza categorías, sube archivos Excel/CSV o ajusta los equipos
              </p>
            </div>
          </div>

          <button
            id="btn-close-setup-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#000222] hover:bg-[#000533] text-white border border-white/30 hover:border-[#FFCC00] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-blue-900 bg-[#000222] p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs transition-colors shrink-0 ${
              activeTab === 'upload'
                ? 'bg-[#FFCC00] text-[#000533] font-black border border-white shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-[#060CE9]/40'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Cargar Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs transition-colors shrink-0 ${
              activeTab === 'presets'
                ? 'bg-[#FFCC00] text-[#000533] font-black border border-white shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-[#060CE9]/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Juegos Predefinidos</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs transition-colors shrink-0 ${
              activeTab === 'teams'
                ? 'bg-[#FFCC00] text-[#000533] font-black border border-white shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-[#060CE9]/40'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Equipos & Reglas</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs transition-colors shrink-0 ${
              activeTab === 'preview'
                ? 'bg-[#FFCC00] text-[#000533] font-black border border-white shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-[#060CE9]/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ver Tablero ({categories.length} categorías)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Game Title input (always accessible) */}
          <div className="bg-[#000222] p-4 rounded-xl border-2 border-blue-900/80">
            <label className="block text-xs font-black uppercase tracking-wider text-[#FFCC00] mb-1.5">
              Título del Evento o Concurso
            </label>
            <input
              type="text"
              id="input-game-title"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Ej: Jeopardy Escolar, Jeopardy de Programación 2026..."
              className="w-full bg-[#000533] border-2 border-blue-600 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]"
            />
          </div>

          {/* Tab 1: Upload Excel / CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/40 hover:bg-slate-900/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-3 transition-colors">
                  <Upload className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Arrastra tu archivo de Excel o CSV aquí
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Soporta formatos <span className="text-amber-400 font-mono">.xlsx</span>,{' '}
                  <span className="text-amber-400 font-mono">.xls</span> y{' '}
                  <span className="text-amber-400 font-mono">.csv</span> con las columnas:{' '}
                  <strong>Categoría, Puntos, Pista, Respuesta</strong>.
                </p>
                <div className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors">
                  {isProcessingFile ? 'Procesando archivo...' : 'Seleccionar archivo desde tu equipo'}
                </div>
              </div>

              {/* Status messages */}
              {uploadSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-300">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-700 rounded-xl text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Sample Templates Download Box */}
              <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    ¿No tienes un archivo preparado? Descarga la plantilla oficial
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Viene lista con 5 categorías y 25 preguntas de ejemplo para que solo sustituyas tus datos.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="btn-download-xlsx-template"
                    onClick={downloadSampleExcel}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .XLSX</span>
                  </button>

                  <button
                    id="btn-download-csv-template"
                    onClick={downloadSampleCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Pre-loaded Game Packs */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Selecciona uno de los sets de preguntas listos para jugar creados con preguntas verificadas:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PREDEFINED_GAMES.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-amber-400/60 rounded-xl p-4 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <h4 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
                        {preset.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {preset.categories.map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-semibold"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPreset(preset.id)}
                      className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs transition-colors"
                    >
                      Cargar este Set de Preguntas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Teams & Rules Configuration */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              {/* Teams Customization */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Configuración de Equipos ({teams.length} de máx. 5)
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">Cantidad:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          if (n > teams.length) {
                            const newTeams = [...teams];
                            for (let i = teams.length; i < n; i++) {
                              const def = DEFAULT_EXTRA_TEAMS[i] || {
                                id: `team-${i + 1}`,
                                name: `Equipo ${i + 1}`,
                                color: '#3b82f6',
                                score: 0,
                                members: [],
                              };
                              newTeams.push(def);
                            }
                            setTeams(newTeams);
                          } else if (n < teams.length) {
                            setTeams(teams.slice(0, n));
                          }
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          teams.length === n
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teams.map((t, idx) => (
                    <div
                      key={t.id}
                      className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={t.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeams((prev) =>
                              prev.map((item) => (item.id === t.id ? { ...item, color: val } : item))
                            );
                          }}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-bold text-slate-400">Color Equipo {idx + 1}</span>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">
                          Nombre del Equipo
                        </label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeams((prev) =>
                              prev.map((item) => (item.id === t.id ? { ...item, name: val } : item))
                            );
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">
                          Puntaje Inicial
                        </label>
                        <input
                          type="number"
                          value={t.score}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setTeams((prev) =>
                              prev.map((item) => (item.id === t.id ? { ...item, score: val } : item))
                            );
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Rules */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Reglas de Ronda
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tiempo de pulsador / respuesta (segundos)
                    </label>
                    <select
                      value={settings.timerSeconds}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, timerSeconds: Number(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold"
                    >
                      <option value={10}>10 segundos (Modo Rápido)</option>
                      <option value={15}>15 segundos (Estándar Jeopardy)</option>
                      <option value={20}>20 segundos (Escolar)</option>
                      <option value={30}>30 segundos (Tranquilo)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                      <span className="block text-xs font-bold text-white">
                        Penalizar respuesta errónea
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Resta el valor de la pista al equipo que falle
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.penalizeWrongAnswer}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, penalizeWrongAnswer: e.target.checked }))
                      }
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Categories & Clues Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Resumen de las categorías actuales ({categories.length} categorías,{' '}
                  {categories.reduce((acc, c) => acc + c.clues.length, 0)} pistas):
                </p>
              </div>

              <div className="space-y-3">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="bg-slate-950/80 rounded-xl p-3 border border-slate-800"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <span className="font-extrabold text-sm text-amber-400">
                        {idx + 1}. {cat.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {cat.clues.length} pistas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {cat.clues.map((clue) => (
                        <div
                          key={clue.id}
                          className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-[11px]"
                        >
                          <span className="font-bold text-amber-400 font-mono block">
                            ${clue.value}
                          </span>
                          <p className="text-slate-200 line-clamp-2 mt-0.5" title={clue.question}>
                            {clue.question}
                          </p>
                          <p className="text-slate-400 text-[10px] truncate mt-1 italic" title={clue.answer}>
                            R: {clue.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#000222] px-6 py-4 border-t-4 border-[#060CE9] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#000533] hover:bg-slate-800 text-slate-300 font-bold text-xs border border-white/20 transition-colors"
          >
            Cancelar
          </button>

          <button
            id="btn-apply-setup"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] font-black text-xs uppercase tracking-wider transition-colors shadow-lg border-2 border-white"
          >
            <Check className="w-4 h-4 text-[#000533]" />
            <span>Aplicar y Comenzar Juego</span>
          </button>
        </div>
      </div>
    </div>
  );
};
