(function(multisweeper, $) {
    var Game = multisweeper.Game = function(data, gameReadyCallback) {
        if (typeof data === "object") {
            // initializing from cookie
            this.playerName = data.player.playerName;
            this.gameId = data.gameId
        } else {
            this.playerName = data;
        }

        this.socket = io.connect("/");

        this.socket.on("name-in-use", nameInUse);

        this.socket.on("rejoin-failed", function(data) {
            console.log("Failed to rejoin existing game: %s, joining new game...", data);
            that.join();
        });

        var that = this;
        this.socket.on("game-assignment", function(data) {
            $(".social").show();
            that.state = data;
            util.log("Got game assignment: " + data.gameId);

            var cookie = {
                "gameId" : data.gameId,
                "player" : data.player
            };

            $.cookie("multisweeper", JSON.stringify(cookie));

            that.gameId = data.gameId;
            that.state = data.board;
            that.players = data.players;
            that.player = data.player;
            that.active = data.active;

            that.socket.on("new-player", playerJoined);

            that.socket.on("player-left", playerLeft);

            that.socket.on("mine-hit", function(data) {
                util.message(data.playerName, "hit a bomb!");
            });

            that.socket.on("end-game", function(data) {
                util.message(data.playerName, "finished the board!");
                finishGame(data);
            });

            that.socket.on("game-start", function(data) {
                $(".board").show();
                $(".waiting").hide();
                util.message("Game Started!");
            });

            that.socket.on("chat", function(data) {
                util.message(data.playerName + ":", data.message);
            });

            that.socket.on("move-made", function(data) {
                that.state = data.board;
                that.players = data.players;
                refresh(data);
            });

            gameReadyCallback();
        });
    };

    var util = multisweeper.Utils;
    var templates = util.templates;

    Game.prototype.join = function() {
        var that = this;

        this.socket.emit("join", { "playerName" : this.playerName });
    };

    Game.prototype.rejoin = function() {
        this.socket.emit("rejoin", { "playerName" : this.playerName, "gameId" : this.gameId });
    };

    Game.prototype.leave = function(callback) {
        this.socket.emit("leave", { "playerName" : this.playerName, "gameId" : this.gameId });

        this.socket.on("left-game", function(data) {
            callback(data);
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

    Game.prototype.chat = function(message) {
        this.socket.emit("chat", {game: this.gameId, "playerName" : this.playerName, "message": message});
    }

    function refresh(data) {
        templates.get("board", function(template) {
            $("#main").empty().html(template({uuid: data.gameId, board: data.board, players: data.players, active: data.active}));
        })
        $(".truncate").textTruncate();
    };

    function finishGame(data) {
        data.players.sort(byScore);
        templates.get("gameover", function(template) {
            var cookie = JSON.parse($.cookie("multisweeper"));
            var currentPlayer = "asd"; //cookie.player.playerName;
            var myScore;
            var myPlace;

            for (var i = 0, l = data.players.length; i < l; i++) {
                var player = data.players[i];
                if (player.playerName === currentPlayer) {
                    myScore = player.score;
                    myPlace = (i + 1);
                    break;
                }
            }

            $(".gameover").html(template({
                currentPlayer: currentPlayer,
                players: data.players,
                myScore: myScore,
                myPlace: myPlace,
                totalPlayers: data.players.length
            }));
        })
        $(".overlay").show();
        $(".gameover").show();
        $(".gameover .truncate").textTruncate({width: 240});
    }

    function nameInUse(data) {
        util.showModal("Name in use", "Oh no! Someone's already using that name! What are the odds of that?");
    }

    function playerJoined(data) {
        util.message(data.player.playerName, "joined the game!");
        refresh(data);
    }

    function playerLeft(data) {
        util.message(data.player.playerName, "left the game.");
        refresh(data);
    }

    function byScore(a, b) {
        return b.score - a.score;
    }
})(window.multisweeper = window.multisweeper || {}, jQuery);
