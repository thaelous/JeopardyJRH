import React from 'react';
import { Team } from '../types';
import { QrCode, Plus, Minus } from 'lucide-react';

interface TeamScoreBarProps {
  teams: Team[];
  buzzedTeamId: string | null;
  onOpenQR: (teamId?: string) => void;
  onAdjustScore: (teamId: string, delta: number) => void;
  onEditTeam?: (team: Team) => void;
}

export const TeamScoreBar: React.FC<TeamScoreBarProps> = ({
  teams,
  buzzedTeamId,
  onOpenQR,
  onAdjustScore,
}) => {
  const teamCount = Math.max(teams.length, 1);

  return (
    <footer className="w-full bg-[#000222]/95 backdrop-blur border-t-[clamp(2px,0.3vw,4px)] border-[#060CE9] px-[clamp(0.5rem,1.5vw,2rem)] py-[clamp(0.25rem,0.8vh,0.65rem)] shadow-2xl z-20 shrink-0 select-none">
      <div
        className="max-w-[min(100%,clamp(900px,94vw,2200px))] mx-auto grid gap-[clamp(0.35rem,0.8vw,1rem)] items-stretch"
        style={{
          gridTemplateColumns: `repeat(${teamCount}, minmax(0, 1fr))`,
        }}
      >
        {teams.map((team, idx) => {
          const isBuzzed = buzzedTeamId === team.id;

          return (
            <div
              key={team.id}
              id={`team-card-${team.id}`}
              className={`relative rounded-[clamp(0.5rem,0.8vw,1rem)] p-[clamp(0.35rem,0.6vw+0.4vh,0.75rem)] transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isBuzzed
                  ? 'bg-white text-blue-900 ring-4 ring-[#FFCC00] shadow-[0_0_30px_rgba(255,204,0,0.6)] animate-pulse scale-[1.01]'
                  : 'bg-[#060CE9]/20 border-2 border-blue-500/50 hover:border-blue-400'
              }`}
            >
              {/* Colored top accent line */}
              <div
                className="absolute top-0 left-0 w-full h-[clamp(3px,0.4vh,6px)]"
                style={{ backgroundColor: team.color }}
              />

              {/* Team header */}
              <div className="flex items-center justify-between gap-1.5 mb-1 mt-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-[clamp(0.65rem,0.8vw,1rem)] h-[clamp(0.65rem,0.8vw,1rem)] rounded-full shrink-0 shadow-sm border border-white/40"
                    style={{ backgroundColor: team.color }}
                  />
                  <div className="min-w-0">
                    <span
                      className={`block uppercase font-bold tracking-wider leading-none text-[clamp(0.55rem,0.5vw+0.2vh,0.75rem)] ${
                        isBuzzed ? 'text-red-600 font-black' : 'text-blue-300'
                      }`}
                    >
                      {isBuzzed ? '• PULSADOR ACTIVO' : `Equipo 0${idx + 1}`}
                    </span>
                    <h3
                      className={`font-black uppercase truncate leading-tight ${
                        isBuzzed ? 'text-blue-950' : 'text-white'
                      }`}
                      style={{
                        fontSize: 'clamp(0.8rem, 0.7vw + 0.4vh, 1.25rem)',
                      }}
                    >
                      {team.name}
                    </h3>
                  </div>
                </div>

                {/* QR button for this team */}
                <button
                  id={`btn-qr-${team.id}`}
                  onClick={() => onOpenQR(team.id)}
                  title={`Ver código QR para unirse a ${team.name}`}
                  className={`flex items-center gap-1 font-bold px-[clamp(0.35rem,0.5vw,0.65rem)] py-[clamp(0.2rem,0.3vh,0.4rem)] rounded-[clamp(0.35rem,0.5vw,0.6rem)] border transition-colors shrink-0 text-[clamp(0.6rem,0.6vw,0.8rem)] ${
                    isBuzzed
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-950 border-blue-300'
                      : 'bg-[#000533] hover:bg-[#060CE9] text-white border-blue-400/40'
                  }`}
                >
                  <QrCode className="w-3 h-3 text-[#FFCC00]" />
                  <span className="hidden md:inline">QR</span>
                </button>
              </div>

              {/* Score and adjustment controls */}
              <div
                className={`flex items-center justify-between rounded-[clamp(0.35rem,0.5vw,0.65rem)] px-[clamp(0.4rem,0.6vw,0.75rem)] py-[clamp(0.2rem,0.4vh,0.45rem)] my-0.5 border ${
                  isBuzzed
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-[#000533]/80 border-blue-900/60'
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`uppercase font-bold tracking-wider leading-none text-[clamp(0.5rem,0.45vw,0.7rem)] ${
                      isBuzzed ? 'text-blue-700' : 'text-blue-300'
                    }`}
                  >
                    Puntaje
                  </span>
                  <span
                    className={`font-black font-mono tracking-tight leading-none ${
                      isBuzzed
                        ? 'text-blue-950'
                        : team.score >= 0
                        ? 'text-[#FFCC00]'
                        : 'text-rose-400'
                    }`}
                    style={{
                      fontSize: 'clamp(1.3rem, 1.8vw + 1vh, 2.8rem)',
                    }}
                  >
                    ${team.score.toLocaleString()}
                  </span>
                </div>

                {/* Score adjustment buttons for host */}
                <div className="flex items-center gap-1">
                  <button
                    id={`btn-minus-${team.id}`}
                    onClick={() => onAdjustScore(team.id, -100)}
                    title="Restar 100 puntos"
                    className={`w-[clamp(1.4rem,1.8vw,2rem)] h-[clamp(1.4rem,1.8vw,2rem)] rounded flex items-center justify-center font-bold border transition-colors ${
                      isBuzzed
                        ? 'bg-white hover:bg-rose-100 text-rose-700 border-slate-300'
                        : 'bg-[#000533] hover:bg-rose-950/70 text-slate-300 hover:text-rose-400 border-blue-800'
                    }`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    id={`btn-plus-${team.id}`}
                    onClick={() => onAdjustScore(team.id, 100)}
                    title="Sumar 100 puntos"
                    className={`w-[clamp(1.4rem,1.8vw,2rem)] h-[clamp(1.4rem,1.8vw,2rem)] rounded flex items-center justify-center font-bold border transition-colors ${
                      isBuzzed
                        ? 'bg-white hover:bg-emerald-100 text-emerald-700 border-slate-300'
                        : 'bg-[#000533] hover:bg-emerald-950/70 text-slate-300 hover:text-emerald-400 border-blue-800'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status pill or players count */}
              <div className="mt-0.5 flex items-center justify-between text-[clamp(0.6rem,0.55vw,0.78rem)]">
                {isBuzzed ? (
                  <div className="w-full flex items-center justify-center">
                    <span className="px-2 py-0.5 bg-red-600 text-white font-black rounded-full uppercase tracking-wider shadow-sm text-[clamp(0.55rem,0.5vw,0.75rem)]">
                      ¡ESPERANDO RESPUESTA...!
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 font-bold text-emerald-400 uppercase tracking-wider truncate">
                      <span>• {team.members.length} {team.members.length === 1 ? 'JUGADOR' : 'JUGADORES'}</span>
                    </div>
                    <span className="font-bold text-blue-300 truncate max-w-[140px] opacity-80">
                      {team.members.length === 0
                        ? 'Sin conexión'
                        : team.members.map((m) => m.name).join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
