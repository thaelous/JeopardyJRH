import React, { useState, useEffect } from 'react';
import { ActiveClue, BuzzerState, Team } from '../types';
import {
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Radio,
  Clock,
  User,
  AlertCircle,
  Zap,
  RotateCcw,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClueModalProps {
  activeClue: ActiveClue;
  buzzerState: BuzzerState;
  teams: Team[];
  onJudgeCorrect: () => void;
  onJudgeWrong: () => void;
  onRevealAnswer: () => void;
  onCloseClue: () => void;
  onOpenBuzzers: () => void;
}

export const ClueModal: React.FC<ClueModalProps> = ({
  activeClue,
  buzzerState,
  teams,
  onJudgeCorrect,
  onJudgeWrong,
  onRevealAnswer,
  onCloseClue,
  onOpenBuzzers,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(activeClue.timeRemaining || 15);
  const buzzedTeam = teams.find((t) => t.id === buzzerState.buzzedTeamId);

  // Countdown timer when buzzing is open
  useEffect(() => {
    if (!buzzerState.isOpen) return;

    setTimeLeft(15);
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [buzzerState.isOpen]);

  const handleCorrect = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onJudgeCorrect();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-[clamp(0.5rem,1.5vw,1.5rem)] bg-[#000533]/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-[min(100%,clamp(700px,90vw,1400px))] bg-gradient-to-b from-[#060CE9] via-[#000533] to-[#000b5e] border-[clamp(2px,0.4vw,5px)] border-[#D4AF37] rounded-[clamp(1rem,1.8vw,2rem)] shadow-[0_0_80px_rgba(6,12,233,0.8)] overflow-hidden flex flex-col max-h-[92vh] max-h-[92dvh]">
        {/* Top Header: Category & Point Value */}
        <div className="bg-[#060CE9] px-[clamp(0.75rem,2vw,1.75rem)] py-[clamp(0.5rem,1vh,1rem)] border-b-[clamp(2px,0.3vw,4px)] border-[#D4AF37] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="font-black uppercase tracking-widest text-[#FFCC00] bg-[#000222] px-[clamp(0.6rem,1vw,1.2rem)] py-[clamp(0.2rem,0.4vh,0.5rem)] rounded-full border-2 border-[#D4AF37]"
              style={{ fontSize: 'clamp(0.65rem, 0.6vw + 0.4vh, 0.95rem)' }}
            >
              {activeClue.categoryName}
            </span>
          </div>

          <div className="flex items-center gap-[clamp(0.5rem,1.2vw,1.5rem)]">
            <span
              className="font-mono font-black text-[#FFCC00] tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] leading-none"
              style={{ fontSize: 'clamp(1.6rem, 2.2vw + 1.2vh, 3.8rem)' }}
            >
              ${activeClue.value}
            </span>

            <button
              id="btn-close-clue-top"
              onClick={onCloseClue}
              title="Volver al tablero principal"
              className="p-[clamp(0.35rem,0.5vh,0.6rem)] rounded-xl bg-[#000222] hover:bg-[#000533] text-white border-2 border-white/30 hover:border-[#FFCC00] transition-colors"
            >
              <ArrowLeft className="w-[clamp(1rem,1.2vw,1.4rem)] h-[clamp(1rem,1.2vw,1.4rem)]" />
            </button>
          </div>
        </div>

        {/* Main Clue Card Content */}
        <div className="flex-1 overflow-y-auto p-[clamp(0.75rem,2.5vw+1vh,2.5rem)] flex flex-col items-center justify-center text-center space-y-[clamp(0.75rem,1.5vh,1.75rem)]">
          {/* Question / Clue Text */}
          <div className="max-w-4xl w-full">
            <p
              className="uppercase font-black tracking-widest text-[#FFCC00] mb-[clamp(0.35rem,0.8vh,0.75rem)]"
              style={{ fontSize: 'clamp(0.65rem, 0.6vw, 0.85rem)' }}
            >
              PISTA DE JEOPARDY
            </p>
            <h1
              className="font-black text-white leading-tight tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-sans px-2"
              style={{
                fontSize: 'clamp(1.25rem, 2vw + 1.8vh, 3.5rem)',
              }}
            >
              "{activeClue.question}"
            </h1>
          </div>

          {/* Solution revealed state */}
          {activeClue.state === 'revealed' && (
            <div className="w-full max-w-2xl bg-white border-4 border-[#FFCC00] rounded-2xl p-[clamp(0.75rem,1.2vw+0.8vh,1.5rem)] shadow-[0_0_30px_rgba(255,204,0,0.6)] animate-in zoom-in-95 duration-200 text-blue-950">
              <p className="text-[clamp(0.65rem,0.6vw,0.8rem)] font-black uppercase tracking-wider text-blue-900 mb-1">
                Solución Oficial:
              </p>
              <p
                className="font-black text-blue-950 leading-tight"
                style={{ fontSize: 'clamp(1.2rem, 1.6vw + 1vh, 2.5rem)' }}
              >
                {activeClue.answer}
              </p>
            </div>
          )}

          {/* Live Buzzer State Display */}
          <div className="w-full max-w-2xl">
            {/* Case 1: Buzzed In Team */}
            {buzzerState.buzzedTeamId && buzzedTeam ? (
              <div className="bg-white rounded-2xl p-[clamp(0.75rem,1.2vw+0.6vh,1.5rem)] border-4 border-[#FFCC00] text-blue-950 shadow-[0_0_40px_rgba(255,204,0,0.6)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full animate-ping"
                    style={{ backgroundColor: buzzedTeam.color }}
                  />
                  <h3
                    className="font-black uppercase tracking-wide text-blue-950"
                    style={{ fontSize: 'clamp(1.1rem, 1.4vw + 0.8vh, 2rem)' }}
                  >
                    ¡{buzzedTeam.name} pulsó primero!
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-1 text-[clamp(0.75rem,0.75vw,0.95rem)] font-bold text-blue-800 mb-3">
                  <User className="w-4 h-4 text-[#060CE9]" />
                  <span>Participante: <strong className="text-blue-950">{buzzerState.buzzedPlayerName}</strong></span>
                </div>

                {/* 10-Second Writing Timer for Participant */}
                {buzzerState.playerAnswer ? (
                  <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs font-bold shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Respuesta escrita a tiempo dentro del límite de 10s</span>
                    </div>
                    <span className="text-[11px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full font-mono font-black">
                      RECIBIDA
                    </span>
                  </div>
                ) : (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5 text-xs font-black uppercase tracking-wider text-amber-950">
                      <div className="flex items-center gap-1.5">
                        <Clock
                          className={`w-4 h-4 ${
                            (buzzerState.answerTimeRemaining ?? 10) <= 3
                              ? 'text-red-600 animate-spin'
                              : 'text-amber-600 animate-pulse'
                          }`}
                        />
                        <span>Tiempo para escribir respuesta:</span>
                      </div>
                      <span
                        className={`font-mono px-2.5 py-0.5 rounded-lg text-sm font-black ${
                          (buzzerState.answerTimeRemaining ?? 10) <= 3
                            ? 'bg-red-600 text-white animate-bounce'
                            : (buzzerState.answerTimeRemaining ?? 10) <= 5
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-900 text-white'
                        }`}
                      >
                        {buzzerState.answerTimeRemaining ?? 10}s
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                          (buzzerState.answerTimeRemaining ?? 10) <= 3
                            ? 'bg-red-600'
                            : (buzzerState.answerTimeRemaining ?? 10) <= 5
                            ? 'bg-amber-500'
                            : 'bg-[#060CE9]'
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, ((buzzerState.answerTimeRemaining ?? 10) / 10) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-amber-900 font-semibold text-center">
                      Tiene 10 segundos para escribir la respuesta o será considerada errónea automáticamente.
                    </p>
                  </div>
                )}

                {/* Answer received from mobile */}
                <div className="bg-blue-50 rounded-xl p-[clamp(0.5rem,0.8vw,1rem)] border-2 border-blue-200 text-left">
                  <p className="text-[clamp(0.6rem,0.55vw,0.75rem)] font-black uppercase tracking-wider text-blue-800 mb-0.5">
                    Respuesta recibida desde el celular:
                  </p>
                  <p
                    className="font-mono font-black text-blue-950"
                    style={{ fontSize: 'clamp(0.95rem, 1.2vw + 0.5vh, 1.75rem)' }}
                  >
                    {buzzerState.playerAnswer ? (
                      `"${buzzerState.playerAnswer}"`
                    ) : (
                      <span className="text-blue-400 italic text-[clamp(0.75rem,0.7vw,0.9rem)] font-sans font-semibold">
                        Esperando que el participante responda verbalmente o desde su teléfono...
                      </span>
                    )}
                  </p>
                </div>

                {/* Rebound Queue indicator if another team already queued */}
                {buzzerState.buzzQueue && buzzerState.buzzQueue.length > 0 && (
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold shadow-sm">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                    <span>
                      En cola de rebote automático:{' '}
                      <strong className="text-amber-900">
                        {buzzerState.buzzQueue
                          .map((q) => {
                            const tm = teams.find((t) => t.id === q.teamId);
                            return `${tm?.name || 'Equipo'} (${q.memberName})`;
                          })
                          .join(' ➔ ')}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Host Judgment Controls for buzzed team */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-3.5">
                  <button
                    id="btn-judge-correct"
                    onClick={handleCorrect}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-[clamp(0.75rem,1.2vw,1.5rem)] py-[clamp(0.5rem,0.9vh,0.85rem)] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 border-2 border-white text-[clamp(0.75rem,0.75vw,0.95rem)]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Correcto! (+${activeClue.value})</span>
                  </button>

                  <button
                    id="btn-judge-wrong"
                    onClick={onJudgeWrong}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-[clamp(0.75rem,1.2vw,1.5rem)] py-[clamp(0.5rem,0.9vh,0.85rem)] rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 border-2 border-white text-[clamp(0.75rem,0.75vw,0.95rem)]"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Incorrecto (-${activeClue.value})</span>
                  </button>
                </div>
              </div>
            ) : buzzerState.isOpen ? (
              /* Case 2: Buzzers Active & Open */
              <div className="bg-[#060CE9]/30 border-2 border-[#FFCC00] rounded-2xl p-[clamp(0.75rem,1.2vw+0.6vh,1.5rem)] shadow-xl">
                <div className="flex items-center justify-center gap-2 text-[#FFCC00] mb-1.5">
                  <Radio className="w-5 h-5 animate-pulse text-[#FFCC00]" />
                  <span
                    className="font-black uppercase tracking-wider"
                    style={{ fontSize: 'clamp(1rem, 1.2vw + 0.6vh, 1.75rem)' }}
                  >
                    ¡Pulsadores Activos!
                  </span>
                  {(buzzerState.reboundRound || 1) > 1 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500 text-[#000533] text-[10px] font-black uppercase tracking-widest border border-white">
                      Ronda de Rebote {buzzerState.reboundRound}
                    </span>
                  )}
                </div>
                <p className="text-[clamp(0.7rem,0.65vw,0.85rem)] text-blue-200 mb-2.5 font-semibold">
                  {(buzzerState.reboundRound || 1) > 1
                    ? '¡Oportunidad abierta para integrantes distintos de los equipos!'
                    : 'Los jugadores pueden presionar el botón en sus celulares ahora mismo.'}
                </p>

                {/* Live seconds countdown bar */}
                <div className="w-full bg-[#000222] rounded-full h-3 overflow-hidden border-2 border-[#060CE9] max-w-md mx-auto">
                  <div
                    className="bg-[#FFCC00] h-full transition-all duration-1000 ease-linear rounded-full shadow-[0_0_10px_#FFCC00]"
                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[clamp(0.65rem,0.6vw,0.8rem)] font-mono font-bold text-[#FFCC00]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s restantes</span>
                </div>

                {/* Locked teams indicator */}
                {buzzerState.lockedTeams.length > 0 && (
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[clamp(0.65rem,0.6vw,0.78rem)] text-red-200 bg-red-950/60 p-2 rounded-lg border border-red-700 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>
                      Equipos bloqueados en esta ronda:{' '}
                      {buzzerState.lockedTeams
                        .map((id) => teams.find((t) => t.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Already attempted members list */}
                {buzzerState.attemptedMembers && buzzerState.attemptedMembers.length > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[clamp(0.6rem,0.55vw,0.72rem)] text-amber-200 bg-amber-950/40 p-1.5 rounded-lg border border-amber-800/60">
                    <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Ya intentaron esta pista (inhabilitados):{' '}
                      <strong>{buzzerState.attemptedMembers.join(', ')}</strong>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Case 3: Buzzers waiting or closed */
              <div className="bg-[#000222]/80 border-2 border-blue-500/40 rounded-2xl p-[clamp(0.75rem,1.2vw,1.25rem)] flex flex-col items-center justify-center">
                <p className="text-[clamp(0.75rem,0.7vw,0.9rem)] text-blue-200 font-semibold mb-2.5">
                  {activeClue.state === 'revealed'
                    ? 'Pregunta finalizada. Puedes regresar al tablero o revisar la respuesta.'
                    : 'Pulsadores en pausa.'}
                </p>
                {activeClue.state !== 'revealed' && (
                  <button
                    id="btn-reopen-buzzers"
                    onClick={onOpenBuzzers}
                    className="px-[clamp(0.85rem,1.4vw,1.5rem)] py-[clamp(0.4rem,0.7vh,0.65rem)] rounded-xl bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] font-black uppercase tracking-wider transition-colors shadow-md border-2 border-white text-[clamp(0.7rem,0.7vw,0.85rem)]"
                  >
                    Habilitar Pulsadores Ahora
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Reveal & Return */}
        <div className="bg-[#000222] px-[clamp(0.75rem,2vw,1.75rem)] py-[clamp(0.5rem,0.8vh,0.85rem)] border-t-[clamp(2px,0.3vw,4px)] border-[#060CE9] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            id="btn-reveal-solution"
            onClick={onRevealAnswer}
            disabled={activeClue.state === 'revealed'}
            className="flex items-center gap-1.5 px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.35rem,0.6vh,0.55rem)] rounded-xl bg-[#060CE9]/30 hover:bg-[#060CE9] disabled:opacity-40 text-white font-bold transition-colors border-2 border-white/20 hover:border-[#FFCC00] text-[clamp(0.65rem,0.65vw,0.82rem)]"
          >
            <Eye className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-[#FFCC00]" />
            <span>Revelar Solución</span>
          </button>

          <button
            id="btn-return-board"
            onClick={onCloseClue}
            className="flex items-center gap-1.5 px-[clamp(0.75rem,1.2vw,1.25rem)] py-[clamp(0.35rem,0.6vh,0.55rem)] rounded-xl bg-[#060CE9] hover:bg-blue-600 text-white font-black uppercase tracking-wider transition-all shadow-md border-2 border-[#D4AF37] text-[clamp(0.65rem,0.65vw,0.82rem)]"
          >
            <ArrowLeft className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)]" />
            <span>Regresar al Tablero</span>
          </button>
        </div>
      </div>
    </div>
  );
};
