import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, WSServerMessage } from '../types';
import { soundManager } from '../utils/audio';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const fetchStateRest = useCallback(async () => {
    try {
      const res = await fetch('/api/game/state');
      if (res.ok) {
        const data = await res.json();
        setGameState(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'GET_STATE' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSServerMessage = JSON.parse(event.data);

          if (msg.type === 'STATE_UPDATE') {
            setGameState(msg.state);
          } else if (msg.type === 'BUZZ_WINNER') {
            // Play buzzer sound
            soundManager.playBuzzer();
            if ((msg as any).state) {
              setGameState((msg as any).state);
            }
          } else if (msg.type === 'AUDIO_TRIGGER') {
            if (msg.sound === 'select') soundManager.playSelectClue();
            else if (msg.sound === 'correct') soundManager.playCorrect();
            else if (msg.sound === 'wrong') soundManager.playWrong();
            else if (msg.sound === 'timeup') {
              soundManager.playTimeUp();
              soundManager.playWrong();
            }

            if ((msg as any).state) {
              setGameState((msg as any).state);
            }
          } else if (msg.type === 'GLOBAL_LOGOUT') {
            // Real-time notification for global logout
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('jeopardy-global-logout', { detail: msg.message })
              );
            }
          } else if ((msg as any).type === 'ERROR') {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('jeopardy-error', { detail: (msg as any).message }));
            }
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWs();
        }, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      // Fallback to polling if WS cannot initialize
      fetchStateRest();
    }
  }, [fetchStateRest]);

  useEffect(() => {
    connectWs();
    fetchStateRest();

    // Fallback polling every 5s in case of connection drop
    const interval = window.setInterval(fetchStateRest, 5000);

    return () => {
      window.clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWs, fetchStateRest]);

  // Audio cue sync for active clue think music
  useEffect(() => {
    if (!gameState) return;
    if (
      gameState.activeClue &&
      gameState.activeClue.state === 'buzzing_open' &&
      gameState.settings.soundEnabled
    ) {
      soundManager.startThinkMusic();
    } else {
      soundManager.stopThinkMusic();
    }
  }, [gameState?.activeClue?.state, gameState?.settings?.soundEnabled]);

  const sendAction = useCallback(async (action: string, payload?: any) => {
    // Try sending over WS first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'HOST_ACTION', action, payload }));
    } else {
      // Fallback to REST
      try {
        const res = await fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.state) setGameState(data.state);
        }
      } catch (e) {
        console.error('REST action failed:', e);
      }
    }
  }, []);

  const buzz = useCallback(async (teamId: string, memberName: string) => {
    // WS first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'BUZZ', teamId, memberName, timestamp: Date.now() }));
    } else {
      // REST fallback
      try {
        await fetch('/api/game/buzz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, memberName }),
        });
      } catch (e) {
        console.error('REST buzz failed:', e);
      }
    }
  }, []);

  const submitAnswer = useCallback(async (teamId: string, answer: string, memberName: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SUBMIT_ANSWER', teamId, answer, memberName }));
    } else {
      try {
        await fetch('/api/game/submit-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, answer, memberName }),
        });
      } catch (e) {
        console.error('REST submitAnswer failed:', e);
      }
    }
  }, []);

  const joinTeam = useCallback(async (teamId: string, memberName: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'JOIN_TEAM', teamId, memberName }));
    } else {
      try {
        await fetch('/api/game/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, memberName }),
        });
      } catch (e) {
        console.error('REST joinTeam failed:', e);
      }
    }
  }, []);

  const logoutGlobal = useCallback(async () => {
    // Send over WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'GLOBAL_LOGOUT' }));
    }
    // Also send via REST
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('REST logout failed:', e);
    }
  }, []);

  return {
    gameState,
    isConnected,
    sendAction,
    buzz,
    submitAnswer,
    joinTeam,
    logoutGlobal,
    refreshState: fetchStateRest,
  };
}
