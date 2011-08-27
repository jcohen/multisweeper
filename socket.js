var MineSweeper = require('./mine').MineSweeper;

module.exports = function(app) {
    var io = require("socket.io").listen(app);

    var games = {};

    var RedisGameClient = require("./redis-game-client");
    var gameClient = new RedisGameClient();

    io.sockets.on("connection", function (socket) {
        socket.on("join", function(player) {
            player['score'] = 0;
            // TODO: ensure player name is unique to game
            gameClient.getAvailableGame(function(err, game) {
                game.players.push(player);
                gameClient.updateGame(game, function(err, updatedGame) {
                    socket.join(updatedGame.id);

                    socket.emit("game-assignment", {
                        "gameId" : updatedGame.gameId,
                        "players" : updatedGame.players,
                        "board": updatedGame.board.state()
                    });

                    socket.broadcast.to(updatedGame.id).emit("new-player", {
                        "gameId" : updatedGame.gameId,
                        "players" : updatedGame.players,
                        "board": updatedGame.board.state(),
                        "player": player
                    });
                });
            });
        });

        socket.on("turn", function handleTurn(data) {
            gameClient.getGame(data.game, function(err, game) {
                if (err) {
                    return;
                }
                game.board.display();
                var points = game.board.revealed;
                var outcome = game.board.revealTile(data.x,data.y);
                points = game.board.revealed - points;
                for (var i=0;i<game.players.length;i++) {
                    if (game.players[i].playerName === data.playerName) {
                        game.players[i].score += points;
                    }
                }
                data.players = game.players;
                console.log("Points: %s", points);
                if (!outcome) {
                    socket.emit("mine-hit", data);
                    socket.broadcast.to(game.id).emit("mine-hit", data);
                    console.log("Hit a mine at %s,%s",data.x,data.y);
                    return;
                }
                else {
                    game.board.display();

                    gameClient.updateGame(game, function(err, updatedGame) {
                        console.log("broadcasting new game state");

                        data.board = updatedGame.board.state();

                        socket.emit("move-made", data);
                        socket.broadcast.to(game.id).emit("move-made", data);

                        if (game.board.over(game)) {
                            gameClient.endGame(game, function (err) {
                                socket.emit("end-game", data);
                                socket.broadcast.to(game.id).emit("end-game", data);
                                return;
                            });
                        }
                    });
                }
            });
        });
    });
};