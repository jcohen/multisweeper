var RedisGameClient = require("./redis-game-client");

module.exports = function(app) {
    app.get('/', function(req, res){
        var gameClient = new RedisGameClient();
        gameClient.stats(function(err, data) {
            var games;
            var players;
            if (err) {
                console.log("error getting stats" + err);
                games = 0;
                players = 0;
                bombs = 0;
            } else {
                games = data.games;
                players = data.players;
                bombs = data.bombs;
            }
            res.render('index', {
                title: 'Multisweeper',
                games: games,
                bombs: bombs,
                players: players
            });
        })
    });

    app.get("/game", function(req, res) {
        res.render("game", {
            "title" : "Multisweeper"
        });
    });

    app.get("/scores", function(req, res) {
        var gameClient = new RedisGameClient();
        gameClient.loadScores(function (err, data) {
            if (err) {
                console.log("Error loading scores");
            }
            var results = []
            for (var i=0;i<data.length;i+=2) {
                results.push({'name': data[i], 'score': data[i+1]});
            }
            res.render("scores", {'scores': results});
        });
    });

    app.get("/nom", function(req, res) {
       res.cookie('bacon', 'nomnom');
       res.end('OK\n');
    });
};