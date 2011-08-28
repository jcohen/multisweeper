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
            that.players = data.players;
            that.player = data.player;
            that.active = data.active;

            that.socket.on("new-player", playerJoined);
            that.socket.on("mine-hit", function(data) {
                util.log("<b>" + data.playerName + "</b> hit a bomb! at " + data.x + "," + data.y);
            });
            that.socket.on("end-game", function(data) {
               util.log("<b>" + data.playerName + "</b> finished the board!");
               finishGame(data);
            });
            that.socket.on("game-start", function(data) {
               $(".board").show(); 
               $(".waiting").hide();
               util.message("<b>Game Started!</b>");
            });
            that.socket.on("move-made", function(data) {
                util.log("Game state is: " + JSON.stringify(data));

                that.state = data.board;
                that.players = data.players;
                util.log("<b>" + data.playerName + "</b> made a move: <b>" + data.x + "," + data.y + "</b> in game: <b>" + data.game + "</b>");
                refresh(data);
            });

            callback();
        });
    };

    Game.prototype.takeTurn = function(board, x, y) {
        this.socket.emit("turn", { "game" : this.gameId, "playerName" : this.playerName, "time" : new Date().getTime(), "x": x, "y": y });
    };

    Game.prototype.flag = function(board, x, y) {
        this.socket.emit("flag", { "game" : this.gameId, "playerName" : this.playerName, "time" : new Date().getTime(), "x": x, "y": y });
    };
    
    Game.prototype.start = function(board) {
        this.socket.emit("start", {game: this.gameId});
    };

    function refresh(data) {
        var templates = new multisweeper.Templates();
        templates.preload();
        templates.get("board", function(template) {
            $("#main").empty().html(template({uuid: data.gameId, board: data.board, players: data.players, active: data.active}));
        })
    };

    function finishGame(data) {
        var templates = new multisweeper.Templates();
        templates.preload();
        data.players.sort(byScore);
        templates.get("gameover", function(template) {
            $(".gameover").html(template({players: data.players}));
        })
        $(".overlay").show();
        $(".gameover").show();
    }

    function playerJoined(data) {
        util.log("<b>" + data.player.playerName + "</b> joined the game!");
        refresh(data);
    }

    function byScore(a, b) {
        return b.score - a.score;
    }
})(window.multisweeper = window.multisweeper || {}, jQuery);
