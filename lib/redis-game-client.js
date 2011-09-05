var MineSweeper = require('./mine').MineSweeper;

var client = require("redis").createClient();

client.on("error", function (err) {
    console.log("Redis Error " + err);
});

var GAMES_KEY = "games";
var FILLING_GAME_ID_KEY = "filling-game-id";
var HIGHSCORE_KEY = "scores";
var LOCK_KEY = "lock";
var TOTAL_GAMES = "total_games";
var TOTAL_PLAYERS = "total_players";
var TOTAL_BOMBS = "total_bombs";

var DEFAULT_LOCK_EXPIRATION = 100; // 100 ms
var LOCK_ACQUISITION_INTERVAL = 1; // 1 ms
var LOCK_ACQUISITION_TIMEOUT = 200; // 200 ms

var MAX_PLAYERS = 7;

function lockKeyForIdentifier(identifier) {
    if (typeof identifier === "object") {
        // assume it's a game
        identifier = identifier.gameId;
    }
    return LOCK_KEY + "." + identifier;
}

var RedisGameClient = module.exports = function() {

};

// store game: HSET games game-id JSON.stringify(game)
// get game: HGET games game-id
// get all games: HGETALL games
// set pointer to currently filling game: HSET games working game-id
// get pointer to currently filling game: HGET games working
// delete pointer to currently filling game: HDEL games working

/*
 * Redis Lock acquisition, see: http://redis.io/commands/setnx
 */
RedisGameClient.prototype.acquireLock = function(game, timeout, callback) {
    if (typeof timeout === "function") {
        callback = timeout;
        timeout = new Date().getTime() + LOCK_ACQUISITION_TIMEOUT;
    }

    var gameLockId = lockKeyForIdentifier(game);

    console.log("Trying to acquire lock on game: %s, timeout is: %d, current time is: %d", gameLockId, timeout, new Date().getTime());

    if (new Date().getTime() >= timeout) {
        console.log("Timed out trying to acquire lock for game: %s, giving up :(", gameLockId);
        callback(null, { "acquired" : false });
    }

    var that = this;


    function expirationTime() {
        return new Date().getTime() + DEFAULT_LOCK_EXPIRATION + 1;
    }

    var expiration = expirationTime();
    client.setnx(gameLockId, expiration, function(err, data) {
        if (err) {
            console.log("Error acquiring lock: " + err);
            return callback(null, { "acquired" : false });
        }

        var acquired = (data === 1);

        if (acquired) {
            console.log("Lock acquired!");
            // invoke callback normally
            callback(null, { "acquired" : true, "expiration" : expiration });
        } else {
            console.log("Lock not acquired, checking if lock is expired...");
            // check to see if lock is expired
            client.get(gameLockId, function(err, expiration) {
                if (err) {
                    console.log("Error acquiring lock: " + err);
                    return callback(null, { "acquired" : false });
                }

                console.log("Lock expiration: %s", expiration);

                expiration = (expiration * 1);

                if (new Date().getTime() >= expiration) {
                    console.log("Lock is expired, trying to acquire and avoid deadlock...");

                    // lock is expired, try to update the expiration while avoiding a deadlock
                    var newExpiration = expirationTime();
                    client.getset(gameLockId, newExpiration, function(err, data) {
                        if (err) {
                            console.log("Error acquiring lock: " + err);
                            return callback(null, { "acquired" : false });
                        }

                        console.log("Previous expiration on lock: %s", data);

                        var previousExpiration = (data * 1);

                        if (new Date().getTime() >= previousExpiration) {
                            console.log("Lock (finally!) acquired.");
                            callback(null, { "acquired" : true, "expiration" : newExpiration });
                        } else {
                            // someone else acquired the lock before us, start over.
                            console.log("Someone beat us to the lock, oh no! Starting over.");
                            return that.acquireLock(game, timeout, callback);
                        }
                    });
                } else {
                    console.log("Lock is not expired, trying again to acquire in %d ms", LOCK_ACQUISITION_INTERVAL);
                    setTimeout(function() {
                        that.acquireLock(game, timeout, callback);
                    }, LOCK_ACQUISITION_INTERVAL);
                }
            });
        }
    });
};

RedisGameClient.prototype.releaseLock = function(game, callback) {
    var identifier = lockKeyForIdentifier(game);
    console.log("Releasing lock for game: %s", identifier);
    client.del(identifier, callback || function() {});
};

RedisGameClient.prototype.createGame = function(callback) {
    var game = {
        "board" : new MineSweeper(),
        "players" : []
    };

    game.gameId = game.board.uuid;

    console.log("Created new game: %j", game);

    client.incr(TOTAL_GAMES);

    this.updateGame(game, callback);
};

RedisGameClient.prototype.updateGame = function(game, callback, skipLock) {
    console.log("Updating game: %j", game);

    var that = this;
    if (!skipLock) {
        this.acquireLock(game, function(err, lock) {
            if (err || !lock.acquired) {
                console.log("Could not acquire lock");
                return callback(err || lock, null);
            }

            performUpdate();
        });
    } else {
        performUpdate();
    }

    function performUpdate() {
        client.hset(GAMES_KEY, game.gameId, JSON.stringify(game), function(err, data) {
            if (!skipLock) {
                that.releaseLock(game);
            }

            if (err) {
                return callback(err, null);
            }

            return callback(null, game);
        });
    }
};

RedisGameClient.prototype.endGame = function(game, callback) {
    console.log("Ending game with id: %s", game.board.uuid);

    client.hdel(GAMES_KEY, game.gameId, function(err, data) {
        console.log(err);
        console.log(data);
       if (err) {
           return callback(err);
       }
       client.hset(GAMES_KEY, FILLING_GAME_ID_KEY, '', function(err) {
           if (err) {
               return callback(err);
           }
           callback(null);
       });
    });
}

RedisGameClient.prototype.getGame = function(gameId, callback) {
    console.log("Retrieving game with id: %s", gameId);

    client.hget(GAMES_KEY, gameId, function(err, data) {
        if (err) {
            return callback(err, null);
        }
        // try {
            if (!data) {
                console.error("Game doesn't exist: %s", gameId);
                return callback(new Error(), null);
            };
            var game = JSON.parse(data);
            game.board = new MineSweeper(game.board);
            return callback(null, game);
        // } catch (e) {
        //     console.error("Failed to parse data for game: %s (%s). Exception is: %s", gameId, data, e);
        //     callback(new Error(), null);
        // }
    });
};

RedisGameClient.prototype.addPlayerToGame = function(game, playerName, callback) {
    var that = this;
    this.acquireLock(game, function(err, lock) {
        if (err || !lock.acquired) {
            console.log("Could not acquire lock for available game id...");
            return callback(err || lock, null);
        }

        that.getGame(game.gameId, function(err, latestGame) {
            if (err) {
                that.releaseLock(game);
                return callback(err, null);
            }

            var colors = [ "blue", "green", "orange", "pink", "purple", "red", "yellow" ];

            function randomColor() {
                return colors[Math.floor(Math.random() * colors.length)]
            }

            var color = randomColor();

            for (var i = 0, l = latestGame.players.length; i < l; i++) {
                var player = latestGame.players[i];

                if (player.playerName === playerName) {
                    that.releaseLock(game);
                    return callback({ "error" : "NAME_IN_USE" }, null);
                }

                while (player.color === color) {
                    colors.splice(colors.indexOf(color), 1);
                    color = randomColor();
                }
            }

            var player = { "playerName" : playerName, "color" : color, "score" : 0 };
            latestGame.players.push(player);

            client.incr(TOTAL_PLAYERS);
            console.log("Players after push: %j", latestGame.players);

            that.updateGame(latestGame, function(err, updatedGame) {
                that.releaseLock(game);

                if (err) {
                    return callback(err, null);
                }

                return callback(null, { "game" : updatedGame, "player" : player });
            }, true); // we're already locked, so tell update to skip acquiring

        });
    });
};

RedisGameClient.prototype.reactivatePlayerInGame = function(playerName, game, callback) {
    console.log("Trying to reactivate player: %s in game: %s", playerName, game.gameId);

    var playerFound = false;
    for (var i = 0, l = game.players.length; i < l; i++) {
        var player = game.players[i];

        if (player.playerName === playerName) {
            playerFound = true;
            player.active = true;

            this.updateGame(game, function(err, updatedGame) {
                if (err) {
                    return callback(err, null);
                }

                return callback(null, { "game" : updatedGame, "player" : player });
            });
            break;
        }
    }

    if (!playerFound) {
        return callback({ "error" : "player-not-found"}, null);
    }
};

RedisGameClient.prototype.removePlayerFromGame = function(playerName, game, callback) {
    console.log("Trying to remove player: %s from game: %s", playerName, game.gameId);

    var playerFound = false;
    for (var i = 0, l = game.players.length; i < l; i++) {
        var player = game.players[i];
        console.log("Player at index %d is: %j", i, player);

        if (player.playerName === playerName) {
            playerFound = true;
            game.players.splice(i, 1);

            this.updateGame(game, function(err, updatedGame) {
                if (err) {
                    return callback(err, null);
                }

                return callback(null, { "game" : updatedGame, "player" : player });
            });
            break;
        }
    }

    if (!playerFound) {
        return callback({ "error" : "player-not-found"}, null);
    }
};

RedisGameClient.prototype.getAvailableGame = function(callback) {
    console.log("Getting available game...");
    var that = this;

    this.acquireLock(FILLING_GAME_ID_KEY, function(err, lock) {
        if (err || !lock.acquired) {
            console.log("Could not acquire lock for available game id...");
            return callback(err || lock, null);
        }

        client.hget(GAMES_KEY, FILLING_GAME_ID_KEY, function(err, gameId) {
            if (err) {
                that.releaseLock(FILLING_GAME_ID_KEY);
                return callback(err, null);
            }

            console.log("Available game id is: %s", gameId);

            if (!gameId) {
                console.log("No available game id, creating new one...");
                createGameAndUpdateAvailable();
            } else {
                console.log("Retrieving game for game id: %s", gameId);
                that.getGame(gameId, function(err, game) {
                    console.log("Got game for game id: %j", game);
                    console.log("Game has %d players", game.players.length);
                    if (game.players.length < MAX_PLAYERS) {
                        that.releaseLock(FILLING_GAME_ID_KEY);
                        console.log("Game is not full, returning");
                        callback(null, game);
                    } else {
                        console.log("Game is full, creating new game");
                        createGameAndUpdateAvailable();
                    }
                });
            }
        });

    });

    function createGameAndUpdateAvailable() {
        that.createGame(function(err, game) {
            client.hset(GAMES_KEY, FILLING_GAME_ID_KEY, game.gameId);
            that.releaseLock(FILLING_GAME_ID_KEY);
            callback(null, game);
        });
    }
};

RedisGameClient.prototype.postScores = function(players, callback) {
    for (var i=0;i<players.length;i++) {
        var who = players[i].playerName;
        var score = players[i].score;
        postScore(who, score);
    }

    function postScore (who, score) {
        client.zscore(HIGHSCORE_KEY, who, function(err, data) {
            if (err) {
                return;
            }
            console.log("score exists %d %d", data, score);
            if (data > score) {
                console.log("not a high score for %s %d",who, score);
                return;
            } else {
                console.log("high score for %s %d",who, score);
                client.zadd(HIGHSCORE_KEY, score, who);
            }
        })
    }
};


RedisGameClient.prototype.loadScores = function(callback) {
    client.zrevrangebyscore(HIGHSCORE_KEY, '+inf', '-inf', 'withscores', 'limit', 0, 100, function(err, data) {
        if (err) {
            callback(err);
        }
        callback(null, data);
    });
}

RedisGameClient.prototype.stat = function(which) {
    //Very short whitelist for now.. ;)
    console.log("bomb up %s %s", which, TOTAL_BOMBS);
    if (which === TOTAL_BOMBS) {
        console.log("actually bombing");
        client.incr(TOTAL_BOMBS);
    }
}

RedisGameClient.prototype.stats = function(callback) {
    client.get(TOTAL_GAMES, function(err, data) {
        if (err) {
            callback(err);
        }
        var games = 0;
        if (data) {
            games = data; 
        }
        client.get(TOTAL_PLAYERS, function(err, data) {
            if (err) {
                callback(err);
            } 
            var players = 0;
            if (data) {
                players = data;  
            } 
            client.get(TOTAL_BOMBS, function(err, data) {
                if (err) {
                    callback(err);
                } 
                var bombs = 0;
                if (data) {
                    bombs = data;  
                } 
                callback(null, {"games": games, "players": players, "bombs": bombs});
          });
        });
    });
}
