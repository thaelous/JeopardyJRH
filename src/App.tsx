/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { TeamScoreBar } from './components/TeamScoreBar';
import { ClueModal } from './components/ClueModal';
import { QRModal } from './components/QRModal';
import { SetupModal } from './components/SetupModal';
import { PlayerView } from './components/PlayerView';
import { QuickSimulator } from './components/QuickSimulator';
import { InitialSetupScreen } from './components/InitialSetupScreen';
import { AuthScreen } from './components/AuthScreen';
import { Loader2, Tv, Smartphone, AlertTriangle, RotateCcw, LogOut } from 'lucide-react';

export default function App() {
  const {
    gameState,
    isConnected,
    sendAction,
    buzz,
    submitAnswer,
    joinTeam,
    logoutGlobal,
  } = useGameState();

  // Role detection: 'host' (projector view) or 'player' (mobile buzzer view)
  const [currentRole, setCurrentRole] = useState<'host' | 'player'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') === 'player' ? 'player' : 'host';
  });

  // Host authentication state - requires 'Altair16'
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('jeopardy_auth_unlocked') === 'true';
  });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  const [initialTeamId, setInitialTeamId] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('team') || undefined;
  });

  // Synchronize authentication if server indicates session is inactive
  useEffect(() => {
    if (gameState && gameState.isSessionActive === false) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('jeopardy_auth_unlocked');
    }
  }, [gameState?.isSessionActive]);

  // Modal states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQRTeamId, setSelectedQRTeamId] = useState<string | undefined>(undefined);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Listen to browser navigation popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentRole(params.get('role') === 'player' ? 'player' : 'host');
      setInitialTeamId(params.get('team') || undefined);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchRole = (role: 'host' | 'player', teamId?: string) => {
    const url = new URL(window.location.href);
    if (role === 'player') {
      url.searchParams.set('role', 'player');
      if (teamId) url.searchParams.set('team', teamId);
    } else {
      url.searchParams.delete('role');
      url.searchParams.delete('team');
    }
    window.history.pushState({}, '', url.toString());
    setCurrentRole(role);
    if (teamId) setInitialTeamId(teamId);
  };

  const handleOpenQR = (teamId?: string) => {
    setSelectedQRTeamId(teamId);
    setIsQRModalOpen(true);
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#000533] flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#060CE9] border-4 border-[#D4AF37] flex items-center justify-center text-[#FFCC00] font-black text-3xl shadow-[0_0_30px_rgba(255,204,0,0.5)] mb-4 italic">
          J!
        </div>
        <h2 className="text-2xl font-black text-[#FFCC00] uppercase tracking-widest italic">
          Jeopardy Live Show
        </h2>
        <p className="text-xs text-blue-200 mt-2 flex items-center gap-1.5 font-bold tracking-wider">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFCC00]" />
          CONECTANDO SERVIDOR EN TIEMPO REAL...
        </p>
      </div>
    );
  }

  // Render Mobile Player View if role is player
  if (currentRole === 'player') {
    return (
      <PlayerView
        gameState={gameState}
        isConnected={isConnected}
        onBuzz={buzz}
        onSubmitAnswer={submitAnswer}
        onJoinTeam={joinTeam}
        onSwitchToHost={() => switchRole('host')}
        initialTeamId={initialTeamId}
      />
    );
  }

  // Mandatory Initial Authentication Screen for Host before any configuration or board
  if (currentRole === 'host' && !isAuthenticated) {
    return (
      <AuthScreen
        onUnlock={() => setIsAuthenticated(true)}
        gameTitle={gameState.title}
      />
    );
  }

  const handleHostLogout = async () => {
    setIsLogoutConfirmOpen(false);
    setIsAuthenticated(false);
    sessionStorage.removeItem('jeopardy_auth_unlocked');
    await logoutGlobal();
  };

  const renderLogoutModal = () => {
    if (!isLogoutConfirmOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-md bg-[#000222] border-4 border-rose-500 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.5)] text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
            <LogOut className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            ¿Cerrar Sesión Global?
          </h3>
          <p className="text-xs sm:text-sm text-blue-200 leading-relaxed font-semibold">
            Al cerrar la sesión, el sistema terminará inmediatamente la sesión del anfitrión y desconectará simultáneamente a <strong>todos los dispositivos móviles de los equipos conectados</strong>, devolviendo la aplicación al bloqueo de contraseña obligatoria.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="btn-cancel-logout"
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider border-2 border-slate-600 transition-colors cursor-pointer"
            >
              Continuar Jugando
            </button>
            <button
              type="button"
              id="btn-confirm-logout"
              onClick={handleHostLogout}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider border-2 border-rose-400 transition-colors shadow-lg shadow-rose-900/50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sí, Cerrar Todo</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mandatory Initial Setup Screen before game starts
  if (gameState.status === 'setup') {
    return (
      <>
        <InitialSetupScreen
          gameState={gameState}
          isConnected={isConnected}
          onStartGame={({ title, categories, teams, settings }) => {
            sendAction('SETUP_GAME', {
              title,
              categories,
              teams,
              settings,
              startImmediately: true,
            });
          }}
          onRemoveMember={(teamId, memberId) => {
            sendAction('REMOVE_MEMBER', { teamId, memberId });
          }}
          onClearMembers={() => {
            sendAction('CLEAR_MEMBERS');
          }}
          onLogout={() => setIsLogoutConfirmOpen(true)}
        />
        {renderLogoutModal()}
      </>
    );
  }

  // Render Projector / Host Board View
  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full bg-[#000533] text-white flex flex-col justify-between overflow-hidden select-none bg-gradient-to-b from-[#000533] via-[#000845] to-[#000b5e]">
      {/* Host Header */}
      <Header
        title={gameState.title}
        isConnected={isConnected}
        onOpenQR={() => handleOpenQR()}
        onOpenSetup={() => setIsSetupModalOpen(true)}
        onReturnToSetup={() => {
          sendAction('RETURN_TO_SETUP');
        }}
        onResetGame={() => setIsResetConfirmOpen(true)}
        onToggleSimulator={() => setIsSimulatorOpen((prev) => !prev)}
        isSimulatorOpen={isSimulatorOpen}
        onLogout={() => setIsLogoutConfirmOpen(true)}
      />

      {/* Main Jeopardy Board - Auto scales within available central viewport */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-center items-center py-1 overflow-hidden bg-gradient-to-b from-[#000533] to-[#000b5e]">
        <Board
          categories={gameState.categories}
          onSelectClue={(categoryId, clueId) => {
            sendAction('SELECT_CLUE', { categoryId, clueId });
          }}
        />
      </main>

      {/* Team Score Bar at Bottom */}
      <TeamScoreBar
        teams={gameState.teams}
        buzzedTeamId={gameState.buzzerState.buzzedTeamId}
        onOpenQR={(teamId) => handleOpenQR(teamId)}
        onAdjustScore={(teamId, delta) => {
          const t = gameState.teams.find((tm) => tm.id === teamId);
          if (t) {
            sendAction('UPDATE_TEAM', { teamId, score: t.score + delta });
          }
        }}
      />

      {/* Clue Detail & Host Judgment Modal */}
      {gameState.activeClue && (
        <ClueModal
          activeClue={gameState.activeClue}
          buzzerState={gameState.buzzerState}
          teams={gameState.teams}
          onJudgeCorrect={() => sendAction('JUDGE_CORRECT')}
          onJudgeWrong={() => sendAction('JUDGE_WRONG')}
          onRevealAnswer={() => sendAction('REVEAL_ANSWER')}
          onCloseClue={() => sendAction('CLOSE_CLUE')}
          onOpenBuzzers={() => sendAction('OPEN_BUZZERS')}
        />
      )}

      {/* QR Codes Modal */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        teams={gameState.teams}
        selectedTeamId={selectedQRTeamId}
      />

      {/* Setup / Excel / Categories Modal */}
      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        currentTitle={gameState.title}
        currentCategories={gameState.categories}
        currentTeams={gameState.teams}
        currentSettings={gameState.settings}
        onSave={({ title, categories, teams, settings }) => {
          sendAction('SETUP_GAME', {
            title,
            categories,
            teams,
            settings,
            startImmediately: false,
          });
        }}
      />

      {/* Quick Testing Simulator Widget */}
      <QuickSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        gameState={gameState}
        onSimulateBuzz={(teamId, memberName) => {
          buzz(teamId, memberName);
        }}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#000222] border-4 border-[#D4AF37] rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-7 h-7 animate-spin-once" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              ¿Reiniciar Concurso?
            </h3>
            <p className="text-xs text-blue-200 leading-relaxed font-semibold">
              Esta acción pondrá los marcadores de todos los equipos en <strong>$0</strong> y reabrirá todas las casillas de pistas en el tablero. Los participantes conectados se mantendrán.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider border-2 border-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-reset"
                onClick={() => {
                  sendAction('RESET_GAME');
                  setIsResetConfirmOpen(false);
                }}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider border-2 border-rose-400 transition-colors shadow-lg shadow-rose-900/50"
              >
                Sí, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Logout Confirmation Modal */}
      {renderLogoutModal()}
    </div>
  );
}
