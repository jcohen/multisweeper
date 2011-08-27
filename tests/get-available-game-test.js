var RGC = require("../redis-game-client");

var gc = new RGC();

function handleAvailableGame(err, game) {
    if (err) {
        console.log("ERROR: could not get available game? %j", err);
    } else {
        console.log("Got game: %s", game.gameId);

        game.players.push({ "playerName" : "player n" });
        gc.updateGame(game, function(err, updatedGame) {

        });
    }
}

for (var i = 0; i < 10; i++) {
    gc.getAvailableGame(handleAvailableGame);
}