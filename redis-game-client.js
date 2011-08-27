var MineSweeper = require('./mine').MineSweeper;

var client = require("redis").createClient();

client.on("error", function (err) {
    console.log("Redis Error " + err);
});

var GAMES_KEY = "games";
var FILLING_GAME_ID_KEY = "filling-game-id";

var MAX_PLAYERS = 8;

var RedisGameClient = module.exports = function() {

};

// store game: HSET games game-id JSON.stringify(game)
// get game: HGET games game-id
// get all games: HGETALL games
// set pointer to currently filling game: HSET games working game-id
// get pointer to currently filling game: HGET games working
// delete pointer to currently filling game: HDEL games working

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