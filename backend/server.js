const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const matches = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // CREATE ROOM
  socket.on("createRoom", ({ mode }) => {
    const roomId = Math.random().toString(36).substring(2, 8);

    matches[roomId] = {
      players: [socket.id],
      moves: {},
      scores: {},
      maxWins: mode === "BO5" ? 3 : 2,
      mode: mode,
      active: true
    };

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
    console.log(`Room ${roomId} created by ${socket.id} with mode ${mode}`);
  });

  // JOIN ROOM
  socket.on("joinRoom", (roomId) => {
    console.log(`${socket.id} attempting to join room ${roomId}`);
    const match = matches[roomId];
    
    if (!match) {
      console.log(`Room ${roomId} not found`);
      socket.emit("error", "Room not found");
      return;
    }
    
    if (match.players.length === 2) {
      console.log(`Room ${roomId} is full`);
      socket.emit("error", "Room is full");
      return;
    }

    match.players.push(socket.id);
    match.scores[match.players[0]] = 0;
    match.scores[match.players[1]] = 0;

    socket.join(roomId);
    
    // Send game info to both players
    io.to(roomId).emit("startGame", { 
      mode: match.mode,
      maxWins: match.maxWins 
    });
    
    console.log(`${socket.id} joined room ${roomId}. Game starting with mode ${match.mode}!`);
  });

  // PLAYER MOVE
  socket.on("playerMove", ({ roomId, move }) => {
    const match = matches[roomId];
    if (!match || !match.active) {
      socket.emit("error", "Invalid match");
      return;
    }

    if (!match.players.includes(socket.id)) {
      socket.emit("error", "You are not in this match");
      return;
    }

    match.moves[socket.id] = move;
    console.log(`${socket.id} chose ${move} in room ${roomId}`);

    io.to(roomId).emit("playerMoved", { 
      playerId: socket.id,
      totalMoves: Object.keys(match.moves).length 
    });

    if (Object.keys(match.moves).length === 2) {
      resolveRound(roomId);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    for (const roomId in matches) {
      if (matches[roomId].players.includes(socket.id)) {
        io.to(roomId).emit("matchCancelled");
        delete matches[roomId];
        console.log(`Match ${roomId} cancelled due to disconnect`);
      }
    }
  });
});

function resolveRound(roomId) {
  const match = matches[roomId];
  const [p1, p2] = match.players;

  const m1 = match.moves[p1];
  const m2 = match.moves[p2];

  let winner = null;
  let result = "draw";

  if (m1 !== m2) {
    if (
      (m1 === "rock" && m2 === "scissors") ||
      (m1 === "paper" && m2 === "rock") ||
      (m1 === "scissors" && m2 === "paper")
    ) {
      winner = p1;
      result = "p1wins";
    } else {
      winner = p2;
      result = "p2wins";
    }
    match.scores[winner]++;
  }

  io.to(roomId).emit("roundResult", {
    scores: match.scores,
    moves: { [p1]: m1, [p2]: m2 },
    winner: winner,
    result: result
  });

  console.log(`Round in ${roomId}: ${m1} vs ${m2} - Winner: ${winner || 'draw'}`);

  if (winner && match.scores[winner] === match.maxWins) {
    io.to(roomId).emit("matchEnded", winner);
    console.log(`Match ${roomId} ended. Winner: ${winner}`);
    setTimeout(() => {
      delete matches[roomId];
    }, 5000);
  } else {
    match.moves = {};
  }
}

server.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);