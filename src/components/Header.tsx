import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  QrCode,
  FileSpreadsheet,
  RotateCcw,
  Maximize2,
  Minimize2,
  Radio,
  Sliders,
  PlaySquare,
  Settings,
  LogOut
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  title: string;
  isConnected: boolean;
  onOpenQR: () => void;
  onOpenSetup: () => void;
  onReturnToSetup?: () => void;
  onResetGame: () => void;
  onToggleSimulator: () => void;
  isSimulatorOpen: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isConnected,
  onOpenQR,
  onOpenSetup,
  onReturnToSetup,
  onResetGame,
  onToggleSimulator,
  isSimulatorOpen,
  onLogout,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSound = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="w-full bg-[#060CE9] border-b-[clamp(2px,0.3vw,4px)] border-[#D4AF37] px-[clamp(0.5rem,1.5vw,2rem)] py-[clamp(0.35rem,0.8vh,0.7rem)] z-30 flex items-center justify-between gap-2 shadow-2xl shrink-0 select-none">
      {/* Brand & Game Title */}
      <div className="flex items-center gap-[clamp(0.5rem,0.9vw,1.2rem)] min-w-0">
        <div className="w-[clamp(2.1rem,2.4vw+0.8vh,3rem)] h-[clamp(2.1rem,2.4vw+0.8vh,3rem)] rounded-[clamp(0.5rem,0.8vw,0.85rem)] bg-white border-2 border-[#D4AF37] flex items-center justify-center text-[#060CE9] font-black text-[clamp(1.1rem,1.4vw+0.4vh,1.6rem)] shadow-[0_0_15px_rgba(255,204,0,0.5)] italic shrink-0">
          J!
        </div>
        <div className="flex flex-col min-w-0">
          <h1
            className="font-black tracking-tighter italic text-[#FFCC00] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans leading-none truncate max-w-[45vw] sm:max-w-[38vw] md:max-w-none"
            style={{
              fontSize: 'clamp(0.95rem, 1.1vw + 0.6vh, 1.85rem)',
            }}
          >
            {title}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-[clamp(0.55rem,0.55vw,0.75rem)] font-bold text-blue-200">
            <span className="tracking-widest uppercase opacity-90 hidden sm:inline">
              LIVE SHOW •
            </span>
            <span className="uppercase tracking-wide">
              {isConnected ? 'SINCRONIZADO' : 'CONECTANDO...'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Actions Bar & Live Status */}
      <div className="flex items-center gap-[clamp(0.35rem,0.6vw,0.75rem)] shrink-0">
        {/* Live Badge indicator */}
        <div
          className="w-[clamp(1.8rem,2vw+0.5vh,2.5rem)] h-[clamp(1.8rem,2vw+0.5vh,2.5rem)] rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg shrink-0 animate-pulse"
          title="Transmisión en directo"
        >
          <span className="text-[clamp(0.55rem,0.5vw,0.75rem)] font-black text-white tracking-tighter">LIVE</span>
        </div>

        {/* QR Access Button */}
        <button
          id="btn-header-qr"
          onClick={onOpenQR}
          className="flex items-center gap-1 px-[clamp(0.5rem,0.7vw,0.9rem)] py-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 border-2 border-white text-[clamp(0.65rem,0.6vw,0.8rem)]"
        >
          <QrCode className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-[#000533]" />
          <span className="hidden sm:inline">Códigos QR</span>
          <span className="sm:hidden">QR</span>
        </button>

        {/* Return to Initial Setup Screen */}
        {onReturnToSetup && (
          <button
            id="btn-header-return-setup"
            onClick={onReturnToSetup}
            title="Volver a la pantalla de configuración obligatoria"
            className="flex items-center gap-1 px-[clamp(0.45rem,0.65vw,0.85rem)] py-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-[#000222]/80 hover:bg-[#000533] text-white border-2 border-white/30 hover:border-[#FFCC00] font-bold transition-colors text-[clamp(0.65rem,0.6vw,0.8rem)]"
          >
            <Settings className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-[#FFCC00]" />
            <span className="hidden md:inline">Configurar Show</span>
            <span className="md:hidden">Config</span>
          </button>
        )}

        {/* Excel / Setup Button */}
        <button
          id="btn-header-setup"
          onClick={onOpenSetup}
          className="flex items-center gap-1 px-[clamp(0.45rem,0.65vw,0.85rem)] py-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-[#000222]/80 hover:bg-[#000533] text-white border-2 border-white/30 hover:border-[#FFCC00] font-bold transition-colors text-[clamp(0.65rem,0.6vw,0.8rem)]"
        >
          <FileSpreadsheet className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-[#FFCC00]" />
          <span className="hidden lg:inline">Cargar Preguntas</span>
          <span className="lg:hidden">Preguntas</span>
        </button>

        {/* Simulator Toggle */}
        <button
          id="btn-header-simulator"
          onClick={onToggleSimulator}
          title="Abrir simulador rápido de pulsadores para pruebas"
          className={`flex items-center gap-1 px-[clamp(0.45rem,0.65vw,0.85rem)] py-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] border-2 transition-colors text-[clamp(0.65rem,0.6vw,0.8rem)] ${
            isSimulatorOpen
              ? 'bg-[#FFCC00] text-[#000533] border-white shadow-md font-black'
              : 'bg-[#000222]/80 hover:bg-[#000533] border-white/30 text-blue-200'
          }`}
        >
          <PlaySquare className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-[#FFCC00]" />
          <span className="hidden xl:inline">Simulador</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-header-sound"
          onClick={toggleSound}
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
          className="p-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-[#000222]/80 hover:bg-[#000533] text-white border-2 border-white/30 hover:border-[#FFCC00] transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-rose-400" />
          ) : (
            <Volume2 className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)] text-[#FFCC00]" />
          )}
        </button>

        {/* Reset Game */}
        <button
          id="btn-header-reset"
          onClick={onResetGame}
          title="Reiniciar marcadores y casillas"
          className="p-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-[#000222]/80 hover:bg-rose-950/70 text-slate-300 hover:text-rose-400 border-2 border-white/30 hover:border-rose-600 transition-colors"
        >
          <RotateCcw className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)]" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          id="btn-header-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          className="p-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-[#000222]/80 hover:bg-[#000533] text-white border-2 border-white/30 hover:border-[#FFCC00] transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)]" />
          ) : (
            <Maximize2 className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)]" />
          )}
        </button>

        {/* Global Logout Button for Host */}
        <button
          id="btn-header-logout"
          onClick={onLogout}
          title="Cerrar sesión del anfitrión y desconectar todos los dispositivos"
          className="flex items-center gap-1.5 px-[clamp(0.5rem,0.75vw,1rem)] py-[clamp(0.35rem,0.5vh,0.55rem)] rounded-[clamp(0.4rem,0.6vw,0.75rem)] bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider transition-all shadow-lg shadow-rose-950/50 active:scale-95 border-2 border-rose-300 text-[clamp(0.65rem,0.6vw,0.8rem)] cursor-pointer"
        >
          <LogOut className="w-[clamp(0.85rem,0.9vw,1.1rem)] h-[clamp(0.85rem,0.9vw,1.1rem)]" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
          <span className="sm:hidden">Salir</span>
        </button>
      </div>
    </header>
  );
};
