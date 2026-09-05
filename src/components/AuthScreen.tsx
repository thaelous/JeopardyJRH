import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Tv,
  Smartphone
} from 'lucide-react';

interface AuthScreenProps {
  onUnlock: () => void;
  gameTitle?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock, gameTitle }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Auto-focus input on mount
  useEffect(() => {
    const input = document.getElementById('auth-password-input');
    if (input) input.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, ingresa la contraseña requerida.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate with server
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // Success: persist host session in sessionStorage
        sessionStorage.setItem('jeopardy_auth_unlocked', 'true');
        onUnlock();
      } else {
        setError(data.error || 'Contraseña incorrecta. Acceso denegado.');
        triggerShake();
        setPassword('');
      }
    } catch {
      // Fallback local check if network fails
      if (password.trim() === 'Altair16') {
        sessionStorage.setItem('jeopardy_auth_unlocked', 'true');
        onUnlock();
      } else {
        setError('Contraseña incorrecta. Acceso denegado.');
        triggerShake();
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#000533] bg-gradient-to-b from-[#000533] via-[#000845] to-[#000b5e] flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-[#060CE9]/20 rounded-full blur-[120px]" />
        <div className="w-[300px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[90px]" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Security Card */}
        <div
          className={`bg-[#000222]/95 border-4 border-[#D4AF37] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,12,233,0.5)] backdrop-blur-md transition-all duration-300 ${
            isShaking ? 'animate-bounce border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.6)]' : ''
          }`}
        >
          {/* Header & Emblem */}
          <div className="text-center flex flex-col items-center space-y-3 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#060CE9] to-[#000533] border-4 border-[#D4AF37] flex items-center justify-center text-[#FFCC00] font-black text-4xl shadow-[0_0_25px_rgba(255,204,0,0.5)] italic">
                J!
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#D4AF37] border-2 border-[#000222] flex items-center justify-center text-[#000222] shadow-md">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#000533] px-3.5 py-1 rounded-full border border-[#D4AF37]/60 text-[11px] font-black uppercase tracking-widest text-[#FFCC00]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autenticación Obligatoria de Seguridad</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">
              Panel del Anfitrión
            </h1>

            <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed max-w-sm">
              Ingresa la clave de anfitrión requerida para desbloquear el sistema de concurso y acceder al control del juego.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              id="auth-error-banner"
              className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs font-bold leading-tight">
                <span className="block font-black text-white uppercase tracking-wider">
                  Acceso Denegado
                </span>
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-black uppercase tracking-wider text-[#FFCC00] mb-2 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Contraseña de Desbloqueo
              </label>

              <div className="relative">
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Introduce la clave de acceso..."
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-[#000533] border-2 border-white/40 focus:border-[#FFCC00] focus:ring-4 focus:ring-[#FFCC00]/20 rounded-2xl px-4 py-3.5 pr-12 text-white font-mono text-base placeholder-blue-300/50 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-300 hover:text-white transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-auth"
              disabled={isLoading || !password.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFCC00] to-[#D4AF37] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-[#000533] font-black text-sm uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,204,0,0.4)] border-2 border-white flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando Clave...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Desbloquear Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Footer details */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-[11px] text-blue-200 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>Conexión cifrada y sincronización en tiempo real</span>
            </div>
            <p className="text-[10px] text-blue-300/60 leading-normal">
              El cierre de sesión del anfitrión desconectará simultáneamente a todos los dispositivos móviles conectados.
            </p>
          </div>
        </div>

        {/* Quick alternative role switch */}
        <div className="mt-4 text-center">
          <a
            href="?role=player"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-[#FFCC00] transition-colors underline underline-offset-4"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>¿Eres participante? Ir a la vista de pulsador móvil</span>
          </a>
        </div>
      </div>
    </div>
  );
};
