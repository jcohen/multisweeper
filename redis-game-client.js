var MineSweeper = require('./mine').MineSweeper;

var client = require("redis").createClient();

client.on("error", function (err) {
    console.log("Redis Error " + err);
});

var GAMES_KEY = "games";
var FILLING_GAME_ID_KEY = "filling-game-id";
var HIGHSCORE_KEY = "scores";
var LOCK_KEY = "lock";
var DEFAULT_LOCK_EXPIRATION = 100; // 100 ms
var LOCK_ACQUISITION_INTERVAL = 1; // 1 ms
var LOCK_ACQUISITION_TIMEOUT = 200; // 200 ms

var MAX_PLAYERS = 8;

function lockKeyForGame(game) {
    return LOCK_KEY + "." + game.gameId;
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

    console.log("Trying to acquire lock on game: %s, timeout is: %d", game.gameId, timeout);

    if (new Date().getTime() >= timeout) {
        console.log("Timed out trying to acquire lock for game: %s, giving up :(", game.gameId);
        callback(null, { "acquired" : false });
    }

    var that = this;
    var gameLockId = lockKeyForGame(game);

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
                            return that.acquireLock(game, expiration, callback);
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
    console.log("Releasing lock for game: %s", game.gameId);
    client.del(lockKeyForGame(game), callback);
};

RedisGameClient.prototype.createGame = function(callback) {
    var game = {
        "board" : new MineSweeper(),
        "players" : []
    };

    game.gameId = game.board.uuid;

    console.log("Created new game: %j", game);

    this.updateGame(game, callback);
};

RedisGameClient.prototype.updateGame = function(game, callback) {
    console.log("Updating game: %j", game);

    client.hset(GAMES_KEY, game.gameId, JSON.stringify(game), function(err, data) {
        if (err) {
            return callback(err, null);
        }

        return callback(null, game);
    });
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
        try {
            if (!data) {
                console.error("Game doesn't exist: %s", gameId);
                return callback(new Error(), null);
            };
            var game = JSON.parse(data);
            game.board = new MineSweeper(game.board);
            return callback(null, game);
        } catch (e) {
            console.error("Failed to parse data for game: %s (%s). Exception is: %s", gameId, data, e);
            callback(new Error(), null);
        }
    });
};

RedisGameClient.prototype.getGames = function(callback) {
    // client.hgetall(GAMES_KEY, function(err, games) {
    //
    // });
};

RedisGameClient.prototype.getAvailableGame = function(callback) {
    console.log("Getting available game...");
    var that = this;
    client.hget(GAMES_KEY, FILLING_GAME_ID_KEY, function(err, gameId) {
        if (err) {
            return callback(err, null);
        }
        console.log(typeof gameId);
        console.log("Available game id is: %s", gameId);

        if (!gameId) {
            console.log("No available game id, creating new one...");
            createGameAndUpdateAvailable();
        } else {
            console.log("Retrieving game for game id: %s", gameId);
            that.getGame(gameId, function(err, game) {
                console.log("Got game for game id: %j", game);
                if (game.players.length < MAX_PLAYERS) {
                    console.log("Game is not full, returning");
                    callback(null, game);
                } else {
                    console.log("Game is full, creating new game");
                    createGameAndUpdateAvailable();
                }
            });
        }
    });

    function createGameAndUpdateAvailable() {
        that.createGame(function(err, game) {
            client.hset(GAMES_KEY, FILLING_GAME_ID_KEY, game.gameId);
            callback(null, game);
        });
    }
};

RedisGameClient.prototype.postScores = function(players, callback) {
    for (var i=0;i<players.length;i++) {
        client.zadd(HIGHSCORE_KEY, players[i].score, players[i].playerName);
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
