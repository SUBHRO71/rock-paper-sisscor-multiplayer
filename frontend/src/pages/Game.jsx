import React, { useState, useEffect } from "react";
import {
  Users,
  Bot,
  Copy,
  Check,
  Trophy,
  Target,
  Zap,
  ArrowLeft
} from "lucide-react";
import { socket } from "../socket";

const Game = () => {
  const [gameMode, setGameMode] = useState(null);
  const [bestOf, setBestOf] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState("");
  const [scores, setScores] = useState({ player: 0, opponent: 0 });
  const [copied, setCopied] = useState(false);
  const [roundHistory, setRoundHistory] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);

  const choices = ["rock", "paper", "scissors"];
  const choiceDisplay = {
    rock: { emoji: "🪨", name: "Rock" },
    paper: { emoji: "📄", name: "Paper" },
    scissors: { emoji: "✂️", name: "Scissors" }
  };

  // Socket listeners
  useEffect(() => {
    socket.on("roomCreated", (newRoomId) => {
      setRoomId(newRoomId);
      setWaitingForOpponent(true);
    });

    socket.on("startGame", (data ) => {
      setWaitingForOpponent(false);
      setGameStarted(true);
      // Set bestOf to a valid value if it was "joined"
      setBestOf(data.mode);
    });

    socket.on("roundResult", (data) => {
      const playerSocketId = socket.id;
      const opponentSocketId = Object.keys(data.scores).find(id => id !== playerSocketId);
      
      const playerMove = data.moves[playerSocketId];
      const opponentMove = data.moves[opponentSocketId];
      
      setPlayerChoice(playerMove);
      setOpponentChoice(opponentMove);
      
      const newScores = {
        player: data.scores[playerSocketId] || 0,
        opponent: data.scores[opponentSocketId] || 0
      };
      setScores(newScores);
      
      let roundResult = '';
      if (data.winner === playerSocketId) {
        roundResult = 'player';
        setResult('You Win This Round! 🎉');
      } else if (data.winner === opponentSocketId) {
        roundResult = 'opponent';
        setResult('Opponent Wins This Round! 😔');
      } else {
        roundResult = 'draw';
        setResult("It's a Draw! 🤝");
      }
      
      setRoundHistory(prev => [...prev, { 
        player: playerMove, 
        opponent: opponentMove, 
        result: roundResult 
      }]);
      setShowResult(true);
      
      setTimeout(() => {
        setPlayerChoice(null);
        setOpponentChoice(null);
        setShowResult(false);
        setResult('');
      }, 3000);
    });

    socket.on("matchEnded", (winnerSocketId) => {
      const isWinner = winnerSocketId === socket.id;
      setMatchEnded(true);
      setTimeout(() => {
        setResult(`🏆 ${isWinner ? 'You' : 'Your opponent'} won the match!`);
      }, 1000);
    });

    socket.on("matchCancelled", () => {
      alert('Opponent disconnected. Match cancelled.');
      startNewGame();
    });

    return () => {
      socket.off("roomCreated");
      socket.off("startGame");
      socket.off("roundResult");
      socket.off("matchEnded");
      socket.off("matchCancelled");
    };
  }, []);

  // Check URL for room invite
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromLink = params.get("room");

    if (roomFromLink && !gameMode) {
      setGameMode("multiplayer");
      setBestOf("joined"); // Mark as joined via invite
      setRoomId(roomFromLink);
      socket.emit("joinRoom", roomFromLink);
    }
  }, [gameMode]);

  const getComputerChoice = () => choices[Math.floor(Math.random() * 3)];

  const determineWinner = (player, computer) => {
    if (player === computer) return "draw";
    if (
      (player === "rock" && computer === "scissors") ||
      (player === "paper" && computer === "rock") ||
      (player === "scissors" && computer === "paper")
    ) return "player";
    return "opponent";
  };

  const handleChoice = (choice) => {
    if (matchEnded || playerChoice) return;

    if (gameMode === "computer") {
      setPlayerChoice(choice);
      const compChoice = getComputerChoice();

      setTimeout(() => {
        setOpponentChoice(compChoice);
        const winner = determineWinner(choice, compChoice);
        const newScores = { ...scores };

        if (winner === "player") {
          newScores.player += 1;
          setResult("You Win This Round! 🎉");
        } else if (winner === "opponent") {
          newScores.opponent += 1;
          setResult("Computer Wins This Round! 🤖");
        } else {
          setResult("It's a Draw! 🤝");
        }

        setScores(newScores);
        setRoundHistory(prev => [...prev, { 
          player: choice, 
          opponent: compChoice, 
          result: winner 
        }]);
        setShowResult(true);

        const maxWins = bestOf === "BO5" ? 3 : 2;
        if (newScores.player >= maxWins || newScores.opponent >= maxWins) {
          const finalWinner = newScores.player > newScores.opponent ? "You" : "Computer";
          setMatchEnded(true);
          setTimeout(() => {
            setResult(`🏆 ${finalWinner} won the match!`);
          }, 2000);
        } else {
          setTimeout(() => {
            setPlayerChoice(null);
            setOpponentChoice(null);
            setShowResult(false);
            setResult("");
          }, 3000);
        }
      }, 800);
    } else if (gameMode === "multiplayer") {
      setPlayerChoice(choice);
      socket.emit("playerMove", { roomId, move: choice });
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/game?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startNewGame = () => {
    setGameMode(null);
    setBestOf(null);
    setRoomId("");
    setGameStarted(false);
    setWaitingForOpponent(false);
    setMatchEnded(false);
    setScores({ player: 0, opponent: 0 });
    setRoundHistory([]);
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult("");
    setShowResult(false);
    window.history.replaceState({}, "", "/game");
  };

  const createMultiplayerRoom = (mode) => {
    setBestOf(mode);
    socket.emit("createRoom", { mode });
  };

  // Mode Selection Screen
  if (!gameMode && (!bestOf || bestOf === "joined")) {
    if (bestOf === "joined") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <div className="animate-pulse text-6xl mb-4">🎮</div>
          <h2 className="text-4xl font-bold text-white mb-4">Joining Game...</h2>
          <p className="text-purple-200">Please wait</p>
        </div>
      </div>
    );
  }
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl w-full">
          <div className="space-y-4">
            <div className="text-8xl mb-4">🎮</div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">
              Rock Paper Scissors
            </h1>
            <p className="text-xl text-purple-200">Choose your game mode</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div 
              onClick={() => setGameMode("multiplayer")}
              className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/20 hover:border-purple-400 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Multiplayer</h3>
              <p className="text-purple-200">Play with a friend online</p>
            </div>

            <div 
              onClick={() => setGameMode("computer")}
              className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/20 hover:border-blue-400 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">vs Computer</h3>
              <p className="text-purple-200">Challenge the AI</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Best Of Selection
  if (!bestOf || bestOf === "joined") {
    // If joined via invite link, show waiting/loading state
    if (bestOf === "joined") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
          <div className="text-center space-y-8 max-w-2xl w-full">
            <div className="animate-pulse text-6xl mb-4">🎮</div>
            <h2 className="text-4xl font-bold text-white mb-4">Joining Game...</h2>
            <p className="text-purple-200">Please wait</p>
          </div>
        </div>
      );
    }

    // Show selection screen for room creator
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <button
            onClick={() => setGameMode(null)}
            className="flex items-center gap-2 mb-4 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          
          <h2 className="text-4xl font-bold text-white mb-8">Choose Game Length</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => {
                if (gameMode === "computer") {
                  setBestOf("BO3");
                  setGameStarted(true);
                } else {
                  createMultiplayerRoom("BO3");
                }
              }}
              className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 hover:border-yellow-400 cursor-pointer transform hover:scale-105 transition-all duration-300"
            >
              <Target className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">Best of 3</h3>
              <p className="text-purple-200">First to 2 wins</p>
            </div>

            <div
              onClick={() => {
                if (gameMode === "computer") {
                  setBestOf("BO5");
                  setGameStarted(true);
                } else {
                  createMultiplayerRoom("BO5");
                }
              }}
              className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 hover:border-orange-400 cursor-pointer transform hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">Best of 5</h3>
              <p className="text-purple-200">First to 3 wins</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room for Multiplayer
  if (waitingForOpponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <div className="animate-pulse text-6xl mb-4">⏳</div>
          <h2 className="text-4xl font-bold text-white mb-4">Waiting for Opponent...</h2>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <p className="text-purple-200 mb-3 text-sm">Share this invite link:</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={`${window.location.origin}/game?room=${roomId}`}
                readOnly
                className="flex-1 bg-white/5 text-white px-4 py-3 rounded-xl border border-white/20 text-sm"
              />
              <button
                onClick={copyInviteLink}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 shrink-0"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={startNewGame}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Main Game Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/20">
            <p className="text-purple-200 text-sm">Best of {bestOf === "BO5" ? "5" : "3"}</p>
            <p className="text-white font-bold text-lg">
              {gameMode === "computer" ? "vs Computer" : "Multiplayer"}
            </p>
          </div>

          <button
            onClick={startNewGame}
            className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white px-6 py-3 rounded-2xl border border-white/20 transition-all"
          >
            New Game
          </button>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-400/30 text-center">
            <p className="text-green-200 mb-2 text-sm">You</p>
            <p className="text-5xl font-bold text-white">{scores.player}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-400/30 text-center">
            <p className="text-red-200 mb-2 text-sm">
              {gameMode === "computer" ? "Computer" : "Opponent"}
            </p>
            <p className="text-5xl font-bold text-white">{scores.opponent}</p>
          </div>
        </div>

        {/* Result Display */}
        {showResult && playerChoice && opponentChoice && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8 text-center">
            <div className="flex justify-center items-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-purple-200 mb-2 text-sm">You</p>
                <div className="text-7xl">{choiceDisplay[playerChoice].emoji}</div>
                <p className="text-white mt-2 font-semibold">{choiceDisplay[playerChoice].name}</p>
              </div>
              <div className="text-3xl text-white font-bold">VS</div>
              <div className="text-center">
                <p className="text-purple-200 mb-2 text-sm">
                  {gameMode === "computer" ? "Computer" : "Opponent"}
                </p>
                <div className="text-7xl">{choiceDisplay[opponentChoice].emoji}</div>
                <p className="text-white mt-2 font-semibold">{choiceDisplay[opponentChoice].name}</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{result}</p>
          </div>
        )}

        {/* Choice Buttons */}
        {!showResult && !matchEnded && (
          <>
            <p className="text-center text-2xl text-white font-semibold mb-6">
              {playerChoice && gameMode === "multiplayer" 
                ? "Waiting for opponent..." 
                : "Make your choice"}
            </p>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {choices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  disabled={playerChoice !== null}
                  className="group bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-3xl p-12 border-2 border-white/20 hover:border-purple-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-white/20"
                >
                  <div className="text-8xl mb-4">{choiceDisplay[choice].emoji}</div>
                  <p className="text-2xl font-bold text-white">{choiceDisplay[choice].name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Match End Display */}
        {matchEnded && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-8 border border-yellow-400/30 mb-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-4xl font-bold text-white mb-2">
              {scores.player > scores.opponent ? "Victory!" : "Defeat"}
            </p>
            <p className="text-2xl text-purple-200">{result}</p>
          </div>
        )}

        {/* Round History */}
        {roundHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Round History</h3>
            <div className="space-y-2">
              {roundHistory.map((round, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <span className="text-purple-200 text-sm">Round {index + 1}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl">{choiceDisplay[round.player].emoji}</div>
                      <p className="text-xs text-purple-200 mt-1">{choiceDisplay[round.player].name}</p>
                    </div>
                    <span className="text-white text-sm">vs</span>
                    <div className="text-center">
                      <div className="text-2xl">{choiceDisplay[round.opponent].emoji}</div>
                      <p className="text-xs text-purple-200 mt-1">{choiceDisplay[round.opponent].name}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${
                    round.result === "player" ? "text-green-400" :
                    round.result === "opponent" ? "text-red-400" :
                    "text-yellow-400"
                  }`}>
                    {round.result === "player" ? "Win" : round.result === "opponent" ? "Loss" : "Draw"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;