import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Team } from '../types';
import { X, ExternalLink, Copy, Check, Smartphone, Users, Sparkles } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  selectedTeamId?: string;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  teams,
  selectedTeamId,
}) => {
  const [activeTab, setActiveTab] = useState<string>(selectedTeamId || teams[0]?.id || 'team-1');
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTeamId) {
      setActiveTab(selectedTeamId);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (!isOpen) return;

    const baseOrigin = window.location.origin;

    teams.forEach((team) => {
      const joinUrl = `${baseOrigin}/?role=player&team=${team.id}`;
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrUrls((prev) => ({ ...prev, [team.id]: url }));
        })
        .catch((err) => console.error('Error generating QR:', err));
    });
  }, [isOpen, teams]);

  if (!isOpen) return null;

  const currentTeam = teams.find((t) => t.id === activeTab) || teams[0];
  const joinUrl = `${window.location.origin}/?role=player&team=${currentTeam.id}`;

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000533]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#000533] border-4 border-[#D4AF37] rounded-3xl shadow-[0_0_70px_rgba(6,12,233,0.7)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#060CE9] px-6 py-4 border-b-4 border-[#D4AF37] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#000222] border-2 border-[#D4AF37] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#FFCC00]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#FFCC00] uppercase tracking-wide drop-shadow-md">
                Conectar Pulsadores Móviles
              </h2>
              <p className="text-xs text-blue-200 font-semibold">
                Escanea con la cámara del celular para ingresar al juego en tiempo real
              </p>
            </div>
          </div>

          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#000222] hover:bg-[#000533] text-white border border-white/30 hover:border-[#FFCC00] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team selector tabs */}
        <div className="flex border-b-2 border-blue-900 bg-[#000222] p-2 gap-2">
          {teams.map((team) => {
            const isActive = team.id === activeTab;
            return (
              <button
                key={team.id}
                id={`tab-qr-${team.id}`}
                onClick={() => setActiveTab(team.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#060CE9] text-[#FFCC00] shadow-md border-2 border-[#FFCC00]'
                    : 'text-blue-200 hover:text-white hover:bg-blue-900/40'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40"
                  style={{ backgroundColor: team.color }}
                />
                <span className="truncate">{team.name}</span>
                <span className="text-xs font-bold text-white opacity-80">
                  ({team.members.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* QR Display Card */}
        <div className="p-6 flex flex-col md:flex-row items-center gap-6">
          {/* QR Code Canvas/Image */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="p-3 bg-white rounded-2xl shadow-xl border-4"
              style={{ borderColor: currentTeam.color }}
            >
              {qrUrls[currentTeam.id] ? (
                <img
                  src={qrUrls[currentTeam.id]}
                  alt={`QR para ${currentTeam.name}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-500 font-bold">
                  Generando QR...
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <span
                className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-sm border border-white/40"
                style={{ backgroundColor: currentTeam.color }}
              >
                {currentTeam.name}
              </span>
            </div>
          </div>

          {/* Instructions and Actions */}
          <div className="flex-1 flex flex-col justify-between space-y-4 text-left">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FFCC00]" />
                Instrucciones para los Participantes
              </h3>
              <ol className="mt-2 space-y-2 text-xs text-blue-100 font-medium leading-relaxed list-decimal list-inside">
                <li>Abre la cámara o lector de QR en tu smartphone.</li>
                <li>Apunta al código mostrado en pantalla para abrir el enlace.</li>
                <li>Escribe tu nombre y presiona <strong className="text-[#FFCC00]">"Entrar al Concurso"</strong>.</li>
                <li>¡Listo! Tu pantalla se convertirá en un pulsador ultrarrápido sincronizado en vivo.</li>
              </ol>
            </div>

            {/* Members in this team right now */}
            <div className="bg-[#000222] p-3 rounded-xl border-2 border-blue-900/80">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-blue-200 mb-1.5">
                <Users className="w-3.5 h-3.5 text-[#FFCC00]" />
                <span>Jugadores conectados en {currentTeam.name}:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {currentTeam.members.length === 0 ? (
                  <span className="text-xs text-blue-300 italic font-medium">Esperando que escaneen el código...</span>
                ) : (
                  currentTeam.members.map((m) => (
                    <span
                      key={m.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#060CE9]/40 text-white border border-blue-400/50 font-bold"
                    >
                      {m.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                id="btn-copy-join-link"
                onClick={() => handleCopy(joinUrl, currentTeam.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#000222] hover:bg-[#000533] text-white border-2 border-white/20 hover:border-[#FFCC00] font-bold text-xs transition-colors"
              >
                {copiedId === currentTeam.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-blue-300" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>

              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-open-player-tab"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#FFCC00] hover:bg-yellow-300 text-[#000533] font-black text-xs uppercase tracking-wider transition-colors shadow-md border-2 border-white"
              >
                <ExternalLink className="w-4 h-4 text-[#000533]" />
                <span>Abrir en nueva pestaña</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#000222] px-6 py-3 border-t-4 border-[#060CE9] text-center text-xs text-blue-200 font-semibold">
          Tip: En eventos en vivo con proyector, mantén esta ventana visible al inicio para que todos los participantes se conecten antes de empezar la ronda.
        </div>
      </div>
    </div>
  );
};
