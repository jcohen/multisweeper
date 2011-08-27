(function(multisweeper, $) {
    var Game = multisweeper.Game = function(playerName) {
        this.playerName = playerName || "Player 1"; // TODO: get current player count from node
    };

    var util = new multisweeper.Utils();

    Game.prototype.connect = function() {
        this.socket = io.connect("http://localhost");

        this.socket.on("connected", function(data) {
            util.log("Connected. There are <b>" + data.players.length + "</b> other players");

            for (var i = 0, l = data.players.length; i < l; i++) {
                util.log("Player: <b>" + data.players[i].playerName + "</b>");
            }
        });

        this.socket.on("newPlayer", function(data) {
            util.log("Player: <b>" + data.playerName + "</b> connected");
        });

        this.socket.on("moveMade", function(data) {
          util.log("Move made by: <b>" + data.playerName + "</b> at <b>" + data.time + "</b>: " + data.move + "<br />");
        });

        this.socket.emit("register", { "playerName" : this.playerName });
    };

    Game.prototype.takeTurn = function() {
        console.log("Taking a turn...");
        this.socket.emit("turn", { "playerName" : this.playerName, "time" : new Date().getTime(), "move": "some move identifier" });
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);