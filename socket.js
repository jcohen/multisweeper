module.exports = function(app) {
    var io = require("socket.io").listen(app);


    var games = {};

    io.sockets.on("connection", function (socket) {
        socket.on("join", function(data) {
            var gameId = "some-game-id"; // TODO: find a game waiting for more players or create a new one

            var game = games[gameId];
            if (!game) {
                game = games[gameId] = {
                    "id" : gameId,
                    "players" : []
                };
            }

            game.players.push(data);

            console.log("players: ", game.players);

            socket.join(game.id);
            socket.emit("game-assignment", {
                "gameId" : game.id,
                "players" : game.players
            });

            socket.broadcast.to(game.id).emit("new-player", data);
        });

        socket.on("turn", function handleTurn(data) {
            console.log("games: %j", games);
            var game = games[data.game];

            if (!game) {
                console.log("Unknown game: %s", data.game);
                // TODO: message to user
                return;
            }

            console.log("handling turn in game %s with data: %j", game.id, data);

            socket.broadcast.to(game.id).emit("move-made", data);
        });

        socket.on("reveal", function(data) {
            console.log(data);
            client.get(data.id, function(err, replies) {
                if (err) {
                    console.log("Error fetching board:" + data.id);
                }
                var mine = new MineSweeper(replies);
                mine.revealTile(data.x,data.y);
                client.set(mine.uuid, JSON.stringify(mine), function(err, replies) {
                    if (err) {
                        console.log("Error saving new")
                    }
                    io.sockets.emit("revealed", mine.state());
                });
            });
        });
    });
};