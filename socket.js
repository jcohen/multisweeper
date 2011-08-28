var MineSweeper = require('./mine').MineSweeper;

module.exports = function(app) {
    var io = require("socket.io").listen(app);

    var games = {};

    var RedisGameClient = require("./redis-game-client");
    var gameClient = new RedisGameClient();

    io.sockets.on("connection", function (socket) {
        socket.on("join", function(playerData) {
            gameClient.getAvailableGame(function(err, game) {
                gameClient.addPlayerToGame(game, playerData.playerName, function(err, data) {
                    if (err) {
                        if (err.error === "NAME_IN_USE") {
                            return socket.emit("name-in-use", playerData.playerName);
                        }
                    }

                    var updatedGame = data.game;
                    var player = data.player;

                    socket.join(updatedGame.gameId);

                    socket.emit("game-assignment", {
                        "gameId" : updatedGame.gameId,
                        "players" : updatedGame.players,
                        "player" : player,
                        "board": updatedGame.board.state(),
                        "active": updatedGame.board.started ? 'active' : 'inactive'
                    });

                    socket.broadcast.to(updatedGame.gameId).emit("new-player", {
                        "gameId" : updatedGame.gameId,
                        "players" : updatedGame.players,
                        "board": updatedGame.board.state(),
                        "player": player,
                        "active": updatedGame.board.started ? 'active' : 'inactive'
                    });
                });
            });
        });

        socket.on("chat", function(data) {
            gameClient.getGame(data.game, function(err, game) {
                if (err) {
                    return;
                }
                socket.emit("chat", data);
                socket.broadcast.to(game.gameId).emit("chat", data);
            });
        });

        socket.on("start", function beginGame(data) {
            gameClient.getGame(data.game, function(err, game) {
                if (err) {
                    return;
                }
                game.board.startGame();
                gameClient.updateGame(game, function(err, updatedGame) {
                    console.log("broadcasting new game start");

                    data.board = updatedGame.board.state();
                    data.players = updatedGame.players;

                    socket.emit("game-start", data);
                    socket.broadcast.to(game.gameId).emit("game-start", data);
                });
            });
        });

        socket.on("flag", function handleTurn(data) {
            gameClient.getGame(data.game, function(err, game) {
                if (err) {
                    return;
                }
                if (!game.board.started) {
                    return;
                }
                game.board.display();
                game.board.toggleFlag(data.x,data.y);
                gameClient.updateGame(game, function(err, updatedGame) {
                    console.log("broadcasting new game state");

                    data.board = updatedGame.board.state();
                    data.players = updatedGame.players;
                    data.active = updatedGame.board.started ? 'active' : 'inactive'

                    socket.emit("move-made", data);
                    socket.broadcast.to(game.gameId).emit("move-made", data);

                    if (game.board.over(game)) {
                        gameClient.endGame(game, function (err) {
                            socket.emit("end-game", data);
                            socket.broadcast.to(game.gameId).emit("end-game", data);
                            gameClient.postScores(game.players, function(err) {
                                if (err) {
                                    console.log("Error:" + err);
                                }
                            });
                            return;
                        });
                    }
                });
            });
        });

        socket.on("turn", function handleTurn(data) {
            gameClient.getGame(data.game, function(err, game) {
                if (err) {
                    return;
                }
                if (!game.board.started) {
                    return;
                }
                game.board.display();
                var points = game.board.revealed;
                var outcome = game.board.revealTile(data.x,data.y, true);
                points = game.board.revealed - points;
                adjustScore(game.players, data.playerName, points);
                data.players = game.players;
                console.log("Points: %s", points);
                if (!outcome) {
                    adjustScore(game.players, data.playerName, MineSweeper.BOMB_PENALTY);
                    data.players = game.players;
                    socket.emit("mine-hit", data);
                    socket.broadcast.to(game.gameId).emit("mine-hit", data);
                    console.log("Hit a mine at %s,%s",data.x,data.y);
                }
                game.board.display();

                gameClient.updateGame(game, function(err, updatedGame) {
                    console.log("broadcasting new game state");

                    data.board = updatedGame.board.state();
                    data.active = updatedGame.board.started ? 'active' : 'inactive'
                    socket.emit("move-made", data);
                    socket.broadcast.to(game.gameId).emit("move-made", data);

                    if (game.board.over(game)) {
                        gameClient.endGame(game, function (err) {
                            socket.emit("end-game", data);
                            socket.broadcast.to(game.gameId).emit("end-game", data);
                            gameClient.postScores(game.players, function(err) {
                                if (err) {
                                    console.log("Error:" + err);
                                }
                            });
                            return;
                        });
                    }
                });
            });
        });

        function adjustScore(players, player, amount) {
            for (var i=0;i<players.length;i++) {
                if (players[i].playerName === player) {
                    console.log("Adjusting %s score: %d, by %d", player, players[i].score, amount);
                    players[i].score += amount;
                }
            }
        }
    });
};