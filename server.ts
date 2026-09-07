import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

// --- TIPOS DE DATOS COMPARTIDOS ---
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
  answeredByTeamId?: string | null;
}

interface Category {
  id: string;
  title: string;
  clues: Clue[];
}

interface BuzzerState {
  isOpen: boolean;
  buzzedTeamId: string | null;
  buzzedPlayerName: string | null;
  buzzedAt: number | null;
  answerTimeLimit: number;
  answerTimeRemaining: number;
  playerAnswer: string | null;
  lockedTeams: string[];
  firstAttemptTeamId: string | null;
  hasReboundedToFirst: boolean;
  attemptedMembers?: string[];
}

interface JeopardyState {
  roomCode: string;
  status: 'setup' | 'qrcodes' | 'playing' | 'finished';
  title: string;
  categories: Category[];
  teamCount: number;
  maxMembersPerTeam: number;
  teams: Team[];
  activeClue: (Clue & { categoryId: string; categoryTitle: string; state: string }) | null;
  buzzerState: BuzzerState;
  lastUpdated: number;
  isSessionActive: boolean;
}

const REQUIRED_PASSWORD = 'Altair16';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    title: 'Ciencia y Universo',
    clues: [
      { id: 'c1-100', value: 100, question: '¿Cuál es el planeta más grande de nuestro sistema solar?', answer: 'Júpiter', isAnswered: false },
      { id: 'c1-200', value: 200, question: '¿Qué elemento químico tiene el símbolo "Au"?', answer: 'Oro', isAnswered: false },
      { id: 'c1-300', value: 300, question: '¿Cuál es la velocidad aproximada de la luz en el vacío en km/s?', answer: '300,000 km/s (aprox 299,792 km/s)', isAnswered: false },
      { id: 'c1-400', value: 400, question: '¿Qué orgánulo celular es conocido como la central energética de la célula?', answer: 'Mitocondria', isAnswered: false },
      { id: 'c1-500', value: 500, question: '¿Quién formuló la teoría de la relatividad general?', answer: 'Albert Einstein', isAnswered: false }
    ]
  },
  {
    id: 'cat-2',
    title: 'Historia y Civilizaciones',
    clues: [
      { id: 'c2-100', value: 100, question: '¿En qué año llegó Cristóbal Colón a América?', answer: '1492', isAnswered: false },
      { id: 'c2-200', value: 200, question: '¿Qué civilización antigua construyó la mítica ciudadela de Machu Picchu?', answer: 'Los Incas', isAnswered: false },
      { id: 'c2-300', value: 300, question: '¿En qué país y año cayó el Muro de Berlín?', answer: 'Alemania, en 1989', isAnswered: false },
      { id: 'c2-400', value: 400, question: '¿Quién fue el primer emperador de Roma?', answer: 'César Augusto (Octavio)', isAnswered: false },
      { id: 'c2-500', value: 500, question: '¿En qué año comenzó y terminó la Segunda Guerra Mundial?', answer: '1939 - 1945', isAnswered: false }
    ]
  },
  {
    id: 'cat-3',
    title: 'Geografía Mundial',
    clues: [
      { id: 'c3-100', value: 100, question: '¿Cuál es el río más largo y caudaloso del planeta Tierra?', answer: 'Río Amazonas', isAnswered: false },
      { id: 'c3-200', value: 200, question: '¿Cuál es la capital oficial de Australia?', answer: 'Canberra', isAnswered: false },
      { id: 'c3-300', value: 300, question: '¿En qué cordillera se localiza el Monte Everest?', answer: 'Cordillera del Himalaya', isAnswered: false },
      { id: 'c3-400', value: 400, question: '¿Qué estrecho separa el continente americano del asiático?', answer: 'Estrecho de Bering', isAnswered: false },
      { id: 'c3-500', value: 500, question: '¿Cuál es el país con mayor número de islas en el mundo?', answer: 'Suecia (más de 260,000 islas)', isAnswered: false }
    ]
  },
  {
    id: 'cat-4',
    title: 'Arte, Letras y Cine',
    clues: [
      { id: 'c4-100', value: 100, question: '¿Quién pintó la famosa obra maestra "La Gioconda" o Mona Lisa?', answer: 'Leonardo da Vinci', isAnswered: false },
      { id: 'c4-200', value: 200, question: '¿Quién es el autor de la célebre novela "Cien años de soledad"?', answer: 'Gabriel García Márquez', isAnswered: false },
      { id: 'c4-300', value: 300, question: '¿Qué compositor clásico compuso la emblemática Novena Sinfonía estando sordo?', answer: 'Ludwig van Beethoven', isAnswered: false },
      { id: 'c4-400', value: 400, question: '¿Quién dirigió películas icónicas como E.T., Tiburón y Jurassic Park?', answer: 'Steven Spielberg', isAnswered: false },
      { id: 'c4-500', value: 500, question: '¿A qué movimiento artístico y pictórico perteneció Salvador Dalí?', answer: 'Surrealismo', isAnswered: false }
    ]
  },
  {
    id: 'cat-5',
    title: 'Tecnología & Lógica',
    clues: [
      { id: 'c5-100', value: 100, question: '¿Qué significan las siglas de la red mundial "WWW"?', answer: 'World Wide Web', isAnswered: false },
      { id: 'c5-200', value: 200, question: '¿Qué sistema numérico de base 2 emplean internamente las computadoras?', answer: 'Sistema Binario (0 y 1)', isAnswered: false },
      { id: 'c5-300', value: 300, question: '¿Quién es considerado históricamente el padre de la computación teórica?', answer: 'Alan Turing', isAnswered: false },
      { id: 'c5-400', value: 400, question: '¿Qué protocolo de seguridad cifra las comunicaciones en la web con HTTPS?', answer: 'TLS / SSL', isAnswered: false },
      { id: 'c5-500', value: 500, question: '¿En qué año se lanzó el primer iPhone original por Apple?', answer: '2007', isAnswered: false }
    ]
  }
];

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Equipo Azul', color: '#2563EB', score: 0, members: [] },
  { id: 'team-2', name: 'Equipo Rojo', color: '#DC2626', score: 0, members: [] },
  { id: 'team-3', name: 'Equipo Verde', color: '#16A34A', score: 0, members: [] },
  { id: 'team-4', name: 'Equipo Dorado', color: '#CA8A04', score: 0, members: [] },
  { id: 'team-5', name: 'Equipo Morado', color: '#9333EA', score: 0, members: [] }
];

function createInitialState(): JeopardyState {
  return {
    roomCode: 'JP-2025',
    status: 'setup',
    title: 'Torneo Jeopardy Live Show',
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    teamCount: 3,
    maxMembersPerTeam: 5,
    teams: JSON.parse(JSON.stringify(DEFAULT_TEAMS)),
    activeClue: null,
    buzzerState: {
      isOpen: false,
      buzzedTeamId: null,
      buzzedPlayerName: null,
      buzzedAt: null,
      answerTimeLimit: 10,
      answerTimeRemaining: 10,
      playerAnswer: null,
      lockedTeams: [],
      firstAttemptTeamId: null,
      hasReboundedToFirst: false,
      attemptedMembers: []
    },
    lastUpdated: Date.now(),
    isSessionActive: true
  };
}

let serverState: JeopardyState = createInitialState();
let answerTimerInterval: NodeJS.Timeout | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Función para retransmitir a todos los clientes conectados
  function broadcast(msg?: Record<string, any>) {
    serverState.lastUpdated = Date.now();
    const payload = JSON.stringify(msg || { type: 'STATE_UPDATE', state: serverState });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  function stopAnswerTimer() {
    if (answerTimerInterval) {
      clearInterval(answerTimerInterval);
      answerTimerInterval = null;
    }
  }

  function startAnswerTimer() {
    stopAnswerTimer();
    serverState.buzzerState.answerTimeLimit = 10;
    serverState.buzzerState.answerTimeRemaining = 10;

    answerTimerInterval = setInterval(() => {
      if (!serverState.activeClue || !serverState.buzzerState.buzzedTeamId) {
        stopAnswerTimer();
        return;
      }

      // Si ya escribió respuesta, no hacer timeout
      if (serverState.buzzerState.playerAnswer) {
        stopAnswerTimer();
        return;
      }

      const current = serverState.buzzerState.answerTimeRemaining;
      if (current <= 1) {
        serverState.buzzerState.answerTimeRemaining = 0;
        stopAnswerTimer();
        handleTeamFailedAnswer(serverState.buzzerState.buzzedTeamId, true);
      } else {
        serverState.buzzerState.answerTimeRemaining = current - 1;
        broadcast();
      }
    }, 1000);
  }

  function handleTeamFailedAnswer(failedTeamId: string, isTimeout = false) {
    stopAnswerTimer();
    const b = serverState.buzzerState;

    if (!b.lockedTeams.includes(failedTeamId)) {
      b.lockedTeams.push(failedTeamId);
    }

    // Registrar participante que falló
    if (b.buzzedPlayerName && (!b.attemptedMembers || !b.attemptedMembers.includes(b.buzzedPlayerName))) {
      b.attemptedMembers = [...(b.attemptedMembers || []), b.buzzedPlayerName];
    }

    if (!b.firstAttemptTeamId) {
      b.firstAttemptTeamId = failedTeamId;
    }

    const teamCount = serverState.teamCount || serverState.teams.length;
    const activeTeams = serverState.teams.slice(0, teamCount);
    const availableTeams = activeTeams.filter(t => !b.lockedTeams.includes(t.id));

    if (availableTeams.length > 0) {
      // Rebote a otros equipos restantes
      b.isOpen = true;
      b.buzzedTeamId = null;
      b.buzzedPlayerName = null;
      b.buzzedAt = null;
      b.playerAnswer = null;
      b.answerTimeRemaining = 10;
      if (serverState.activeClue) {
        serverState.activeClue.state = 'buzzing_open';
      }
      broadcast({
        type: 'AUDIO_TRIGGER',
        sound: isTimeout ? 'timeup' : 'wrong',
        state: serverState
      });
    } else if (!b.hasReboundedToFirst && b.firstAttemptTeamId) {
      // Regreso de oportunidad al primer equipo
      b.hasReboundedToFirst = true;
      b.lockedTeams = b.lockedTeams.filter(id => id !== b.firstAttemptTeamId);
      b.isOpen = true;
      b.buzzedTeamId = null;
      b.buzzedPlayerName = null;
      b.buzzedAt = null;
      b.playerAnswer = null;
      b.answerTimeRemaining = 10;
      if (serverState.activeClue) {
        serverState.activeClue.state = 'buzzing_open';
      }
      broadcast({
        type: 'AUDIO_TRIGGER',
        sound: isTimeout ? 'timeup' : 'wrong',
        state: serverState
      });
    } else {
      // Todos los equipos fallaron -> revelar respuesta
      b.isOpen = false;
      b.buzzedTeamId = null;
      b.buzzedPlayerName = null;
      b.buzzedAt = null;
      b.playerAnswer = null;
      if (serverState.activeClue) {
        serverState.activeClue.state = 'revealed';
        for (const cat of serverState.categories) {
          const cl = cat.clues.find(c => c.id === serverState.activeClue!.id);
          if (cl) {
            cl.isAnswered = true;
            break;
          }
        }
      }
      broadcast({
        type: 'AUDIO_TRIGGER',
        sound: isTimeout ? 'timeup' : 'wrong',
        state: serverState
      });
    }
  }

  function processAction(action: string, payload: any): JeopardyState {
    switch (action) {
      case 'PLAYER_JOIN': {
        const payloadObj = payload || {};
        const teamId = payloadObj.teamId;
        const cleanName = String(payloadObj.playerName || payloadObj.memberName || '').trim();
        const sessionId = String(payloadObj.sessionId || payloadObj.memberId || ('m-' + Date.now())).trim();
        const roomCode = payloadObj.roomCode;
        if (!cleanName || !teamId) break;

        // 1. Quitar al participante de cualquier otro equipo para evitar duplicados
        serverState.teams = serverState.teams.map(t => ({
          ...t,
          members: t.members.filter(m => m.name.toLowerCase() !== cleanName.toLowerCase() && m.id !== sessionId)
        }));

        // 2. Buscar equipo por id o nombre
        let targetTeam = serverState.teams.find(t => 
          t.id === teamId || 
          t.name.toLowerCase() === String(teamId).toLowerCase() ||
          t.id.toLowerCase() === String(teamId).toLowerCase()
        );
        if (!targetTeam && serverState.teams.length > 0) {
          targetTeam = serverState.teams[0];
        }

        if (targetTeam) {
          const max = serverState.maxMembersPerTeam || 5;
          if (max === 0 || targetTeam.members.length < max) {
            const newMember: TeamMember = {
              id: sessionId,
              name: cleanName,
              joinedAt: Date.now()
            };
            targetTeam.members.push(newMember);
          }
        }

        // 3. Emitir evento específico de jugador unido a todos los clientes (anfitrión y móviles)
        broadcast({
          type: 'PLAYER_JOINED',
          payload: {
            roomCode: serverState.roomCode,
            teamId: targetTeam ? targetTeam.id : teamId,
            teamName: targetTeam ? targetTeam.name : '',
            playerName: cleanName,
            memberName: cleanName,
            sessionId: sessionId,
            memberId: sessionId
          },
          state: serverState
        });
        break;
      }

      case 'PLAYER_REMOVE': {
        const { teamId, memberId } = payload || {};
        serverState.teams = serverState.teams.map(t => {
          if (t.id === teamId) {
            return {
              ...t,
              members: t.members.filter(m => m.id !== memberId)
            };
          }
          return t;
        });
        break;
      }

      case 'PLAYER_BUZZ': {
        const { teamId, memberName } = payload || {};
        if (!serverState.buzzerState.isOpen) break;
        if ((serverState.buzzerState.lockedTeams || []).includes(teamId)) break;

        // Primer equipo en pulsar: gana el turno
        serverState.buzzerState = {
          ...serverState.buzzerState,
          isOpen: false,
          buzzedTeamId: teamId,
          buzzedPlayerName: memberName || 'Participante',
          buzzedAt: Date.now(),
          answerTimeLimit: 10,
          answerTimeRemaining: 10,
          playerAnswer: null
        };

        if (serverState.activeClue) {
          serverState.activeClue.state = 'buzzed';
        }

        startAnswerTimer();
        break;
      }

      case 'PLAYER_ANSWER': {
        const { answer } = payload || {};
        serverState.buzzerState.playerAnswer = answer || '';
        stopAnswerTimer();
        break;
      }

      case 'JUDGE_CORRECT': {
        stopAnswerTimer();
        if (serverState.activeClue && serverState.buzzerState.buzzedTeamId) {
          const team = serverState.teams.find(t => t.id === serverState.buzzerState.buzzedTeamId);
          if (team) {
            team.score += serverState.activeClue.value;
          }
          // Marcar pista respondida
          for (const cat of serverState.categories) {
            const cl = cat.clues.find(c => c.id === serverState.activeClue!.id);
            if (cl) {
              cl.isAnswered = true;
              cl.answeredByTeamId = serverState.buzzerState.buzzedTeamId;
              break;
            }
          }
          serverState.activeClue.state = 'revealed';
          serverState.buzzerState.isOpen = false;
        }
        break;
      }

      case 'JUDGE_WRONG': {
        if (serverState.buzzerState.buzzedTeamId) {
          const team = serverState.teams.find(t => t.id === serverState.buzzerState.buzzedTeamId);
          if (team && serverState.activeClue) {
            team.score -= serverState.activeClue.value;
          }
          handleTeamFailedAnswer(serverState.buzzerState.buzzedTeamId, false);
        }
        break;
      }

      case 'STATE_SNAPSHOT': {
        if (payload && typeof payload === 'object') {
          // Fusionar snapshot con cuidado, preservando miembros conectados
          const clientState = payload as JeopardyState;
          if (clientState.teams && Array.isArray(clientState.teams)) {
            // Preservar miembros si el cliente tenía menos o vacíos
            const mergedTeams = clientState.teams.map(ct => {
              const st = serverState.teams.find(t => t.id === ct.id);
              if (st && (!ct.members || ct.members.length === 0) && st.members.length > 0) {
                return { ...ct, members: st.members };
              }
              return ct;
            });
            clientState.teams = mergedTeams;
          }
          serverState = { ...serverState, ...clientState, lastUpdated: Date.now() };
        }
        break;
      }

      case 'SELECT_CLUE': {
        const { categoryId, clueId } = payload || {};
        const cat = serverState.categories.find(c => c.id === categoryId);
        const clue = cat ? cat.clues.find(cl => cl.id === clueId) : null;
        if (clue && !clue.isAnswered) {
          serverState.activeClue = {
            ...clue,
            categoryId: cat!.id,
            categoryTitle: cat!.title,
            state: 'buzzing_open'
          };
          serverState.buzzerState = {
            isOpen: true,
            buzzedTeamId: null,
            buzzedPlayerName: null,
            buzzedAt: null,
            answerTimeLimit: 10,
            answerTimeRemaining: 10,
            playerAnswer: null,
            lockedTeams: [],
            firstAttemptTeamId: null,
            hasReboundedToFirst: false,
            attemptedMembers: []
          };
        }
        break;
      }

      case 'CLOSE_CLUE': {
        stopAnswerTimer();
        if (serverState.activeClue) {
          for (const cat of serverState.categories) {
            const cl = cat.clues.find(c => c.id === serverState.activeClue!.id);
            if (cl) {
              cl.isAnswered = true;
              break;
            }
          }
          serverState.activeClue = null;
          serverState.buzzerState = {
            isOpen: false,
            buzzedTeamId: null,
            buzzedPlayerName: null,
            buzzedAt: null,
            answerTimeLimit: 10,
            answerTimeRemaining: 10,
            playerAnswer: null,
            lockedTeams: [],
            firstAttemptTeamId: null,
            hasReboundedToFirst: false,
            attemptedMembers: []
          };
        }
        break;
      }

      case 'RESET_BOARD': {
        stopAnswerTimer();
        // 1. Restaurar todas las pistas a no respondidas con su valor original
        serverState.categories.forEach(cat => {
          cat.clues.forEach(cl => {
            cl.isAnswered = false;
            cl.answeredByTeamId = null;
          });
        });
        // 2. Poner los marcadores de todos los equipos en $0
        serverState.teams.forEach(t => {
          t.score = 0;
        });
        // 3. Resetear el buzzer/pulsador a desbloqueado y sin turnos pendientes
        serverState.activeClue = null;
        serverState.buzzerState = {
          isOpen: false,
          buzzedTeamId: null,
          buzzedPlayerName: null,
          buzzedAt: null,
          answerTimeLimit: 10,
          answerTimeRemaining: 10,
          playerAnswer: null,
          lockedTeams: [],
          firstAttemptTeamId: null,
          hasReboundedToFirst: false,
          attemptedMembers: []
        };
        broadcast({ type: 'BOARD_RESET', action: 'RESET_BOARD', state: serverState });
        break;
      }

      case 'GLOBAL_LOGOUT': {
        stopAnswerTimer();
        serverState = createInitialState();
        serverState.isSessionActive = false;
        serverState.status = 'setup';
        serverState.teams.forEach(t => {
          t.members = [];
          t.score = 0;
        });
        serverState.categories.forEach(cat => {
          cat.clues.forEach(cl => {
            cl.isAnswered = false;
            cl.answeredByTeamId = null;
          });
        });
        broadcast({ type: 'SESSION_TERMINATED', action: 'GLOBAL_LOGOUT', state: serverState });
        break;
      }

      case 'HOST_LOGIN': {
        serverState.isSessionActive = true;
        serverState.status = 'setup'; // El presentador siempre inicia en la pantalla de configuración
        break;
      }

      default:
        break;
    }

    serverState.lastUpdated = Date.now();
    return serverState;
  }

  // Configuración de WebSocket
  wss.on('connection', (ws) => {
    // Al conectarse cualquier cliente (anfitrión o jugador en celular), enviar estado completo
    ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: serverState }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'GET_STATE') {
          ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: serverState }));
          return;
        }

        if (msg.type === 'ACTION') {
          processAction(msg.action, msg.payload);
          broadcast();
          return;
        }

        if (msg.type === 'STATE_SNAPSHOT') {
          processAction('STATE_SNAPSHOT', msg.state || msg.payload);
          broadcast();
          return;
        }

        if (msg.action) {
          processAction(msg.action, msg.payload);
          broadcast();
          return;
        }
      } catch (err) {
        console.error('Error procesando mensaje WebSocket:', err);
      }
    });
  });

  // Endpoints REST de sincronización
  app.get('/api/sync/state', (req, res) => {
    res.json({ ok: true, state: serverState });
  });

  app.post('/api/sync/action', (req, res) => {
    const { action, payload } = req.body || {};
    if (action) {
      processAction(action, payload);
      broadcast();
    }
    res.json({ ok: true, state: serverState });
  });

  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === REQUIRED_PASSWORD) {
      serverState.isSessionActive = true;
      serverState.status = 'setup'; // El presentador siempre aterriza en la configuración
      broadcast();
      return res.json({ ok: true, isSessionActive: true, status: 'setup', state: serverState });
    }
    return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
  });

  app.post('/api/auth/logout', (req, res) => {
    stopAnswerTimer();
    serverState = createInitialState();
    serverState.isSessionActive = false;
    serverState.status = 'setup';
    serverState.teams.forEach(t => {
      t.members = [];
      t.score = 0;
    });
    serverState.categories.forEach(cat => {
      cat.clues.forEach(cl => {
        cl.isAnswered = false;
        cl.answeredByTeamId = null;
      });
    });
    broadcast({ type: 'SESSION_TERMINATED', action: 'GLOBAL_LOGOUT', state: serverState });
    broadcast();
    return res.json({ ok: true, state: serverState });
  });

  // Reseteo completo del tablero y puntuaciones ($0)
  app.post('/api/game/reset', (req, res) => {
    processAction('RESET_BOARD', {});
    broadcast();
    res.json({ ok: true, state: serverState });
  });

  // Compatibilidad con rutas anteriores
  app.get('/api/game/state', (req, res) => {
    res.json(serverState);
  });

  app.post('/api/game/join', (req, res) => {
    const payload = req.body || {};
    const teamId = payload.teamId;
    const cleanName = String(payload.playerName || payload.memberName || '').trim();
    const sessionId = String(payload.sessionId || payload.memberId || ('m-' + Date.now())).trim();
    const roomCode = payload.roomCode;
    processAction('PLAYER_JOIN', { teamId, playerName: cleanName, memberName: cleanName, sessionId, memberId: sessionId, roomCode });
    broadcast();
    res.json({
      ok: true,
      confirmed: true,
      playerName: cleanName,
      memberName: cleanName,
      sessionId,
      teamId,
      roomCode: serverState.roomCode,
      state: serverState
    });
  });

  app.post('/api/game/buzz', (req, res) => {
    const { teamId, memberName } = req.body;
    processAction('PLAYER_BUZZ', { teamId, memberName });
    broadcast();
    res.json({ ok: true, state: serverState });
  });

  app.post('/api/game/submit-answer', (req, res) => {
    const { answer } = req.body;
    processAction('PLAYER_ANSWER', { answer });
    broadcast();
    res.json({ ok: true, state: serverState });
  });

  // Middleware de Vite o archivos estáticos
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
    console.log(`Servidor Jeopardy listo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
