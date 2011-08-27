var MineSweeper = require('./mine').MineSweeper;

module.exports = function(app) {
    var io = require("socket.io").listen(app);

    var games = {};

    var RedisGameClient = require("./redis-game-client");
    var gameClient = new RedisGameClient();

    io.sockets.on("connection", function (socket) {
        socket.on("join", function(player) {
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

                    socket.broadcast.to(updatedGame.id).emit("new-player", player);
                });
            });
        });

        socket.on("turn", function handleTurn(data) {
            gameClient.getGame(data.game, function(err, game) {
                game.board.display();
                var outcome = game.board.revealTile(data.x,data.y);
                console.log("Outcome: %s", outcome);
                if (!outcome) {
                    console.log("Hit a mine at %s,%s",data.x,data.y);
                    gameClient.endGame(game, function(err) {
                        socket.emit("end-game", data);
                        socket.broadcast.to(game.id).emit("end-game", data);
                        return;
                    });
                }
                else {
                    game.board.display();

                    gameClient.updateGame(game, function(err, updatedGame) {
                        console.log("broadcasting new game state");

                        data.board = updatedGame.board.state();

                        socket.emit("move-made", data);
                        socket.broadcast.to(game.id).emit("move-made", data);
                    });
                }
            });
        });
    });
};