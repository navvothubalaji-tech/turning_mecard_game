import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory Duel Rooms store for Cross-Device 2-Player Battles
interface DuelPlayer {
  id: string;
  name: string;
  mechanimal: any;
  currentHp: number;
  maxHp: number;
  isReady: boolean;
  selectedMove?: string;
}

interface DuelRoom {
  id: string;
  code: string;
  createdAt: number;
  players: DuelPlayer[];
  currentTurn: number; // 0 or 1
  turnCount: number;
  status: 'waiting' | 'battling' | 'finished';
  winnerIndex?: number;
  combatLog: string[];
  anteClaimed?: boolean;
}

const duelRooms: Map<string, DuelRoom> = new Map();

// Clean up stale rooms older than 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of duelRooms.entries()) {
    if (now - room.createdAt > 2 * 60 * 60 * 1000) {
      duelRooms.delete(code);
    }
  }
}, 60 * 1000);

// API Endpoints for Multi-Device 2-Player Duels

// 1. Create a new duel room
app.post('/api/duel/create', (req, res) => {
  const { playerName, mechanimal } = req.body;
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code e.g. 4821

  const newRoom: DuelRoom = {
    id: `room-${Date.now()}`,
    code,
    createdAt: Date.now(),
    players: [
      {
        id: `player-1-${Date.now()}`,
        name: playerName || 'Player 1',
        mechanimal: mechanimal || null,
        currentHp: mechanimal?.stats?.maxHp || 200,
        maxHp: mechanimal?.stats?.maxHp || 200,
        isReady: !!mechanimal,
      },
    ],
    currentTurn: 0,
    turnCount: 1,
    status: 'waiting',
    combatLog: ['Duel room initialized. Waiting for Opponent to join with Room Code ' + code + '!'],
  };

  duelRooms.set(code, newRoom);
  res.json({ success: true, room: newRoom, playerIndex: 0 });
});

// 2. Join an existing duel room
app.post('/api/duel/join', (req, res) => {
  const { code, playerName, mechanimal } = req.body;
  const room = duelRooms.get(code?.trim());

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room code not found.' });
  }

  if (room.players.length >= 2) {
    return res.status(400).json({ success: false, message: 'Room is already full.' });
  }

  const p2: DuelPlayer = {
    id: `player-2-${Date.now()}`,
    name: playerName || 'Player 2',
    mechanimal: mechanimal || null,
    currentHp: mechanimal?.stats?.maxHp || 200,
    maxHp: mechanimal?.stats?.maxHp || 200,
    isReady: !!mechanimal,
  };

  room.players.push(p2);
  room.status = 'battling';
  room.combatLog.push(`${p2.name} joined the duel with ${mechanimal?.nickname || 'their Mechanimal'}!`);
  room.combatLog.push(`Battle begins! High-Stakes Ante Rule Active: Winner may claim the defeated Mechanimal!`);

  res.json({ success: true, room, playerIndex: 1 });
});

// 3. Poll room state
app.get('/api/duel/state/:code', (req, res) => {
  const room = duelRooms.get(req.params.code);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }
  res.json({ success: true, room });
});

// 4. Submit an action/move
app.post('/api/duel/action', (req, res) => {
  const { code, playerIndex, moveName, damage } = req.body;
  const room = duelRooms.get(code);

  if (!room || room.status !== 'battling') {
    return res.status(400).json({ success: false, message: 'Duel not active.' });
  }

  if (room.currentTurn !== playerIndex) {
    return res.status(400).json({ success: false, message: 'Not your turn.' });
  }

  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const attacker = room.players[playerIndex];
  const defender = room.players[opponentIndex];

  // Apply damage
  defender.currentHp = Math.max(0, defender.currentHp - (damage || 35));
  room.combatLog.push(`${attacker.name}'s ${attacker.mechanimal?.nickname || 'Beast'} used ${moveName || 'Gear Strike'}! Dealt ${damage || 35} damage!`);

  if (defender.currentHp <= 0) {
    room.status = 'finished';
    room.winnerIndex = playerIndex;
    room.combatLog.push(`🏆 ${defender.name}'s Mechanimal has been defeated!`);
    room.combatLog.push(`${attacker.name} wins the duel!`);
  } else {
    // Switch turn
    room.currentTurn = opponentIndex;
    room.turnCount += 1;
  }

  res.json({ success: true, room });
});

// 5. Claim defeated opponent's Mechanimal (Ante Rule)
app.post('/api/duel/claim', (req, res) => {
  const { code, playerIndex, claim } = req.body;
  const room = duelRooms.get(code);

  if (!room || room.status !== 'finished') {
    return res.status(400).json({ success: false, message: 'Duel not finished.' });
  }

  if (room.winnerIndex !== playerIndex) {
    return res.status(403).json({ success: false, message: 'Only the winner can claim.' });
  }

  const loserIndex = playerIndex === 0 ? 1 : 0;
  const loserMechanimal = room.players[loserIndex].mechanimal;

  room.anteClaimed = !!claim;
  if (claim) {
    room.combatLog.push(`💥 ${room.players[playerIndex].name} has CLAIMED ${loserMechanimal?.nickname || 'the opponent mechanimal'} into their collection!`);
  } else {
    room.combatLog.push(`🤝 ${room.players[playerIndex].name} spared the defeated Mechanimal!`);
  }

  res.json({ success: true, claimedMechanimal: claim ? loserMechanimal : null, room });
});

// Development vs Production Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Wildbond Server listening on port ${PORT}`);
  });
}

startServer();
