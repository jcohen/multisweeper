(function(multisweeper, $) {
    var Game = multisweeper.Game = function(playerName) {
        this.playerName = playerName;
    };

    var util = new multisweeper.Utils();

    Game.prototype.join = function(callback) {
        var that = this;
        this.socket = io.connect("/");

        this.socket.emit("join", { "playerName" : this.playerName });

        this.socket.on("game-assignment", function(data) {
            that.state = data;
            util.log("Got game assignment: <b>" + data.gameId + "</b>");
            util.log("Game state is: " + JSON.stringify(data));

            that.gameId = data.gameId;
            that.state = data.board;

            that.socket.on("new-player", playerJoined);
            that.socket.on("end-game", function(data) {
               util.log("<b>" + data.playerName + "</b> hit a bomb! at " + data.x + "," + data.y); 
            });
            that.socket.on("move-made", function(data) {
                util.log("Game state is: " + JSON.stringify(data));

                that.state = data.board;
                util.log("<b>" + data.playerName + "</b> made a move: <b>" + data.x + "," + data.y + "</b> in game: <b>" + data.game + "</b>");
                //TODO: de-dupe
                var templates = new multisweeper.Templates();
                templates.preload();
                templates.get("board", function(template) {
                    $("#main").empty().html(template({uuid: that.gameId, board: that.state}));
                })

            });

            callback();
        });
    };

    Game.prototype.takeTurn = function(board, x, y) {
        this.socket.emit("turn", { "game" : this.gameId, "playerName" : this.playerName, "time" : new Date().getTime(), "x": x, "y": y });
    };

    function playerJoined(data) {
        util.log("<b>" + data.playerName + "</b> joined the game!");
    }
})(window.multisweeper = window.multisweeper || {}, jQuery);
