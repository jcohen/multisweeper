(function(multisweeper, $) {
    var Game = multisweeper.Game = function(playerName) {
        this.playerName = playerName;
    };

    var util = new multisweeper.Utils();

    Game.prototype.join = function(callback) {
        var that = this;
        this.socket = io.connect("http://localhost");

        this.socket.emit("join", { "playerName" : this.playerName });

        this.socket.on("game-assignment", function(data) {
            that.state = data;
            util.log("Got game assignment: <b>" + data.gameId + "</b>");

            that.gameId = data.gameId;
            // that.gameSocket = io.connect("http://localhost/" + that.gameId);

            that.socket.on("new-player", playerJoined);
            that.socket.on("move-made", moveMade);

            callback();
        });
    };

    Game.prototype.takeTurn = function(board, x, y) {
        this.socket.emit("turn", { "game" : this.gameId, "playerName" : this.playerName, "time" : new Date().getTime(), "move": board + "," + x + "," + y });
    };

    function playerJoined(data) {
        util.log("<b>" + data.playerName + "</b> joined the game!");
    }

    function moveMade(data) {
        util.log("<b>" + data.playerName + "</b> made a move: <b>" + data.move + "</b> in game: <b>" + data.game + "</b>");
    }
})(window.multisweeper = window.multisweeper || {}, jQuery);