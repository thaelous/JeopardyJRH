import React from 'react';
import { GameState } from '../types';
import { soundManager } from '../utils/audio';
import {
  Smartphone,
  Zap,
  Volume2,
  ExternalLink,
  X,
  History,
  Info
} from 'lucide-react';

interface QuickSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onSimulateBuzz: (teamId: string, memberName: string) => void;
}

export const QuickSimulator: React.FC<QuickSimulatorProps> = ({
  isOpen,
  onClose,
  gameState,
  onSimulateBuzz,
}) => {
  const [memberSuffix, setMemberSuffix] = React.useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleOpenPlayerTab = (teamId: string) => {
    const url = `${window.location.origin}/?role=player&team=${teamId}`;
    window.open(url, '_blank');
  };

  const getSimMemberName = (team: { id: string; name: string }) => {
    const suffix = memberSuffix[team.id] || 'Integrante 1';
    return `${team.name} - ${suffix}`;
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 w-full max-w-sm bg-[#000533] border-4 border-[#D4AF37] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-white">
      {/* Header */}
      <div className="bg-[#060CE9] px-4 py-2.5 border-b-2 border-[#D4AF37] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FFCC00]" />
          <h3 className="font-black text-xs uppercase tracking-wider text-[#FFCC00]">
            Simulador de Pruebas Rápidas
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#000222] text-blue-200 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
        <p className="text-[11px] text-blue-200 font-semibold">
          Usa este panel para probar el sistema sin necesidad de escanear desde celulares físicos.
        </p>

        {/* Simulate Buzz Buttons */}
        <div>
          <span className="font-black uppercase tracking-wider text-blue-300 block mb-1.5 text-[10px]">
            Simular Pulsación Instantánea y Rebote:
          </span>
          <div className="space-y-2">
            {gameState.teams.map((team) => {
              const currentSuffix = memberSuffix[team.id] || 'Integrante 1';
              const simMember = getSimMemberName(team);
              const isBuzzedNow = gameState.buzzerState.buzzedTeamId === team.id;
              const isLocked = (gameState.buzzerState.lockedTeams || []).includes(team.id);
              const isInQueue = (gameState.buzzerState.buzzQueue || []).some((q) => q.teamId === team.id);
              const hasAttempted = (gameState.buzzerState.attemptedMembers || []).includes(simMember);
              const isOtherTeamBuzzed =
                gameState.buzzerState.buzzedTeamId !== null && !isBuzzedNow;

              const canSimBuzz =
                !isBuzzedNow &&
                !isLocked &&
                !hasAttempted &&
                !isInQueue &&
                (gameState.buzzerState.isOpen || isOtherTeamBuzzed);

              return (
                <div key={team.id} className="p-2 rounded-2xl bg-[#000222]/80 border border-blue-900/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold flex items-center gap-1.5" style={{ color: team.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </span>
                    {/* Switch member to test multiple participants per team */}
                    <div className="flex items-center gap-1">
                      {['Int. 1', 'Int. 2'].map((lbl, idx) => {
                        const val = `Integrante ${idx + 1}`;
                        const isSelected = currentSuffix === val;
                        return (
                          <button
                            key={val}
                            onClick={() => setMemberSuffix((prev) => ({ ...prev, [team.id]: val }))}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                              isSelected
                                ? 'bg-[#FFCC00] text-blue-950'
                                : 'bg-blue-950 text-blue-300 hover:text-white'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-sim-buzz-${team.id}`}
                      onClick={() => onSimulateBuzz(team.id, simMember)}
                      disabled={!canSimBuzz}
                      className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-white font-black transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-xs border border-white/40"
                      style={{ backgroundColor: team.color }}
                    >
                      <span className="truncate">
                        {isBuzzedNow
                          ? '¡En Turno Activo!'
                          : isInQueue
                          ? 'En Cola de Rebote'
                          : hasAttempted
                          ? 'Ya intentó esta pista'
                          : isLocked
                          ? 'Equipo Bloqueado'
                          : isOtherTeamBuzzed
                          ? `¡Rebote ${currentSuffix}!`
                          : `¡Pulsar ${currentSuffix}!`}
                      </span>
                      <Zap className="w-3.5 h-3.5 shrink-0 text-[#FFCC00]" />
                    </button>

                    <button
                      onClick={() => handleOpenPlayerTab(team.id)}
                      title={`Abrir vista móvil de ${team.name} en pestaña nueva`}
                      className="p-2 rounded-xl bg-[#000222] hover:bg-[#060CE9] text-blue-200 hover:text-[#FFCC00] border-2 border-blue-900 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio testing buttons */}
        <div>
          <span className="font-black uppercase tracking-wider text-blue-300 block mb-1.5 text-[10px]">
            Probar Efectos de Sonido:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => soundManager.playBuzzer()}
              className="px-2 py-1.5 bg-[#060CE9]/40 hover:bg-[#060CE9] text-white rounded-lg text-[11px] font-bold text-left flex items-center gap-1 border border-blue-500/40 transition-colors"
            >
              <Volume2 className="w-3 h-3 text-[#FFCC00]" />
              <span>Pulsador</span>
            </button>
            <button
              onClick={() => soundManager.playCorrect()}
              className="px-2 py-1.5 bg-[#060CE9]/40 hover:bg-[#060CE9] text-white rounded-lg text-[11px] font-bold text-left flex items-center gap-1 border border-blue-500/40 transition-colors"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>Acierto</span>
            </button>
            <button
              onClick={() => soundManager.playWrong()}
              className="px-2 py-1.5 bg-[#060CE9]/40 hover:bg-[#060CE9] text-white rounded-lg text-[11px] font-bold text-left flex items-center gap-1 border border-blue-500/40 transition-colors"
            >
              <Volume2 className="w-3 h-3 text-rose-400" />
              <span>Error</span>
            </button>
            <button
              onClick={() => soundManager.playSelectClue()}
              className="px-2 py-1.5 bg-[#060CE9]/40 hover:bg-[#060CE9] text-white rounded-lg text-[11px] font-bold text-left flex items-center gap-1 border border-blue-500/40 transition-colors"
            >
              <Volume2 className="w-3 h-3 text-blue-300" />
              <span>Selección</span>
            </button>
          </div>
        </div>

        {/* Recent logs */}
        <div>
          <span className="font-black uppercase tracking-wider text-blue-300 flex items-center gap-1 mb-1 text-[10px]">
            <History className="w-3 h-3 text-[#FFCC00]" />
            <span>Registro en Vivo:</span>
          </span>
          <div className="bg-[#000222] p-2 rounded-xl border-2 border-blue-900/80 max-h-28 overflow-y-auto space-y-1 font-mono text-[10px]">
            {gameState.recentLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className={`truncate ${
                  log.type === 'buzz'
                    ? 'text-[#FFCC00] font-bold'
                    : log.type === 'correct'
                    ? 'text-emerald-400 font-bold'
                    : log.type === 'wrong'
                    ? 'text-rose-400 font-bold'
                    : 'text-blue-200'
                }`}
              >
                • {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
