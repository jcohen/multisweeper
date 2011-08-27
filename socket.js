var MineSweeper = require('./mine').MineSweeper;
var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
  console.log("Redis Error " + err);
});

module.exports = function(app) {
    var io = require("socket.io").listen(app);

    var games = {};

    io.sockets.on("connection", function (socket) {
        socket.on("join", function(data) {
            var gameId;
            var mine;
            for (game in games) {
                console.log("GAME %j", game);
                gameId = game;
            }
            if (gameId === undefined) {
                console.log("Spinning up a new game...");
                mine = new MineSweeper();
                gameId = mine.uuid;
                client.set(mine.uuid, JSON.stringify(mine), function(err, replies) {
                    if (err) {
                        console.log("Error saving new game %s", mine.uuid);
                    }
                    socket.join(game.id);
                    socket.emit("game-assignment", {
                        "gameId" : game.id,
                        "players" : game.players,
                        "board": JSON.stringify(mine.state())
                    });

                    socket.broadcast.to(game.id).emit("new-player", data);
                });
            } else {
                client.get(game.id, function(err, replies) {
                    if (err) {
                        console.log("Error fetching board:" + data.id);
                    }
                    mine = new MineSweeper(replies);
                    socket.join(game.id);
                    socket.emit("game-assignment", {
                        "gameId" : game.id,
                        "players" : game.players,
                        "board": JSON.stringify(mine.state())
                    });

                    socket.broadcast.to(game.id).emit("new-player", data);
                });
            }

            var game = games[gameId];
            if (!game) {
                game = games[gameId] = {
                    "id" : gameId,
                    "players" : []
                };
            }

            game.players.push(data);

            console.log("players: ", game.players);
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

            client.get(game.id, function(err, replies) {
                if (err) {
                    console.log("Error fetching board:" + data.id);
                }
                var mine = new MineSweeper(replies);
                mine.display();
                mine.revealTile(data.x,data.y);
                mine.display();
                client.set(mine.uuid, JSON.stringify(mine), function(err, replies) {
                    if (err) {
                        console.log("Error saving new")
                    }
                    data['board']= JSON.stringify(mine.state());
                    console.log("broadcasting new game state");
                    socket.emit("move-made", data);
                    socket.broadcast.to(game.id).emit("move-made", data);
                });
            });


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