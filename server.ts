import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

// Types and default data
interface TeamMember {
  id: string;
  name: string;
  joinedAt: number;
}

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  members: TeamMember[];
}

interface Clue {
  id: string;
  value: number;
  question: string;
  answer: string;
  isAnswered: boolean;
  answeredByTeamId: string | null;
}

interface Category {
  id: string;
  name: string;
  clues: Clue[];
}

type ClueState = 'reading' | 'buzzing_open' | 'buzzed' | 'revealed' | 'closed';

interface ActiveClue {
  categoryId: string;
  categoryName: string;
  clueId: string;
  value: number;
  question: string;
  answer: string;
  timeRemaining: number;
  state: ClueState;
}

interface QueuedBuzz {
  teamId: string;
  memberName: string;
  timestamp: number;
}

interface BuzzerState {
  isOpen: boolean;
  buzzedTeamId: string | null;
  buzzedPlayerName: string | null;
  buzzedAt: number | null;
  answerTimeLimit?: number; // 10 seconds limit to write answer
  answerTimeRemaining?: number; // Countdown seconds remaining
  answerSubmittedAt?: number | null;
  playerAnswer: string | null;
  lockedTeams: string[];
  attemptedMembers?: string[];
  buzzQueue?: QueuedBuzz[];
  reboundRound?: number;
}

interface GameSettings {
  timerSeconds: number;
  soundEnabled: boolean;
  penalizeWrongAnswer: boolean;
  maxPlayersPerTeam: number;
}

interface GameLog {
  id: string;
  text: string;
  timestamp: number;
  type?: 'info' | 'buzz' | 'correct' | 'wrong' | 'system';
}

interface GameState {
  title: string;
  status: 'setup' | 'playing' | 'game_over';
  teams: Team[];
  categories: Category[];
  activeClue: ActiveClue | null;
  buzzerState: BuzzerState;
  settings: GameSettings;
  recentLogs: GameLog[];
  lastUpdate: number;
  isSessionActive: boolean;
}

const REQUIRED_PASSWORD = 'Altair16';
let isSessionActive = false;

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Equipo Rojo', color: '#ef4444', score: 0, members: [] },
  { id: 'team-2', name: 'Equipo Azul', color: '#3b82f6', score: 0, members: [] },
  { id: 'team-3', name: 'Equipo Verde', color: '#10b981', score: 0, members: [] },
  { id: 'team-4', name: 'Equipo Amarillo', color: '#f59e0b', score: 0, members: [] },
  { id: 'team-5', name: 'Equipo Morado', color: '#8b5cf6', score: 0, members: [] },
];

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-tech',
    name: 'Tecnología & Web',
    clues: [
      { id: 'tech-100', value: 100, question: 'Palabra clave de ES6 para declarar variables inmutables con alcance de bloque.', answer: 'const', isAnswered: false, answeredByTeamId: null },
      { id: 'tech-200', value: 200, question: 'Objeto de JavaScript que representa el resultado eventual de una operación asíncrona.', answer: 'Promise', isAnswered: false, answeredByTeamId: null },
      { id: 'tech-300', value: 300, question: 'Hook de React utilizado para ejecutar efectos secundarios en componentes funcionales.', answer: 'useEffect', isAnswered: false, answeredByTeamId: null },
      { id: 'tech-400', value: 400, question: 'Protocolo de transporte con conexión y garantía de entrega en la capa 4 de OSI.', answer: 'TCP', isAnswered: false, answeredByTeamId: null },
      { id: 'tech-500', value: 500, question: 'Protocolo full-duplex sobre un único socket TCP para mensajería en tiempo real.', answer: 'WebSocket', isAnswered: false, answeredByTeamId: null },
    ],
  },
  {
    id: 'cat-history',
    name: 'Historia Universal',
    clues: [
      { id: 'hist-100', value: 100, question: 'Año de la llegada de Cristóbal Colón al continente americano.', answer: '1492', isAnswered: false, answeredByTeamId: null },
      { id: 'hist-200', value: 200, question: 'Imperio que erigió el Coliseo y se expandió por toda la cuenca del Mediterráneo.', answer: 'Imperio Romano', isAnswered: false, answeredByTeamId: null },
      { id: 'hist-300', value: 300, question: 'Ciudadela incaica en los Andes peruanos redescubierta por Hiram Bingham en 1911.', answer: 'Machu Picchu', isAnswered: false, answeredByTeamId: null },
      { id: 'hist-400', value: 400, question: 'Muro que dividió la capital alemana durante la Guerra Fría y cayó en 1989.', answer: 'Muro de Berlín', isAnswered: false, answeredByTeamId: null },
      { id: 'hist-500', value: 500, question: 'General cartaginés que atravesó los Alpes con elefantes para atacar a Roma.', answer: 'Aníbal Barca', isAnswered: false, answeredByTeamId: null },
    ],
  },
  {
    id: 'cat-science',
    name: 'Ciencia & Planeta',
    clues: [
      { id: 'sci-100', value: 100, question: 'Planeta del Sistema Solar conocido popularmente como el Planeta Rojo.', answer: 'Marte', isAnswered: false, answeredByTeamId: null },
      { id: 'sci-200', value: 200, question: 'Proceso por el cual las plantas producen glucosa usando la luz del sol.', answer: 'Fotosíntesis', isAnswered: false, answeredByTeamId: null },
      { id: 'sci-300', value: 300, question: 'Elemento químico más abundante en el universo y número atómico 1.', answer: 'Hidrógeno', isAnswered: false, answeredByTeamId: null },
      { id: 'sci-400', value: 400, question: 'Partícula subatómica de carga eléctrica negativa que orbita el núcleo.', answer: 'Electrón', isAnswered: false, answeredByTeamId: null },
      { id: 'sci-500', value: 500, question: 'Primera persona en obtener dos Premios Nobel en disciplinas científicas distintas.', answer: 'Marie Curie', isAnswered: false, answeredByTeamId: null },
    ],
  },
  {
    id: 'cat-geo',
    name: 'Geografía del Mundo',
    clues: [
      { id: 'geo-100', value: 100, question: 'El río más caudaloso y largo del mundo, ubicado en América del Sur.', answer: 'Río Amazonas', isAnswered: false, answeredByTeamId: null },
      { id: 'geo-200', value: 200, question: 'País con mayor superficie territorial del planeta.', answer: 'Rusia', isAnswered: false, answeredByTeamId: null },
      { id: 'geo-300', value: 300, question: 'Montaña más alta del mundo con 8,848 metros sobre el nivel del mar.', answer: 'Monte Everest', isAnswered: false, answeredByTeamId: null },
      { id: 'geo-400', value: 400, question: 'Capital del Japón y una de las metrópolis más pobladas de la Tierra.', answer: 'Tokio', isAnswered: false, answeredByTeamId: null },
      { id: 'geo-500', value: 500, question: 'Paso marítimo que conecta el mar Mediterráneo con el océano Atlántico.', answer: 'Estrecho de Gibraltar', isAnswered: false, answeredByTeamId: null },
    ],
  },
  {
    id: 'cat-culture',
    name: 'Cultura & Arte',
    clues: [
      { id: 'cul-100', value: 100, question: 'Autor español creador de Don Quijote de la Mancha.', answer: 'Miguel de Cervantes', isAnswered: false, answeredByTeamId: null },
      { id: 'cul-200', value: 200, question: 'Pintura renacentista de Leonardo da Vinci resguardada en el Museo del Louvre.', answer: 'La Mona Lisa', isAnswered: false, answeredByTeamId: null },
      { id: 'cul-300', value: 300, question: 'Compositor de la Novena Sinfonía y el Himno a la Alegría.', answer: 'Beethoven', isAnswered: false, answeredByTeamId: null },
      { id: 'cul-400', value: 400, question: 'Pintor neerlandés postimpresionista autor de La noche estrellada.', answer: 'Vincent van Gogh', isAnswered: false, answeredByTeamId: null },
      { id: 'cul-500', value: 500, question: 'Director de cine responsable de E.T., Tiburón y Jurassic Park.', answer: 'Steven Spielberg', isAnswered: false, answeredByTeamId: null },
    ],
  },
];

let gameState: GameState = {
  title: 'Jeopardy de Matemáticas y Conocimiento',
  status: 'setup',
  teams: JSON.parse(JSON.stringify(DEFAULT_TEAMS)),
  categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
  activeClue: null,
  buzzerState: {
    isOpen: false,
    buzzedTeamId: null,
    buzzedPlayerName: null,
    buzzedAt: null,
    answerTimeLimit: 10,
    answerTimeRemaining: 10,
    answerSubmittedAt: null,
    playerAnswer: null,
    lockedTeams: [],
    attemptedMembers: [],
    buzzQueue: [],
    reboundRound: 1,
  },
  settings: {
    timerSeconds: 15,
    soundEnabled: true,
    penalizeWrongAnswer: true,
    maxPlayersPerTeam: 5,
  },
  recentLogs: [
    { id: 'log-0', text: 'Sistema de Jeopardy protegido. Ingrese contraseña de anfitrión para iniciar.', timestamp: Date.now(), type: 'system' }
  ],
  lastUpdate: Date.now(),
  isSessionActive: false,
};

function addLog(text: string, type: GameLog['type'] = 'info') {
  gameState.recentLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    text,
    timestamp: Date.now(),
    type,
  });
  if (gameState.recentLogs.length > 30) {
    gameState.recentLogs = gameState.recentLogs.slice(0, 30);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Broadcast state to all connected clients
  function broadcast(customMessage?: Record<string, unknown>) {
    gameState.lastUpdate = Date.now();
    const payload = JSON.stringify(customMessage || { type: 'STATE_UPDATE', state: gameState });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  let answerTimerInterval: NodeJS.Timeout | null = null;

  function stopAnswerTimer() {
    if (answerTimerInterval) {
      clearInterval(answerTimerInterval);
      answerTimerInterval = null;
    }
  }

  function startAnswerTimer() {
    stopAnswerTimer();
    gameState.buzzerState.answerTimeLimit = 10;
    gameState.buzzerState.answerTimeRemaining = 10;
    gameState.buzzerState.answerSubmittedAt = null;

    answerTimerInterval = setInterval(() => {
      // Guard: must be in buzzed state and have an active clue and buzzed team
      if (
        !gameState.activeClue ||
        gameState.activeClue.state !== 'buzzed' ||
        !gameState.buzzerState.buzzedTeamId
      ) {
        stopAnswerTimer();
        return;
      }

      // If player already submitted an answer, stop the countdown so they are safe from timeout
      if (gameState.buzzerState.playerAnswer && gameState.buzzerState.answerSubmittedAt) {
        stopAnswerTimer();
        return;
      }

      if (typeof gameState.buzzerState.answerTimeRemaining !== 'number') {
        gameState.buzzerState.answerTimeRemaining = 10;
      }

      gameState.buzzerState.answerTimeRemaining -= 1;

      if (gameState.buzzerState.answerTimeRemaining <= 0) {
        gameState.buzzerState.answerTimeRemaining = 0;
        stopAnswerTimer();
        handleAnswerTimeout();
      } else {
        broadcast();
      }
    }, 1000);
  }

  function handleAnswerTimeout() {
    if (!gameState.activeClue || !gameState.buzzerState.buzzedTeamId) return;

    const failedTeamId = gameState.buzzerState.buzzedTeamId;
    const failedPlayerName = gameState.buzzerState.buzzedPlayerName || 'Participante';
    const team = gameState.teams.find((t) => t.id === failedTeamId);
    const teamName = team ? team.name : 'Equipo';

    addLog(
      `¡TIEMPO AGOTADO! (10s) ${failedPlayerName} (${teamName}) no escribió la respuesta a tiempo. Se califica como ERRÓNEA.`,
      'wrong'
    );

    executeJudgeWrong(true);
  }

  function executeJudgeWrong(isTimeout = false) {
    stopAnswerTimer();
    if (gameState.activeClue && gameState.buzzerState.buzzedTeamId) {
      const failedTeamId = gameState.buzzerState.buzzedTeamId;
      const failedPlayerName = gameState.buzzerState.buzzedPlayerName;
      const team = gameState.teams.find((t) => t.id === failedTeamId);

      if (team && gameState.settings.penalizeWrongAnswer) {
        team.score -= gameState.activeClue.value;
        if (isTimeout) {
          addLog(
            `Tiempo agotado para escribir (10s) en ${team.name}. Respuesta errónea. (-$${gameState.activeClue.value} pts)`,
            'wrong'
          );
        } else {
          addLog(`Respuesta incorrecta de ${team.name}. (-$${gameState.activeClue.value} pts)`, 'wrong');
        }
      } else if (team) {
        if (isTimeout) {
          addLog(`Tiempo agotado para escribir (10s) en ${team.name}. Respuesta errónea. (Sin penalización)`, 'wrong');
        } else {
          addLog(`Respuesta incorrecta de ${team.name}. (Sin penalización)`, 'wrong');
        }
      }

      // 1. Bloqueo por error en equipo: Lock the entire team for the rest of this rebound cycle
      if (!gameState.buzzerState.lockedTeams) gameState.buzzerState.lockedTeams = [];
      if (!gameState.buzzerState.lockedTeams.includes(failedTeamId)) {
        gameState.buzzerState.lockedTeams.push(failedTeamId);
      }

      // 2. Track specific participant who failed so they cannot re-answer the same clue
      if (!gameState.buzzerState.attemptedMembers) gameState.buzzerState.attemptedMembers = [];
      if (failedPlayerName && !gameState.buzzerState.attemptedMembers.includes(failedPlayerName)) {
        gameState.buzzerState.attemptedMembers.push(failedPlayerName);
      }

      // 3. Remove any queued buzz from the failed team
      if (!gameState.buzzerState.buzzQueue) gameState.buzzerState.buzzQueue = [];
      gameState.buzzerState.buzzQueue = gameState.buzzerState.buzzQueue.filter(
        (q) => q.teamId !== failedTeamId
      );

      // 4. Rotación de turnos entre equipos (Rebote): check if another team is already queued
      const nextQueueIndex = gameState.buzzerState.buzzQueue.findIndex((q) => {
        const isLocked = gameState.buzzerState.lockedTeams.includes(q.teamId);
        const isAttempted = gameState.buzzerState.attemptedMembers.includes(q.memberName);
        return !isLocked && !isAttempted;
      });

      if (nextQueueIndex !== -1) {
        const nextBuzz = gameState.buzzerState.buzzQueue.splice(nextQueueIndex, 1)[0];
        const nextTeam = gameState.teams.find((t) => t.id === nextBuzz.teamId);

        gameState.buzzerState.isOpen = false;
        gameState.buzzerState.buzzedTeamId = nextBuzz.teamId;
        gameState.buzzerState.buzzedPlayerName = nextBuzz.memberName;
        gameState.buzzerState.buzzedAt = Date.now();
        gameState.buzzerState.answerTimeLimit = 10;
        gameState.buzzerState.answerTimeRemaining = 10;
        gameState.buzzerState.answerSubmittedAt = null;
        gameState.buzzerState.playerAnswer = null;
        gameState.activeClue.state = 'buzzed';

        addLog(
          `¡Rebote automático! Turno para ${nextBuzz.memberName} (${nextTeam?.name || 'Equipo'}). Tiene 10s para escribir la respuesta.`,
          'buzz'
        );

        startAnswerTimer();

        broadcast({
          type: 'BUZZ_WINNER',
          teamId: nextBuzz.teamId,
          memberName: nextBuzz.memberName,
          timestamp: Date.now(),
          state: gameState,
        });
        return;
      }

      // 5. No one in queue: check remaining eligible teams in this cycle
      const eligibleTeams = gameState.teams.filter(
        (t) => !gameState.buzzerState.lockedTeams.includes(t.id)
      );

      if (eligibleTeams.length > 0) {
        // Re-open buzzers for the remaining teams (e.g. Segundo o Tercer equipo)
        gameState.buzzerState.isOpen = true;
        gameState.buzzerState.buzzedTeamId = null;
        gameState.buzzerState.buzzedPlayerName = null;
        gameState.buzzerState.answerTimeLimit = 10;
        gameState.buzzerState.answerTimeRemaining = 10;
        gameState.buzzerState.answerSubmittedAt = null;
        gameState.buzzerState.playerAnswer = null;
        gameState.activeClue.state = 'buzzing_open';

        addLog(
          `Pulsadores habilitados por rebote para: ${eligibleTeams.map((t) => t.name).join(', ')}.`,
          'info'
        );
        broadcast({
          type: 'AUDIO_TRIGGER',
          sound: isTimeout ? 'timeup' : 'wrong',
          state: gameState,
        });
        return;
      }

      // 6. Regreso de oportunidades al primer equipo:
      const teamsWithNewMembers = gameState.teams.filter((t) => {
        if (t.members && t.members.length > 0) {
          return t.members.some(
            (m) => !gameState.buzzerState.attemptedMembers.includes(m.name.trim())
          );
        }
        return true;
      });

      if (teamsWithNewMembers.length > 0) {
        gameState.buzzerState.lockedTeams = [];
        gameState.buzzerState.reboundRound = (gameState.buzzerState.reboundRound || 1) + 1;
        gameState.buzzerState.isOpen = true;
        gameState.buzzerState.buzzedTeamId = null;
        gameState.buzzerState.buzzedPlayerName = null;
        gameState.buzzerState.answerTimeLimit = 10;
        gameState.buzzerState.answerTimeRemaining = 10;
        gameState.buzzerState.answerSubmittedAt = null;
        gameState.buzzerState.playerAnswer = null;
        gameState.activeClue.state = 'buzzing_open';

        addLog(
          `¡Todos los equipos fallaron! Se reactiva la oportunidad para integrantes DISTINTOS (Ronda ${gameState.buzzerState.reboundRound}).`,
          'info'
        );
        broadcast({
          type: 'AUDIO_TRIGGER',
          sound: isTimeout ? 'timeup' : 'wrong',
          state: gameState,
        });
      } else {
        // All possible members have attempted and failed -> Reveal answer
        gameState.buzzerState.isOpen = false;
        gameState.buzzerState.buzzedTeamId = null;
        gameState.buzzerState.buzzedPlayerName = null;
        gameState.buzzerState.playerAnswer = null;
        gameState.buzzerState.answerSubmittedAt = null;
        gameState.activeClue.state = 'revealed';
        for (const cat of gameState.categories) {
          const cl = cat.clues.find((c) => c.id === gameState.activeClue!.clueId);
          if (cl) {
            cl.isAnswered = true;
            break;
          }
        }
        addLog(`Todos los equipos e integrantes agotaron sus intentos. Respuesta revelada.`, 'wrong');
        broadcast({
          type: 'AUDIO_TRIGGER',
          sound: isTimeout ? 'timeup' : 'wrong',
          state: gameState,
        });
      }
    }
  }

  wss.on('connection', (ws) => {
    // Send full current state on connection
    ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: gameState }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleAction(msg, ws);
      } catch (e) {
        console.error('Error handling WS message:', e);
      }
    });
  });

  function handleAction(msg: Record<string, any>, clientWs?: WebSocket) {
    const type = msg.type;

    if (type === 'GLOBAL_LOGOUT' || (type === 'HOST_ACTION' && msg.action === 'GLOBAL_LOGOUT')) {
      stopAnswerTimer();
      isSessionActive = false;
      gameState.isSessionActive = false;
      // Kick all team members and reset state
      gameState.teams.forEach((t) => {
        t.members = [];
      });
      gameState.activeClue = null;
      gameState.buzzerState = {
        isOpen: false,
        buzzedTeamId: null,
        buzzedPlayerName: null,
        buzzedAt: null,
        answerTimeLimit: 10,
        answerTimeRemaining: 10,
        answerSubmittedAt: null,
        playerAnswer: null,
        lockedTeams: [],
        attemptedMembers: [],
        buzzQueue: [],
        reboundRound: 1,
      };
      addLog('El anfitrión ha cerrado la sesión global. Todos los participantes han sido desconectados.', 'system');

      // Send termination signal to all sockets
      broadcast({
        type: 'GLOBAL_LOGOUT',
        message: 'El anfitrión ha cerrado la sesión global del concurso.',
      });
      // Also broadcast cleared state
      broadcast();
      return;
    }

    if (type === 'GET_STATE') {
      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'STATE_UPDATE', state: gameState }));
      }
      return;
    }

    if (type === 'JOIN_TEAM') {
      if (!isSessionActive) {
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'ERROR',
              message: 'El anfitrión no ha iniciado sesión o la sesión ha sido cerrada.',
            })
          );
        }
        return;
      }
      const { teamId, memberName } = msg;
      if (!teamId || !memberName) return;
      const team = gameState.teams.find((t) => t.id === teamId);
      if (team) {
        const cleanName = memberName.trim();
        const maxLimit = gameState.settings.maxPlayersPerTeam || 5;

        // Check if player is already registered in this team
        const existingInThisTeam = team.members.find(
          (m) => m.name.trim().toLowerCase() === cleanName.toLowerCase()
        );

        if (existingInThisTeam) {
          // Re-connecting or refreshing: keep member and update timestamp
          existingInThisTeam.joinedAt = Date.now();
          broadcast();
          return;
        }

        // Check team limit for new members
        if (maxLimit > 0 && team.members.length >= maxLimit) {
          if (clientWs && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'ERROR',
                message: `El ${team.name} ya está completo (límite de ${maxLimit} participantes alcanzado).`,
              })
            );
          }
          return;
        }

        // If player previously joined a different team, remove them from that team
        gameState.teams.forEach((otherTeam) => {
          if (otherTeam.id !== teamId) {
            otherTeam.members = otherTeam.members.filter(
              (m) => m.name.trim().toLowerCase() !== cleanName.toLowerCase()
            );
          }
        });

        // Add to team
        team.members.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: cleanName,
          joinedAt: Date.now(),
        });
        addLog(`${cleanName} se unió al ${team.name} (${team.members.length}/${maxLimit}).`, 'info');
        broadcast();
      }
      return;
    }

    if (type === 'BUZZ') {
      const { teamId, memberName } = msg;
      if (!gameState.activeClue) return;

      const cleanMember = (memberName || '').trim();
      const team = gameState.teams.find((t) => t.id === teamId);
      if (!team) return;

      // 1. Check if this specific participant has already given a wrong answer for this clue
      if (gameState.buzzerState.attemptedMembers && gameState.buzzerState.attemptedMembers.includes(cleanMember)) {
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'ERROR',
              message: `Ya diste una respuesta incorrecta a esta pista (${cleanMember}). Debe responder un integrante distinto de tu equipo.`,
            })
          );
        }
        return;
      }

      // 2. Check if this team is locked out for the current cycle
      if (gameState.buzzerState.lockedTeams && gameState.buzzerState.lockedTeams.includes(teamId)) {
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'ERROR',
              message: `El ${team.name} está bloqueado temporalmente por error previo. Esperando turno o rebote de los demás equipos.`,
            })
          );
        }
        return;
      }

      // 3. Case A: Buzzers are open and no one has buzzed yet -> First buzzed team!
      if (gameState.buzzerState.isOpen && gameState.buzzerState.buzzedTeamId === null) {
        gameState.buzzerState.isOpen = false;
        gameState.buzzerState.buzzedTeamId = teamId;
        gameState.buzzerState.buzzedPlayerName = cleanMember || team.name;
        gameState.buzzerState.buzzedAt = Date.now();
        gameState.buzzerState.answerTimeLimit = 10;
        gameState.buzzerState.answerTimeRemaining = 10;
        gameState.buzzerState.answerSubmittedAt = null;
        gameState.buzzerState.playerAnswer = null;
        if (gameState.activeClue) {
          gameState.activeClue.state = 'buzzed';
        }

        addLog(
          `¡${gameState.buzzerState.buzzedPlayerName} (${team.name}) pulsó primero! Tiene 10 segundos para escribir su respuesta.`,
          'buzz'
        );

        startAnswerTimer();

        broadcast({
          type: 'BUZZ_WINNER',
          teamId,
          memberName: gameState.buzzerState.buzzedPlayerName,
          timestamp: Date.now(),
          state: gameState,
        });
        return;
      }

      // 4. Case B: Someone already has the turn, but this player is from a DIFFERENT eligible team -> Enqueue for automatic rebound!
      if (gameState.buzzerState.buzzedTeamId !== null && gameState.buzzerState.buzzedTeamId !== teamId) {
        if (!gameState.buzzerState.buzzQueue) {
          gameState.buzzerState.buzzQueue = [];
        }

        const alreadyQueuedForTeam = gameState.buzzerState.buzzQueue.some((q) => q.teamId === teamId);
        if (!alreadyQueuedForTeam) {
          gameState.buzzerState.buzzQueue.push({
            teamId,
            memberName: cleanMember || team.name,
            timestamp: Date.now(),
          });
          addLog(
            `¡${cleanMember || team.name} (${team.name}) quedó en cola de rebote automático!`,
            'info'
          );
          broadcast();
        }
        return;
      }

      return;
    }

    if (type === 'SUBMIT_ANSWER') {
      const { teamId, answer } = msg;
      if (gameState.buzzerState.buzzedTeamId === teamId) {
        const cleanAnswer = (answer || '').trim();
        if (cleanAnswer.length > 0) {
          gameState.buzzerState.playerAnswer = cleanAnswer;
          gameState.buzzerState.answerSubmittedAt = Date.now();
          stopAnswerTimer();
          addLog(
            `Respuesta escrita a tiempo (${10 - (gameState.buzzerState.answerTimeRemaining ?? 0)}s) por ${gameState.buzzerState.buzzedPlayerName}: "${cleanAnswer}"`,
            'info'
          );
          broadcast();
        }
      }
      return;
    }

    if (type === 'HOST_ACTION') {
      const action = msg.action;
      const payload = msg.payload || {};

      switch (action) {
        case 'SELECT_CLUE': {
          const { categoryId, clueId } = payload;
          const category = gameState.categories.find((c) => c.id === categoryId);
          const clue = category?.clues.find((cl) => cl.id === clueId);
          if (clue && !clue.isAnswered) {
            gameState.activeClue = {
              categoryId,
              categoryName: category!.name,
              clueId,
              value: clue.value,
              question: clue.question,
              answer: clue.answer,
              timeRemaining: gameState.settings.timerSeconds,
              state: 'buzzing_open',
            };
            gameState.buzzerState = {
              isOpen: true,
              buzzedTeamId: null,
              buzzedPlayerName: null,
              buzzedAt: null,
              playerAnswer: null,
              lockedTeams: [],
              attemptedMembers: [],
              buzzQueue: [],
              reboundRound: 1,
            };
            addLog(`Pista seleccionada: [${category!.name}] por $${clue.value}`, 'info');
            broadcast({ type: 'AUDIO_TRIGGER', sound: 'select', state: gameState });
          }
          break;
        }

        case 'OPEN_BUZZERS': {
          stopAnswerTimer();
          if (gameState.activeClue) {
            gameState.buzzerState.isOpen = true;
            gameState.buzzerState.buzzedTeamId = null;
            gameState.buzzerState.buzzedPlayerName = null;
            gameState.buzzerState.playerAnswer = null;
            gameState.buzzerState.answerSubmittedAt = null;
            gameState.buzzerState.answerTimeLimit = 10;
            gameState.buzzerState.answerTimeRemaining = 10;
            gameState.activeClue.state = 'buzzing_open';
            addLog('¡Pulsadores habilitados! Corran a pulsar.', 'info');
            broadcast();
          }
          break;
        }

        case 'JUDGE_CORRECT': {
          stopAnswerTimer();
          if (gameState.activeClue && gameState.buzzerState.buzzedTeamId) {
            const team = gameState.teams.find((t) => t.id === gameState.buzzerState.buzzedTeamId);
            if (team) {
              team.score += gameState.activeClue.value;
              addLog(`¡Respuesta CORRECTA de ${team.name}! (+${gameState.activeClue.value} pts)`, 'correct');
            }
            // Mark clue as answered
            for (const cat of gameState.categories) {
              const cl = cat.clues.find((c) => c.id === gameState.activeClue!.clueId);
              if (cl) {
                cl.isAnswered = true;
                cl.answeredByTeamId = gameState.buzzerState.buzzedTeamId;
                break;
              }
            }
            gameState.activeClue.state = 'revealed';
            gameState.buzzerState.isOpen = false;
            gameState.buzzerState.buzzQueue = [];
            gameState.buzzerState.lockedTeams = [];
            broadcast({ type: 'AUDIO_TRIGGER', sound: 'correct', state: gameState });
          }
          break;
        }

        case 'JUDGE_WRONG': {
          executeJudgeWrong(false);
          break;
        }

        case 'REVEAL_ANSWER': {
          stopAnswerTimer();
          if (gameState.activeClue) {
            gameState.activeClue.state = 'revealed';
            gameState.buzzerState.isOpen = false;
            // Mark clue answered
            for (const cat of gameState.categories) {
              const cl = cat.clues.find((c) => c.id === gameState.activeClue!.clueId);
              if (cl) {
                cl.isAnswered = true;
                break;
              }
            }
            addLog(`Solución mostrada: "${gameState.activeClue.answer}"`, 'info');
            broadcast();
          }
          break;
        }

        case 'CLOSE_CLUE': {
          stopAnswerTimer();
          if (gameState.activeClue) {
            // Mark answered if not yet
            for (const cat of gameState.categories) {
              const cl = cat.clues.find((c) => c.id === gameState.activeClue!.clueId);
              if (cl) {
                cl.isAnswered = true;
                break;
              }
            }
            gameState.activeClue = null;
            gameState.buzzerState = {
              isOpen: false,
              buzzedTeamId: null,
              buzzedPlayerName: null,
              buzzedAt: null,
              answerTimeLimit: 10,
              answerTimeRemaining: 10,
              answerSubmittedAt: null,
              playerAnswer: null,
              lockedTeams: [],
              attemptedMembers: [],
              buzzQueue: [],
              reboundRound: 1,
            };
            addLog('Regreso al tablero principal.', 'info');
            broadcast();
          }
          break;
        }

        case 'UPDATE_TITLE': {
          if (payload.title) {
            gameState.title = payload.title;
            addLog(`Título del juego actualizado: "${gameState.title}"`, 'info');
            broadcast();
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          if (payload.settings) {
            gameState.settings = { ...gameState.settings, ...payload.settings };
            addLog('Ajustes del juego actualizados.', 'info');
            broadcast();
          }
          break;
        }

        case 'UPDATE_TEAM': {
          const { teamId, name, color, score } = payload;
          const t = gameState.teams.find((tm) => tm.id === teamId);
          if (t) {
            if (name !== undefined) t.name = name;
            if (color !== undefined) t.color = color;
            if (score !== undefined) t.score = Number(score);
            addLog(`Equipo ${t.name} actualizado.`, 'info');
            broadcast();
          }
          break;
        }

        case 'LOAD_CATEGORIES': {
          if (Array.isArray(payload.categories) && payload.categories.length > 0) {
            stopAnswerTimer();
            gameState.categories = payload.categories;
            if (payload.title) gameState.title = payload.title;
            gameState.activeClue = null;
            gameState.buzzerState = {
              isOpen: false,
              buzzedTeamId: null,
              buzzedPlayerName: null,
              buzzedAt: null,
              answerTimeLimit: 10,
              answerTimeRemaining: 10,
              answerSubmittedAt: null,
              playerAnswer: null,
              lockedTeams: [],
              attemptedMembers: [],
              buzzQueue: [],
              reboundRound: 1,
            };
            addLog(`Se cargaron ${gameState.categories.length} categorías nuevas con éxito.`, 'info');
            broadcast();
          }
          break;
        }

        case 'RESET_GAME': {
          // Reset scores, clues, but keep team members if desired
          stopAnswerTimer();
          gameState.teams.forEach((t) => { t.score = 0; });
          gameState.categories.forEach((c) => {
            c.clues.forEach((cl) => {
              cl.isAnswered = false;
              cl.answeredByTeamId = null;
            });
          });
          gameState.activeClue = null;
          gameState.buzzerState = {
            isOpen: false,
            buzzedTeamId: null,
            buzzedPlayerName: null,
            buzzedAt: null,
            answerTimeLimit: 10,
            answerTimeRemaining: 10,
            answerSubmittedAt: null,
            playerAnswer: null,
            lockedTeams: [],
            attemptedMembers: [],
            buzzQueue: [],
            reboundRound: 1,
          };
          addLog('Juego reiniciado por el moderador.', 'system');
          broadcast();
          break;
        }

        case 'START_GAME': {
          gameState.status = 'playing';
          addLog(`¡Concurso iniciado! Tablero de juego en vivo abierto para ${gameState.teams.length} equipos.`, 'system');
          broadcast();
          break;
        }

        case 'RETURN_TO_SETUP': {
          gameState.status = 'setup';
          addLog('Regreso a la pantalla de configuración inicial.', 'system');
          broadcast();
          break;
        }

        case 'SETUP_GAME': {
          if (payload.title) {
            gameState.title = payload.title.trim();
          }
          if (payload.categories && Array.isArray(payload.categories) && payload.categories.length > 0) {
            gameState.categories = payload.categories;
          }
          if (payload.teams && Array.isArray(payload.teams) && payload.teams.length > 0) {
            // Keep existing members if same team ID, or re-create (up to 5 teams)
            gameState.teams = payload.teams.slice(0, 5).map((newT: any) => {
              const oldT = gameState.teams.find((t) => t.id === newT.id);
              return {
                id: newT.id,
                name: newT.name || oldT?.name || 'Equipo',
                color: newT.color || oldT?.color || '#3b82f6',
                score: typeof newT.score === 'number' ? newT.score : oldT?.score || 0,
                members: oldT ? oldT.members : [],
              };
            });
          }
          if (payload.settings) {
            gameState.settings = { ...gameState.settings, ...payload.settings };
          }
          if (payload.startImmediately) {
            gameState.status = 'playing';
            addLog(`¡Concurso "${gameState.title}" configurado e iniciado!`, 'system');
          } else {
            addLog(`Configuración actualizada para "${gameState.title}".`, 'info');
          }
          broadcast();
          break;
        }

        case 'REMOVE_MEMBER': {
          const { teamId, memberId } = payload;
          const team = gameState.teams.find((t) => t.id === teamId);
          if (team) {
            const mem = team.members.find((m) => m.id === memberId);
            team.members = team.members.filter((m) => m.id !== memberId);
            addLog(`${mem ? mem.name : 'Participante'} fue removido de ${team.name}.`, 'info');
            broadcast();
          }
          break;
        }

        case 'CLEAR_MEMBERS': {
          gameState.teams.forEach((t) => { t.members = []; });
          addLog('Se limpió la lista de participantes en todos los equipos.', 'system');
          broadcast();
          break;
        }
      }
    }
  }

  // REST API Routes
  app.get('/api/auth/status', (req, res) => {
    res.json({ isSessionActive, title: gameState.title });
  });

  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === REQUIRED_PASSWORD) {
      isSessionActive = true;
      gameState.isSessionActive = true;
      addLog('Acceso autorizado: el anfitrión ha desbloqueado el sistema de concurso.', 'system');
      broadcast();
      return res.json({ ok: true, isSessionActive: true, message: 'Acceso concedido' });
    } else {
      return res.status(401).json({ ok: false, error: 'Contraseña incorrecta. Acceso denegado.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    stopAnswerTimer();
    isSessionActive = false;
    gameState.isSessionActive = false;
    gameState.teams.forEach((t) => {
      t.members = [];
    });
    gameState.activeClue = null;
    gameState.buzzerState = {
      isOpen: false,
      buzzedTeamId: null,
      buzzedPlayerName: null,
      buzzedAt: null,
      answerTimeLimit: 10,
      answerTimeRemaining: 10,
      answerSubmittedAt: null,
      playerAnswer: null,
      lockedTeams: [],
      attemptedMembers: [],
      buzzQueue: [],
      reboundRound: 1,
    };
    addLog('El anfitrión ha cerrado la sesión global. Todos los participantes han sido desconectados.', 'system');

    // Broadcast signal to mobile buzzers
    broadcast({
      type: 'GLOBAL_LOGOUT',
      message: 'El anfitrión ha cerrado la sesión global del concurso.',
    });
    broadcast();
    return res.json({ ok: true });
  });

  app.get('/api/game/state', (req, res) => {
    res.json(gameState);
  });

  app.post('/api/game/action', (req, res) => {
    const { action, payload } = req.body;
    handleAction({ type: 'HOST_ACTION', action, payload });
    res.json({ ok: true, state: gameState });
  });

  app.post('/api/game/buzz', (req, res) => {
    const { teamId, memberName } = req.body;
    handleAction({ type: 'BUZZ', teamId, memberName });
    res.json({ ok: true, buzzedTeamId: gameState.buzzerState.buzzedTeamId });
  });

  app.post('/api/game/submit-answer', (req, res) => {
    const { teamId, answer, memberName } = req.body;
    handleAction({ type: 'SUBMIT_ANSWER', teamId, answer, memberName });
    res.json({ ok: true });
  });

  app.post('/api/game/join', (req, res) => {
    if (!isSessionActive) {
      return res.status(403).json({
        ok: false,
        error: 'El anfitrión no ha iniciado sesión o la sesión ha sido cerrada.',
      });
    }
    const { teamId, memberName } = req.body;
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team) {
      return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    }
    const cleanName = (memberName || '').trim();
    const existing = team.members.find(
      (m) => m.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    const maxLimit = gameState.settings.maxPlayersPerTeam || 5;
    if (!existing && maxLimit > 0 && team.members.length >= maxLimit) {
      return res.status(400).json({
        ok: false,
        error: `El ${team.name} ya está completo (máximo ${maxLimit} participantes).`
      });
    }
    handleAction({ type: 'JOIN_TEAM', teamId, memberName });
    res.json({ ok: true, state: gameState });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Jeopardy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
