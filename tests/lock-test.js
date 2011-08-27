var RGC = require("../redis-game-client");

var gc = new RGC();

var acquired = 0;
var released = 0;

gc.getAvailableGame(function(err, game) {
    function lockHandler(err, lock) {
        if (err) {
            console.log("Error! " + err);
        }
        console.log("Lock acquired?: %s", lock.acquired);

        if (lock.acquired) {
            console.log("Acquired count: %d", ++acquired);
            setTimeout(function() {
                gc.releaseLock(game, function(err, data) {
                    console.log("Lock for game: %s expiration: %s released", game.gameId, lock.expiration);
                    console.log("Released count: %d", ++released);
                });
            }, 50);
        }
    }

    gc.acquireLock(game, lockHandler);
    gc.acquireLock(game, lockHandler);
    gc.acquireLock(game, lockHandler);
    gc.acquireLock(game, lockHandler);
    gc.acquireLock(game, lockHandler);
});