import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { soundManager } from '../utils/audio';
import {
  Send,
  Sparkles,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Wifi,
  Tv,
  HelpCircle,
  Flame,
  Zap,
  ShieldAlert,
  Clock,
  LogOut,
  Home,
  XCircle,
} from 'lucide-react';

interface PlayerViewProps {
  gameState: GameState;
  isConnected: boolean;
  onBuzz: (teamId: string, memberName: string) => void;
  onSubmitAnswer: (teamId: string, answer: string, memberName: string) => void;
  onJoinTeam: (teamId: string, memberName: string) => void;
  onSwitchToHost: () => void;
  initialTeamId?: string;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  gameState,
  isConnected,
  onBuzz,
  onSubmitAnswer,
  onJoinTeam,
  onSwitchToHost,
  initialTeamId,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    initialTeamId || gameState.teams[0]?.id || 'team-1'
  );
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('jeopardy_player_name') || '';
  });
  const [hasJoined, setHasJoined] = useState<boolean>(() => {
    return !!localStorage.getItem('jeopardy_player_joined');
  });
  const [answerText, setAnswerText] = useState<string>('');
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState<boolean>(false);

  // Sync initialTeamId if passed in URL
  useEffect(() => {
    if (initialTeamId) {
      setSelectedTeamId(initialTeamId);
    }
  }, [initialTeamId]);

  // Reset answer text when active clue changes
  useEffect(() => {
    setAnswerText('');
    setHasSubmittedAnswer(false);
  }, [gameState.activeClue?.clueId]);

  // Fallback team to prevent undefined crashes if teams array is modified
  const fallbackTeam = {
    id: 'team-1',
    name: 'Equipo 1',
    color: '#3b82f6',
    score: 0,
    members: [],
  };
  const currentTeam = gameState.teams.find((t) => t.id === selectedTeamId) || gameState.teams[0] || fallbackTeam;
  const maxLimit = gameState.settings.maxPlayersPerTeam || 5;
  const isSelectedTeamFull = currentTeam && maxLimit > 0 && currentTeam.members.length >= maxLimit;

  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSessionTerminated, setIsSessionTerminated] = useState<boolean>(false);
  const [terminationMessage, setTerminationMessage] = useState<string>(
    'El anfitrión ha cerrado la sesión global del concurso.'
  );
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);

  // Sync selectedTeamId if teams list changed or team was removed
  useEffect(() => {
    if (gameState.teams.length > 0 && !gameState.teams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(gameState.teams[0].id);
    }
  }, [gameState.teams, selectedTeamId]);

  // Re-register player with server on mount or when reconnecting if already joined
  useEffect(() => {
    if (hasJoined && playerName.trim() && currentTeam?.id && isConnected) {
      onJoinTeam(currentTeam.id, playerName.trim());
    }
  }, [hasJoined, isConnected, currentTeam?.id, playerName, onJoinTeam]);

  // Listen for server errors
  useEffect(() => {
    const handleErr = (e: any) => {
      if (e.detail) {
        setJoinError(e.detail);
      }
    };
    window.addEventListener('jeopardy-error', handleErr);
    return () => window.removeEventListener('jeopardy-error', handleErr);
  }, []);

  // Listen for global logout event from host
  useEffect(() => {
    const handleGlobalLogout = (e: any) => {
      // Clear local storage credentials
      localStorage.removeItem('jeopardy_player_name');
      localStorage.removeItem('jeopardy_player_joined');
      setHasJoined(false);
      setPlayerName('');
      setIsSessionTerminated(true);
      if (e.detail) {
        setTerminationMessage(e.detail);
      }
      soundManager.playWrong();
    };

    window.addEventListener('jeopardy-global-logout', handleGlobalLogout);
    return () => window.removeEventListener('jeopardy-global-logout', handleGlobalLogout);
  }, []);

  // Sync if server state indicates session is inactive while player was joined
  useEffect(() => {
    if (gameState.isSessionActive === false && hasJoined) {
      localStorage.removeItem('jeopardy_player_name');
      localStorage.removeItem('jeopardy_player_joined');
      setHasJoined(false);
      setPlayerName('');
      setIsSessionTerminated(true);
      setTerminationMessage('El anfitrión ha cerrado la sesión global del concurso.');
    }
  }, [gameState.isSessionActive, hasJoined]);

  // Automatic redirection countdown
  useEffect(() => {
    if (!isSessionTerminated) return;
    if (redirectCountdown <= 0) {
      window.location.replace('/');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isSessionTerminated, redirectCountdown]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    if (isSelectedTeamFull) {
      setJoinError(`El ${currentTeam.name} ya alcanzó el límite de ${maxLimit} participantes.`);
      return;
    }

    setJoinError(null);
    localStorage.setItem('jeopardy_player_name', playerName.trim());
    localStorage.setItem('jeopardy_player_joined', 'true');
    setHasJoined(true);
    onJoinTeam(selectedTeamId, playerName.trim());
  };

  const handleLeaveOrChange = () => {
    setHasJoined(false);
    localStorage.removeItem('jeopardy_player_joined');
    setJoinError(null);
  };

  const handleBuzzClick = () => {
    if (!canBuzz) return;

    // Haptic & Sound
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
    soundManager.playBuzzer();

    onBuzz(currentTeam.id, cleanPlayerName || currentTeam.name);
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) return;

    onSubmitAnswer(currentTeam.id, answerText.trim(), playerName);
    setHasSubmittedAnswer(true);
  };

  // State calculations
  const cleanPlayerName = (playerName || '').trim();
  const isMyTeamBuzzed = gameState.buzzerState.buzzedTeamId === currentTeam.id;
  const isOtherTeamBuzzed =
    gameState.buzzerState.buzzedTeamId !== null && !isMyTeamBuzzed;
  const otherBuzzedTeam = gameState.teams.find((t) => t.id === gameState.buzzerState.buzzedTeamId);

  const isMyTeamLocked = (gameState.buzzerState.lockedTeams || []).includes(currentTeam.id);
  const hasAlreadyAttempted = (gameState.buzzerState.attemptedMembers || []).some(
    (m) => m.toLowerCase() === cleanPlayerName.toLowerCase()
  );
  const isMyTeamInQueue = (gameState.buzzerState.buzzQueue || []).some((q) => q.teamId === currentTeam.id);
  const isMeInQueue = (gameState.buzzerState.buzzQueue || []).some(
    (q) => q.teamId === currentTeam.id && q.memberName.toLowerCase() === cleanPlayerName.toLowerCase()
  );

  // Can this player buzz right now?
  // 1. Direct buzz when open, not locked, haven't attempted
  const canBuzzForWin = gameState.buzzerState.isOpen && !isMyTeamLocked && !hasAlreadyAttempted && !isMyTeamBuzzed;
  // 2. Queue for rebound while another team is currently answering!
  const canBuzzForRebound = isOtherTeamBuzzed && !isMyTeamLocked && !hasAlreadyAttempted && !isMyTeamInQueue && !isMyTeamBuzzed;
  const canBuzz = canBuzzForWin || canBuzzForRebound;

  // Step 0: Disconnected screen if session was terminated or inactive
  if (isSessionTerminated || gameState.isSessionActive === false) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#000533] bg-gradient-to-b from-[#1a0505] via-[#000533] to-[#000222] text-white flex flex-col justify-between p-4 sm:p-6 select-none">
        <div className="w-full max-w-md mx-auto space-y-6 pt-8 text-center">
          {/* Glowing Warning Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-600 to-rose-950 border-4 border-rose-400 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.6)] animate-pulse">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 border-2 border-[#000222] flex items-center justify-center text-[#000222] font-black shadow-md">
              <LogOut className="w-4 h-4" />
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-rose-950/80 border border-rose-500 text-rose-300 font-black text-xs uppercase tracking-widest">
              Sesión Desconectada
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {isSessionTerminated ? 'Sesión Cerrada por el Anfitrión' : 'Sesión No Iniciada'}
            </h1>
            <p className="text-sm text-blue-200 font-medium leading-relaxed max-w-sm mx-auto">
              {isSessionTerminated
                ? terminationMessage
                : 'El presentador del concurso aún no ha iniciado sesión o ha cerrado el panel de control. El acceso a los pulsadores móviles se encuentra bloqueado.'}
            </p>
          </div>

          {/* Countdown & Auto-Redirect Card */}
          <div className="bg-[#000222]/90 border-2 border-rose-500/60 rounded-2xl p-5 shadow-2xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400 animate-spin" />
                Sincronización Global
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                {redirectCountdown}s
              </span>
            </div>
            <p className="text-xs text-blue-200/80">
              Redirigiendo automáticamente a la pantalla de bienvenida en{' '}
              <strong className="text-white">{redirectCountdown} segundos</strong>...
            </p>
            {/* Progress bar */}
            <div className="w-full h-2 bg-rose-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(redirectCountdown / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              id="btn-return-home-now"
              onClick={() => {
                window.location.replace('/');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFCC00] to-[#D4AF37] hover:brightness-110 active:scale-[0.98] text-[#000533] font-black text-sm uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(255,204,0,0.3)] border-2 border-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Ir a la Pantalla Principal Ahora</span>
            </button>

            <button
              type="button"
              id="btn-close-player-tab"
              onClick={() => {
                window.close();
                setTimeout(() => {
                  window.location.replace('/');
                }, 300);
              }}
              className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-slate-300" />
              <span>Cerrar Esta Pestaña</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-blue-300/60 pb-2">
          Jeopardy Show • Desconexión sincronizada en tiempo real
        </div>
      </div>
    );
  }

  // Step 1: Join form if not joined yet
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#000533] text-white flex flex-col justify-between p-4 sm:p-6 select-none">
        <div className="w-full max-w-md mx-auto space-y-6 pt-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-[#060CE9] border-4 border-[#D4AF37] items-center justify-center text-[#FFCC00] font-black text-3xl shadow-[0_0_25px_rgba(255,204,0,0.5)] italic">
              J!
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-[#FFCC00] uppercase font-sans drop-shadow-md">
              {gameState.title}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 font-semibold">
              Pulsador móvil en tiempo real para eventos y competencias
            </p>
          </div>

          {/* Join Form */}
          <form
            onSubmit={handleJoin}
            className="bg-[#000222] border-4 border-[#D4AF37] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            {/* Team Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
                Selecciona tu Equipo ({maxLimit} participantes máx. por equipo)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {gameState.teams.map((team) => {
                  const isSelected = team.id === selectedTeamId;
                  const isTeamFull = maxLimit > 0 && team.members.length >= maxLimit;

                  return (
                    <button
                      type="button"
                      key={team.id}
                      disabled={isTeamFull}
                      onClick={() => {
                        if (!isTeamFull) {
                          setSelectedTeamId(team.id);
                          setJoinError(null);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        isTeamFull
                          ? 'opacity-60 bg-gray-900/90 border-gray-700 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#060CE9] border-[#FFCC00] shadow-md ring-2 ring-[#FFCC00]/50'
                          : 'bg-[#000533] border-blue-900/60 hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm border border-white/40 shrink-0"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-extrabold text-sm text-white">
                          {team.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-300">
                          {team.members.length} / {maxLimit}
                        </span>
                        {isTeamFull && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-sm">
                            Lleno
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {joinError && (
              <div className="p-3 bg-rose-950/90 border-2 border-rose-500 rounded-xl text-xs font-bold text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5">
                Tu Nombre o Apodo
              </label>
              <input
                type="text"
                id="input-player-name"
                required
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setJoinError(null);
                }}
                placeholder="Ej. María, Carlos, Lucas..."
                maxLength={25}
                className="w-full bg-[#000533] border-2 border-blue-600 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]"
              />
            </div>

            <button
              type="submit"
              id="btn-submit-join"
              disabled={isSelectedTeamFull}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-98 border-2 ${
                isSelectedTeamFull
                  ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                  : 'bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] border-white cursor-pointer'
              }`}
            >
              <span>{isSelectedTeamFull ? 'Equipo Completo' : 'Entrar al Concurso'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Switch to host view helper */}
        <div className="text-center pt-4">
          <button
            onClick={onSwitchToHost}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Ver pantalla principal (Proyector)</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 1.5: If joined but host is still on the mandatory setup screen
  if (gameState.status === 'setup') {
    return (
      <div className="min-h-screen bg-[#000533] text-white flex flex-col justify-between p-4 sm:p-6 select-none">
        <div className="w-full max-w-md mx-auto space-y-6 pt-6 text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#060CE9] border-4 border-[#D4AF37] items-center justify-center text-[#FFCC00] font-black text-3xl shadow-[0_0_25px_rgba(255,204,0,0.5)] italic">
            J!
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-[#FFCC00] uppercase font-sans drop-shadow-md">
            {gameState.title}
          </h1>

          <div className="bg-[#000222] border-4 border-[#D4AF37] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-1">
                ¡Registro Confirmado!
              </span>
              <h2 className="text-xl font-black text-white">
                {playerName}
              </h2>
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-black uppercase tracking-wider shadow-md"
              style={{
                borderColor: currentTeam.color,
                backgroundColor: `${currentTeam.color}25`,
              }}
            >
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: currentTeam.color }} />
              <span className="text-white">{currentTeam.name}</span>
            </div>

            <p className="text-xs sm:text-sm text-blue-200 font-semibold leading-relaxed">
              El moderador está realizando la configuración en la pantalla principal. Tu pulsador se activará automáticamente apenas comience el juego.
            </p>

            <div className="pt-3 border-t border-blue-900/80 flex items-center justify-between text-xs text-blue-300 font-bold">
              <span>Integrantes del equipo:</span>
              <span className="text-[#FFCC00] font-black">
                {currentTeam.members.length} / {maxLimit}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLeaveOrChange}
                className="w-full py-2 px-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-600/50 text-xs font-bold transition-colors"
              >
                Cambiar de equipo / Editar datos
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={onSwitchToHost}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Ver pantalla principal (Proyector)</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Main Buzzer Screen
  return (
    <div className="min-h-screen bg-[#000533] text-white flex flex-col justify-between p-3 sm:p-5 select-none overflow-x-hidden">
      {/* Top Bar on Mobile */}
      <div className="w-full max-w-lg mx-auto bg-[#060CE9] rounded-2xl border-2 border-[#D4AF37] p-3 flex items-center justify-between shadow-xl">
        {/* Team & Member badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-white/40"
            style={{ backgroundColor: currentTeam.color }}
          />
          <div className="truncate">
            <h2 className="text-xs sm:text-sm font-black text-white truncate uppercase">
              {currentTeam.name}
            </h2>
            <p className="text-[11px] text-blue-200 truncate">
              Jugador: <strong className="text-white">{playerName}</strong>
            </p>
          </div>
        </div>

        {/* Score & Connection indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-blue-200 block">Puntaje</span>
            <span className="font-mono font-black text-lg sm:text-xl text-[#FFCC00]">
              ${currentTeam.score.toLocaleString()}
            </span>
          </div>

          <div
            title={isConnected ? 'Conectado' : 'Reconectando...'}
            className={`w-3 h-3 rounded-full border border-white ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </div>
      </div>

      {/* Clue Info Banner */}
      <div className="w-full max-w-lg mx-auto my-3 text-center">
        {gameState.activeClue ? (
          <div className="bg-gradient-to-r from-[#060CE9] via-[#000533] to-[#060CE9] border-2 border-[#D4AF37] rounded-2xl p-3.5 shadow-md">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-[#FFCC00] uppercase tracking-wider mb-1">
              <span>{gameState.activeClue.categoryName}</span>
              <span>•</span>
              <span className="font-mono text-white">${gameState.activeClue.value}</span>
            </div>
            <p className="text-sm font-bold text-white line-clamp-3 leading-snug">
              "{gameState.activeClue.question}"
            </p>
          </div>
        ) : (
          <div className="bg-[#000222] border-2 border-blue-900/60 rounded-2xl p-3 text-xs text-blue-300 flex items-center justify-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#FFCC00]" />
            <span>Esperando a que el presentador abra una casilla en el tablero...</span>
          </div>
        )}
      </div>

      {/* Center: THE GIANT BUZZER BUTTON */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center py-4">
        {isMyTeamBuzzed ? (
          /* You won the buzz! Active Answer Form with 10-second writing countdown */
          <div className="w-full bg-white border-4 border-[#FFCC00] rounded-3xl p-5 shadow-[0_0_40px_rgba(255,204,0,0.6)] animate-in zoom-in-95 duration-200 text-center space-y-3.5 text-blue-950">
            <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-0.5 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#060CE9] uppercase tracking-wide">
                ¡GANASTE EL TURNO!
              </h3>
              <p className="text-xs text-blue-900 mt-1 font-semibold">
                Escribe tu respuesta y envíala antes de que termine el tiempo.
              </p>
            </div>

            {/* 10-Second Writing Countdown */}
            {hasSubmittedAnswer || gameState.buzzerState.playerAnswer ? (
              <div className="p-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950">
                <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-wide text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>¡Respuesta enviada a tiempo!</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  Esperando que el presentador califique la respuesta en la pantalla principal.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-inner">
                <div className="flex items-center justify-between mb-1 text-xs font-black uppercase text-amber-950">
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`w-4 h-4 ${
                        (gameState.buzzerState.answerTimeRemaining ?? 10) <= 3
                          ? 'text-red-600 animate-spin'
                          : 'text-amber-600 animate-pulse'
                      }`}
                    />
                    <span>Tiempo para escribir:</span>
                  </div>
                  <span
                    className={`font-mono px-2.5 py-0.5 rounded-lg text-sm font-black ${
                      (gameState.buzzerState.answerTimeRemaining ?? 10) <= 3
                        ? 'bg-red-600 text-white animate-bounce'
                        : (gameState.buzzerState.answerTimeRemaining ?? 10) <= 5
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#060CE9] text-white'
                    }`}
                  >
                    {gameState.buzzerState.answerTimeRemaining ?? 10}s
                  </span>
                </div>

                <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                      (gameState.buzzerState.answerTimeRemaining ?? 10) <= 3
                        ? 'bg-red-600'
                        : (gameState.buzzerState.answerTimeRemaining ?? 10) <= 5
                        ? 'bg-amber-500'
                        : 'bg-[#060CE9]'
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((gameState.buzzerState.answerTimeRemaining ?? 10) / 10) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-red-600 font-black">
                  ⚠️ Si no envías tu respuesta en 10 segundos, será considerada errónea automáticamente.
                </p>
              </div>
            )}

            {/* Answer Form */}
            <form onSubmit={handleAnswerSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full bg-blue-50 border-2 border-[#060CE9] rounded-xl px-4 py-3 text-blue-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
              />

              <button
                type="submit"
                id="btn-submit-player-answer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] font-black text-xs uppercase tracking-wider transition-colors shadow-lg border-2 border-white cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-[#000533]" />
                <span>
                  {hasSubmittedAnswer || gameState.buzzerState.playerAnswer
                    ? 'Actualizar Respuesta Enviada'
                    : `Enviar Respuesta (${gameState.buzzerState.answerTimeRemaining ?? 10}s restantes)`}
                </span>
              </button>
            </form>
          </div>
        ) : (
          /* Main Buzzer Push Button */
          <div className="flex flex-col items-center justify-center w-full">
            <button
              id="btn-player-buzzer"
              disabled={!canBuzz}
              onClick={handleBuzzClick}
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 transition-all duration-150 flex flex-col items-center justify-center shadow-2xl active:scale-90 select-none ${
                canBuzzForWin
                  ? 'bg-gradient-to-b from-red-600 via-rose-600 to-red-700 border-[#FFCC00] shadow-[0_0_60px_rgba(255,204,0,0.7)] cursor-pointer animate-pulse'
                  : canBuzzForRebound
                  ? 'bg-gradient-to-b from-indigo-600 via-purple-600 to-indigo-800 border-[#FFCC00] shadow-[0_0_50px_rgba(147,51,234,0.6)] cursor-pointer hover:scale-105'
                  : isMeInQueue || isMyTeamInQueue
                  ? 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-300 text-white shadow-[0_0_40px_rgba(245,158,11,0.5)] cursor-not-allowed'
                  : hasAlreadyAttempted
                  ? 'bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed'
                  : isMyTeamLocked
                  ? 'bg-rose-950/40 border-rose-900 text-rose-400 cursor-not-allowed'
                  : isOtherTeamBuzzed
                  ? 'bg-[#000222] border-blue-900 text-blue-400 cursor-not-allowed'
                  : 'bg-[#000222] border-[#060CE9]/40 text-blue-300 cursor-not-allowed'
              }`}
            >
              {/* Outer decorative ring */}
              <div className="absolute inset-2 rounded-full border-2 border-white/30 pointer-events-none" />

              {/* Status icon and label */}
              {canBuzzForWin ? (
                <>
                  <Flame className="w-16 h-16 text-[#FFCC00] animate-bounce mb-1" />
                  <span className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                    ¡PULSAR!
                  </span>
                  <span className="text-xs font-black text-[#FFCC00] mt-1 uppercase tracking-widest">
                    Toca para ganar el turno
                  </span>
                </>
              ) : canBuzzForRebound ? (
                <>
                  <Zap className="w-16 h-16 text-[#FFCC00] animate-pulse mb-1" />
                  <span className="text-2xl sm:text-3xl font-black text-white text-center uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-2">
                    ¡PULSAR PARA REBOTE!
                  </span>
                  <span className="text-[11px] font-bold text-amber-200 mt-1 text-center px-4">
                    Asegura tu turno si {otherBuzzedTeam?.name || 'el equipo'} falla
                  </span>
                </>
              ) : isMeInQueue || isMyTeamInQueue ? (
                <>
                  <Zap className="w-14 h-14 text-white mb-1 animate-pulse" />
                  <span className="text-xl sm:text-2xl font-black text-white text-center uppercase tracking-wide px-4">
                    ¡En Cola de Rebote!
                  </span>
                  <span className="text-[11px] text-amber-100 mt-1 text-center px-4 font-semibold">
                    Si el equipo en turno falla, pasarás automáticamente.
                  </span>
                </>
              ) : hasAlreadyAttempted ? (
                <>
                  <ShieldAlert className="w-12 h-12 text-slate-400 mb-1" />
                  <span className="text-sm font-black text-slate-200 text-center px-4 uppercase">
                    Ya respondiste a esta pista
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 text-center px-6 font-semibold">
                    Si hay rebote a tu equipo, debe responder otro compañero distinto.
                  </span>
                </>
              ) : isMyTeamLocked ? (
                <>
                  <AlertCircle className="w-12 h-12 text-rose-400 mb-1" />
                  <span className="text-sm font-black text-rose-200 text-center px-4 uppercase">
                    Tu equipo falló en esta pista
                  </span>
                  <span className="text-[10px] text-rose-300 mt-1 text-center px-6 font-semibold">
                    Bloqueado en esta ronda. Oportunidad pasará a los demás equipos.
                  </span>
                </>
              ) : isOtherTeamBuzzed ? (
                <>
                  <AlertCircle className="w-12 h-12 text-[#FFCC00] mb-1" />
                  <span className="text-base font-black text-white text-center px-4 leading-tight uppercase">
                    ¡{otherBuzzedTeam?.name || 'Otro equipo'} pulsó primero!
                  </span>
                  <span className="text-[11px] text-blue-300 mt-1 font-semibold">
                    Esperando calificación...
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500/40 flex items-center justify-center mb-1">
                    <span className="w-3 h-3 rounded-full bg-blue-400" />
                  </div>
                  <span className="text-lg font-black text-blue-200 uppercase tracking-wide">
                    En Espera
                  </span>
                  <span className="text-[11px] text-blue-300 mt-1 text-center px-6 font-semibold">
                    {gameState.activeClue
                      ? 'El moderador aún no habilita los pulsadores'
                      : 'Esperando selección de casilla'}
                  </span>
                </>
              )}
            </button>

            {/* Quick status text below buzzer */}
            <div className="mt-4 text-center">
              {canBuzzForWin && (
                <p className="text-xs font-black text-[#FFCC00] animate-pulse uppercase tracking-wider">
                  ¡Pulsador Abierto! Sé el primero en presionar.
                </p>
              )}
              {canBuzzForRebound && (
                <p className="text-xs font-black text-purple-200 uppercase tracking-wider">
                  Presiona para colocarte primero en la rotación de rebote.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info & Switcher */}
      <div className="w-full max-w-lg mx-auto pt-2 pb-1 flex items-center justify-between text-xs text-blue-300 border-t border-blue-900/60 font-semibold">
        <button
          onClick={() => {
            localStorage.removeItem('jeopardy_player_joined');
            setHasJoined(false);
          }}
          className="hover:text-[#FFCC00] underline transition-colors"
        >
          Cambiar de Equipo
        </button>

        <button
          onClick={onSwitchToHost}
          className="hover:text-[#FFCC00] flex items-center gap-1 transition-colors"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Vista Pantalla Principal</span>
        </button>
      </div>
    </div>
  );
};
