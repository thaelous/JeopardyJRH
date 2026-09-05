export interface TeamMember {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  members: TeamMember[];
}

export interface Clue {
  id: string;
  value: number;
  question: string; // La pista (en Jeopardy se muestra la pista)
  answer: string; // La respuesta esperada
  isAnswered: boolean;
  answeredByTeamId: string | null;
}

export interface Category {
  id: string;
  name: string;
  clues: Clue[];
}

export type ClueState = 'reading' | 'buzzing_open' | 'buzzed' | 'revealed' | 'closed';

export interface ActiveClue {
  categoryId: string;
  categoryName: string;
  clueId: string;
  value: number;
  question: string;
  answer: string;
  timeRemaining: number;
  state: ClueState;
}

export interface QueuedBuzz {
  teamId: string;
  memberName: string;
  timestamp: number;
}

export interface BuzzerState {
  isOpen: boolean;
  buzzedTeamId: string | null;
  buzzedPlayerName: string | null;
  buzzedAt: number | null;
  answerTimeLimit?: number; // 10 seconds default
  answerTimeRemaining?: number; // 10s countdown to write answer
  answerSubmittedAt?: number | null;
  playerAnswer: string | null;
  lockedTeams: string[];
  attemptedMembers: string[];
  buzzQueue: QueuedBuzz[];
  reboundRound?: number;
}

export interface GameSettings {
  timerSeconds: number;
  soundEnabled: boolean;
  penalizeWrongAnswer: boolean;
  maxPlayersPerTeam: number;
}

export interface GameLog {
  id: string;
  text: string;
  timestamp: number;
  type?: 'info' | 'buzz' | 'correct' | 'wrong' | 'system';
}

export interface GameState {
  title: string;
  status: 'setup' | 'playing' | 'game_over';
  teams: Team[];
  categories: Category[];
  activeClue: ActiveClue | null;
  buzzerState: BuzzerState;
  settings: GameSettings;
  recentLogs: GameLog[];
  lastUpdate: number;
  isSessionActive?: boolean;
}

export type WSClientMessage =
  | { type: 'GET_STATE' }
  | { type: 'JOIN_TEAM'; teamId: string; memberName: string }
  | { type: 'BUZZ'; teamId: string; memberName: string; timestamp: number }
  | { type: 'SUBMIT_ANSWER'; teamId: string; memberName: string; answer: string }
  | { type: 'HOST_ACTION'; action: string; payload?: any }
  | { type: 'GLOBAL_LOGOUT' };

export type WSServerMessage =
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'BUZZ_WINNER'; teamId: string; memberName: string; timestamp: number }
  | { type: 'AUDIO_TRIGGER'; sound: string }
  | { type: 'ERROR'; message: string }
  | { type: 'GLOBAL_LOGOUT'; message: string };
